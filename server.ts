import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();;

// Load runtime config (overrides .env if exists)
interface ApiConfig {
  provider: string;
  apiKey: string;
  endpoint: string;
  model: string;
}

function loadRuntimeConfig(): ApiConfig {
  const configPath = path.join(process.cwd(), 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log('Loaded runtime config from config.json');
      return config;
    }
  } catch (e) {
    console.error('Failed to load config.json:', e);
  }
  return {
    provider: process.env.VITE_OPENAI_API_KEY ? 'openai' : 'gemini',
    apiKey: process.env.VITE_OPENAI_API_KEY || process.env.GEMINI_API_KEY || '',
    endpoint: process.env.VITE_OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
    model: process.env.VITE_OPENAI_MODEL || 'gpt-4o-nano'
  };
}

const runtimeConfig = loadRuntimeConfig();

// ─── Morpheme Database ────────────────────────────────────────────────────────
interface MorphemeEntry {
  forms: { root: string; form: string; loc: string; attach_to?: string[]; category?: string }[];
  meaning: string[];
  origin: string;
  etymology: string;
  examples: string[];
}

// Load morphemes.json at startup
let morphemeDb: Record<string, MorphemeEntry> = {};
try {
  const morphemePath = path.join(process.cwd(), 'src/morphemes.json');
  if (fs.existsSync(morphemePath)) {
    morphemeDb = JSON.parse(fs.readFileSync(morphemePath, 'utf-8'));
    console.log(`[MorphemeDB] Loaded ${Object.keys(morphemeDb).length} entries`);
  }
} catch (e) {
  console.warn('[MorphemeDB] Could not load morphemes.json:', e);
}

// Build lookup maps: normalized key → canonical entry
// prefixMap: lowercased root form → entry (e.g., "ab" → entry for "ab-")
const prefixMap = new Map<string, MorphemeEntry>();
// suffixMap: lowercased root form → entry (e.g., "tion" → entry for "-tion")
const suffixMap = new Map<string, MorphemeEntry>();
// rootMap: lowercased embedded root form → entry (e.g., "trib" → entry for "trib")
const rootMap = new Map<string, MorphemeEntry>();

for (const [key, entry] of Object.entries(morphemeDb)) {
  for (const form of entry.forms) {
    const loc = form.loc;
    // Split by comma to handle compound roots like "trib-, tript-"
    const rootParts = form.root.toLowerCase().split(/[,\s]+/).map(r => r.replace(/-/g, '')).filter(r => r.length > 0);
    const formParts = form.form.toLowerCase().split(/[,\s]+/).map(r => r.replace(/-/g, '')).filter(r => r.length > 0);
    const allParts = [...rootParts, ...formParts];

    if (loc === 'prefix') {
      for (const p of allParts) {
        if (!prefixMap.has(p)) prefixMap.set(p, entry);
      }
    } else if (loc === 'suffix') {
      for (const p of allParts) {
        if (!suffixMap.has(p)) suffixMap.set(p, entry);
      }
    } else if (loc === 'embedded') {
      for (const p of allParts) {
        if (!rootMap.has(p)) rootMap.set(p, entry);
      }
    }
  }
}

// Find closest matching root using simple edit distance
function findClosestRoot(target: string, maxDist = 2): string | null {
  const t = target.toLowerCase();
  for (const [key] of rootMap) {
    if (key.length < 2) continue;
    let dist = Math.abs(key.length - t.length);
    if (dist > maxDist) continue;
    // Simple character-level similarity
    let matches = 0;
    for (let i = 0; i < Math.min(key.length, t.length); i++) {
      if (key[i] === t[i]) matches++;
    }
    const similarity = matches / Math.max(key.length, t.length);
    if (similarity >= 0.6) return key;
  }
  return null;
}

// Validate and correct a single root (only correct text, preserve AI's meaning)
function validateRoot(rootText: string, aiMeaning?: string): { text: string; meaning: string; corrected: boolean } {
  const normalized = rootText.toLowerCase().replace(/[^a-z]/g, '');
  if (rootMap.has(normalized)) {
    // Root is valid — keep AI's meaning, just return original text
    return { text: rootText, meaning: aiMeaning || '', corrected: false };
  }
  // Try to find closest match and correct
  const closest = findClosestRoot(normalized);
  if (closest) {
    console.log(`[MorphemeDB] Root纠正: "${rootText}" → "${closest}"`);
    return { text: closest, meaning: aiMeaning || '', corrected: true };
  }
  console.warn(`[MorphemeDB] Unknown root: "${rootText}"`);
  return { text: rootText, meaning: aiMeaning || '', corrected: false };
}

// Validate full morphology section from AI response
function validateMorphology(morph: any): any {
  if (!morph) return morph;
  const validated: any = {
    prefix: morph.prefix || null,
    roots: [],
    suffix: morph.suffix || []
  };

  // Validate each root — preserve AI's meaning, only correct text
  if (Array.isArray(morph.roots)) {
    for (const root of morph.roots) {
      if (root && typeof root === 'object' && root.text) {
        const result = validateRoot(root.text, root.meaning);
        validated.roots.push({
          text: result.text,
          meaning: root.meaning || '' // always preserve AI's meaning
        });
      } else if (root && typeof root === 'string') {
        const result = validateRoot(root);
        validated.roots.push({ text: result.text, meaning: '' });
      }
    }
  }

  return validated;
}

// ─── Helper to extract the first balanced JSON object from a string
const extractJson = (str: string) => {
  // Remove markdown code blocks first
  let cleaned = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let count = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') count++;
      else if (char === '}') count--;
      if (count === 0) return cleaned.substring(start, i + 1);
    }
  }
  return null;
};

// Helper to parse and repair JSON
const parseAndRepairJson = (jsonStr: string) => {
  const normalizeLexeme = (data: any): any => {
    if (data && typeof data === 'object') {
      if (data.lexeme && typeof data.lexeme === 'string') {
        data.lexeme = data.lexeme.toLowerCase();
      }
      // Validate and correct morphology using morpheme database
      if (data.morphology) {
        data.morphology = validateMorphology(data.morphology);
      }
    }
    return data;
  };

  try {
    // First try standard parse
    const parsed = JSON.parse(jsonStr);
    return normalizeLexeme(parsed);
  } catch (parseError) {
    try {
      // If that fails, try to repair it
      const repaired = jsonrepair(jsonStr);
      const parsed = JSON.parse(repaired);
      return normalizeLexeme(parsed);
    } catch (repairError) {
      console.error("JSON Repair failed:", repairError);
      // If repair fails, try one last aggressive cleanup for common AI mistakes
      // 1. Remove trailing commas in objects and arrays
      let cleaned = jsonStr.replace(/,\s*([\]}])/g, '$1');
      // 2. Fix missing quotes around keys (very basic)
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

      try {
        const parsed = JSON.parse(cleaned);
        return normalizeLexeme(parsed);
      } catch (finalError) {
        throw new Error(`JSON parsing failed after multiple attempts. Raw: ${jsonStr.substring(0, 100)}...`);
      }
    }
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to update config
  app.post("/api/config", (req, res) => {
    const { apiKey, endpoint, model, provider } = req.body;
    const configPath = path.join(process.cwd(), 'config.json');
    const newConfig = { provider, apiKey, endpoint, model };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    // Update runtime config
    Object.assign(runtimeConfig, newConfig);
    res.json({ success: true, message: 'Config saved. Restart server to apply changes.' });
  });

  // API Route for Lexical Analysis
  app.post("/api/analyze", async (req, res) => {
    const { word, domains = [], enableStory = true } = req.body;

    // Use runtimeConfig (from config.json or .env)
    const miniMaxKey = runtimeConfig.provider === 'minimax' ? runtimeConfig.apiKey : process.env.VITE_MINIMAX_API_KEY;
    const openaiKey = runtimeConfig.provider === 'openai' ? runtimeConfig.apiKey : process.env.VITE_OPENAI_API_KEY;
    const openaiEndpoint = runtimeConfig.endpoint || process.env.VITE_OPENAI_API_ENDPOINT || "https://api.openai.com/v1";
    const openaiModel = runtimeConfig.model || process.env.VITE_OPENAI_MODEL || "gpt-4o-nano";
    const geminiKey = runtimeConfig.provider === 'gemini' ? runtimeConfig.apiKey : process.env.GEMINI_API_KEY;

    const storyField = enableStory
      ? '"story": {"text": "string (2-3句简短助记故事或类比，中英双语)", "is_analogy": boolean, "notes": "string (学习技巧，中英双语)"},'
      : '"story": null,';
    const storyReq = enableStory ? '\n    4. story: 生成简短助记故事' : '';

    // Build domain instruction: first domain gets 3 examples, others get 1
    const domainList = domains.length > 0 ? domains : ['General Research'];
    const domainInstructions = domainList.map((d, i) => {
      if (i === 0) {
        return `- ${d}: 生成3个例句，这是主要研究领域`;
      } else {
        return `- ${d}: 生成1个例句`;
      }
    }).join('\n');

    const prompt = `Analyze the word/phrase "${word}" for a research-oriented vocabulary system.

CRITICAL CONSTRAINT - You MUST strictly follow these domains ONLY:
${domainInstructions}

Do NOT invent, add, or assume any other research domains besides those listed above.

Return ONLY valid JSON (no markdown, no extra text):
{
  "lexeme": "string",
  "pos": "string",
  "ipa": "string",
  "syllables": ["string"],
  "translation_zh": ["string"],
  "morphology": {
    "prefix": "string|null (真实拉丁/希腊词根前缀，如in-, ex-, pre-)",
    "roots": [{"text": "string (词根英文原文，必须是独立的拉丁/希腊词根形式，禁止是带词尾变化的完整动词。例如：duc(非ducere)，scrib(非scribere)，trah(非trahere)，port(非portare)，aud(非audire)，vid(非videre)，manus(非manum)，graph(非graphia))", "meaning": "string (词根含义，中英双语如'manus > 手 > hand')"}],
    "suffix": ["string (真实后缀及来源，如-tion, -ment, -ity)"]
  },
  "etymology": {"path": ["string (词源路径，如Latin > Old French > Middle English)"], "explanations": ["string (每步演变的具体解释，中英双语，说明词义如何变化)"], "certainty": "high|medium|low"},
  "root_family": [{"word": "string", "translation": "string (中英双语如'手册 manual (hand book)')"}],
  ${storyField}
  "domain_context": [{
    "domain": "string (必须是上面列表中的领域，不能是其他领域)",
    "typical_scenes": ["string (论文中的典型使用场景，必须属于指定的领域)",
    "examples": ["string (学术论文例句格式：'原句 | 翻译'，必须来自指定的领域，不能来自AI、HCI、心理学等其他领域)"]
  }],
  "collocations": ["string (搭配表达，中英双语如'perform analysis | 执行分析')"],
  "relevance_score": "string (0-100%，必须使用完整范围如'15%'、'42%'、'78%'等，指与研究领域的相关性。普通常见词给5-30%，中等相关给30-60%，高度相关才给60-100%)",
  "etymological_depth_score": "string (0-100%，必须使用完整范围如'15%'、'42%'、'78%'等，指词根生产力/复杂度。简单词给5-30%，中等复杂度30-60%，高复杂度才给60-100%)",
  "suggested_edges": [{"type": "SYNONYM|ANTONYM|DERIVATIVE|COMPONENT|FIELD_APPLICATION", "from": "${word}", "to": "string (相关词汇)"}]
}

Requirements:
1. All Chinese content must be in SIMPLIFIED CHINESE (简体中文)
2. morphology: 只包含有拉丁或希腊语源的真正词根/词缀，不要编造如"ambi-"这样的词根
3. roots: 必须是独立的拉丁/希腊词根形式。拉丁动词变化规则：-ere动词→去掉-re取词根(如ducere→duc, trahere→trah, scribere→scrib)；-are动词→去掉-re取词根(如portare→port, nominare→nomin)；-ire动词→去掉-re取词根(如audire→aud, venire→ven)。禁止出现任何动词不定式后缀(-ere/-are/-ire)在词根中！
4. 词根不能是带变化后缀的完整单词，必须是最短的独立词根。例如：contribute→trib, conduct→duc, export→port, write→scrib, read→leg, see→vid, hear→aud, come→ven
5. domain_context: 必须EXACTLY按照上面指定的领域生成，数组长度必须等于领域数量，每个领域的examples数量必须符合要求
6. relevance_score & etymological_depth_score: 格式必须为带%的字符串，如"85%"。必须使用完整0-100%范围，区分度要明显！
7. JSON only, no markdown formatting
8. ABSOLUTELY DO NOT include examples from domains not listed above (especially NOT AI, HCI, Psychology, Education unless explicitly listed)`;

    try {
      if (miniMaxKey) {
        console.log("Using MiniMax via OpenAI-compatible Server Proxy");
        const response = await fetch("https://api.minimaxi.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${miniMaxKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "MiniMax-M2.5",
            messages: [
              { 
                role: "system", 
                content: "You are a helpful assistant that returns structured JSON data for lexical analysis. Always respond with valid JSON only." 
              },
              { role: "user", content: prompt }
            ],
            temperature: 1.0,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("MiniMax API Error:", errorText);
          return res.status(response.status).json({ error: `MiniMax API error: ${errorText}` });
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
          console.error("Unexpected MiniMax response structure:", data);
          throw new Error("Invalid response from MiniMax API: 'choices' is missing or empty.");
        }
        const content = data.choices[0].message.content;
        if (!content) throw new Error("No content from MiniMax");
        
// Helper to extract the first balanced JSON object from a string
// (Removed duplicate function)

        const jsonStr = extractJson(content);
        if (!jsonStr) {
          console.error("No JSON found in content:", content);
          throw new Error("The AI response did not contain a valid JSON object.");
        }
        
        return res.json(parseAndRepairJson(jsonStr));
      } else if (openaiKey) {
        console.log(`Using OpenAI-compatible API: ${openaiModel} at ${openaiEndpoint}`);
        const response = await fetch(`${openaiEndpoint}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant. You must ALWAYS respond with valid JSON only, no markdown, no explanations."
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI API Error:", errorText);
          return res.status(response.status).json({ error: `OpenAI API error: ${errorText}` });
        }

        const data = await response.json();
        console.log("OpenAI response data:", JSON.stringify(data).substring(0, 500));
        if (!data.choices || data.choices.length === 0) {
          console.error("Unexpected OpenAI response structure:", data);
          throw new Error("Invalid response from OpenAI API: 'choices' is missing or empty.");
        }
        const content = data.choices[0].message.content;
        console.log("AI content:", content?.substring(0, 300));
        if (!content) throw new Error("No content from OpenAI");

        // Try to extract and parse JSON
        let jsonStr = extractJson(content);
        if (!jsonStr) {
          // If extraction failed, try repairing the whole content
          try {
            const repaired = jsonrepair(content);
            const parsed = JSON.parse(repaired);
            return res.json(parsed);
          } catch (e) {
            console.error("Failed to parse JSON:", content.substring(0, 200));
            throw new Error("The AI response did not contain a valid JSON object.");
          }
        }

        return res.json(parseAndRepairJson(jsonStr));
      } else if (geminiKey) {
        console.log("Using Gemini via Server Proxy");
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        if (!response.text) throw new Error("No content from Gemini");
        
        const jsonStr = extractJson(response.text);
        if (!jsonStr) throw new Error("No JSON found in Gemini response");
        return res.json(parseAndRepairJson(jsonStr));
      } else {
        return res.status(500).json({ error: "No AI provider configured" });
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
