import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { word, domains = [], enableStory = true } = req.body;

  const apiKey = process.env.VITE_OPENAI_API_KEY;
  const endpoint = process.env.VITE_OPENAI_API_ENDPOINT || 'https://api.openai.com/v1';
  const model = process.env.VITE_OPENAI_MODEL || 'gpt-4o-nano';

  if (!apiKey) {
    return res.status(500).json({ error: 'No API key configured' });
  }

  const storyField = enableStory
    ? '"story": {"text": "string", "is_analogy": false, "notes": "string"},'
    : '"story": null,';

  const domainList = domains.length > 0 ? domains : ['General Research'];
  const domainInstructions = domainList.map((d: string, i: number) =>
    i === 0 ? `- ${d}: 生成3个例句` : `- ${d}: 生成1个例句`
  ).join('\n');

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
    "prefix": "string|null",
    "roots": [{"text": "string", "meaning": "string"}],
    "suffix": ["string"]
  },
  "etymology": {"path": ["string"], "explanations": ["string"], "certainty": "high|medium|low"},
  "root_family": [{"word": "string", "translation": "string"}],
  ${storyField}
  "domain_context": [{
    "domain": "string",
    "typical_scenes": ["string"],
    "examples": ["string"]
  }],
  "collocations": ["string"],
  "relevance_score": "string",
  "etymological_depth_score": "string",
  "suggested_edges": [{"type": "string", "from": "${word}", "to": "string"}]
}

Requirements:
1. All Chinese content must be in SIMPLIFIED CHINESE (简体中文)
2. morphology: 只包含有拉丁或希腊语源的真正词根/词缀
3. domain_context: 必须EXACTLY按照上面指定的领域生成
4. relevance_score & etymological_depth_score: 格式必须为带%的字符串，如"85%"
5. JSON only, no markdown formatting`;

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error:', errorText);
      return res.status(response.status).json({ error: `API error: ${errorText}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No content from API' });
    }

    // Try to parse JSON
    let jsonStr = content;
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      jsonStr = content.substring(start, end + 1);
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return res.json(parsed);
    } catch {
      return res.status(500).json({ error: 'Failed to parse API response as JSON' });
    }
  } catch (error: any) {
    console.error('[API] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
