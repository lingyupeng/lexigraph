import { LexemeData } from '../types';

// A small sample dictionary of common academic words
// In a real app, this would be a much larger JSON file or a database
export const ACADEMIC_DICTIONARY: Record<string, Partial<LexemeData>> = {
  "analyze": {
    lexeme: "analyze",
    pos: "verb",
    ipa: "/ˈæn.ə.laɪz/",
    syllables: ["an", "a", "lyze"],
    translation_zh: ["分析", "解析"],
    morphology: {
      prefix: null,
      roots: [{ text: "ana-", meaning: "向上，彻底" }, { text: "ly-", meaning: "松开，分解" }],
      suffix: ["-ize (动词后缀)"]
    },
    etymology: {
      path: ["Greek: analyein", "French: analyser"],
      certainty: "high"
    },
    root_family: [
      { word: "analysis", translation: "分析 (n.)" },
      { word: "analyst", translation: "分析师" },
      { word: "analytic", translation: "分析的" }
    ]
  },
  "hypothesis": {
    lexeme: "hypothesis",
    pos: "noun",
    ipa: "/haɪˈpɒθ.ə.sɪs/",
    syllables: ["hy", "poth", "e", "sis"],
    translation_zh: ["假设", "假说"],
    morphology: {
      prefix: "hypo- (在...之下)",
      roots: [{ text: "the-", meaning: "放置" }],
      suffix: ["-sis (名词后缀)"]
    },
    etymology: {
      path: ["Greek: hypothesis"],
      certainty: "high"
    },
    root_family: [
      { word: "hypothetical", translation: "假设的" },
      { word: "hypothesize", translation: "假设 (v.)" },
      { word: "thesis", translation: "论文，论题" }
    ]
  },
  "paradigm": {
    lexeme: "paradigm",
    pos: "noun",
    ipa: "/ˈpær.ə.daɪm/",
    syllables: ["par", "a", "digm"],
    translation_zh: ["范式", "典范"],
    morphology: {
      prefix: "para- (在...旁边)",
      roots: [{ text: "deik-", meaning: "展示" }],
      suffix: []
    },
    etymology: {
      path: ["Greek: paradeigma", "Latin: paradigma"],
      certainty: "high"
    },
    root_family: [
      { word: "paradigmatic", translation: "范式的" }
    ]
  },
  "empirical": {
    lexeme: "empirical",
    pos: "adj",
    ipa: "/ɪmˈpɪr.ɪ.kəl/",
    syllables: ["em", "pir", "i", "cal"],
    translation_zh: ["经验主义的", "实证的"],
    morphology: {
      prefix: "en- (在...之内)",
      roots: [{ text: "peira-", meaning: "尝试，试验" }],
      suffix: ["-ic", "-al"]
    },
    etymology: {
      path: ["Greek: empeirikos", "Latin: empiricus"],
      certainty: "high"
    },
    root_family: [
      { word: "empiricism", translation: "经验主义" },
      { word: "empiricist", translation: "经验主义者" }
    ]
  },
  "synthesis": {
    lexeme: "synthesis",
    pos: "noun",
    ipa: "/ˈsɪn.θə.sɪs/",
    syllables: ["syn", "the", "sis"],
    translation_zh: ["综合", "合成"],
    morphology: {
      prefix: "syn- (共同)",
      roots: [{ text: "the-", meaning: "放置" }],
      suffix: ["-sis"]
    },
    etymology: {
      path: ["Greek: synthesis"],
      certainty: "high"
    },
    root_family: [
      { word: "synthetic", translation: "合成的" },
      { word: "synthesize", translation: "综合 (v.)" },
      { word: "photosynthesis", translation: "光合作用" }
    ]
  },
  "epistemology": {
    lexeme: "epistemology",
    pos: "noun",
    ipa: "/ɪˌpɪs.təˈmɒl.ə.dʒi/",
    syllables: ["e", "pis", "te", "mol", "o", "gy"],
    translation_zh: ["认识论"],
    morphology: {
      prefix: null,
      roots: [{ text: "episteme-", meaning: "知识" }, { text: "logos-", meaning: "研究" }],
      suffix: ["-y"]
    },
    etymology: {
      path: ["Greek: episteme", "Greek: logos"],
      certainty: "high"
    },
    root_family: [
      { word: "epistemic", translation: "认识的" }
    ]
  },
  "methodology": {
    lexeme: "methodology",
    pos: "noun",
    ipa: "/ˌmeθ.əˈdɒl.ə.dʒi/",
    syllables: ["meth", "od", "ol", "o", "gy"],
    translation_zh: ["方法论"],
    morphology: {
      prefix: "meta- (之后，超越)",
      roots: [{ text: "hodos-", meaning: "路" }, { text: "logos-", meaning: "研究" }],
      suffix: ["-y"]
    },
    etymology: {
      path: ["Greek: methodos", "Greek: logos"],
      certainty: "high"
    },
    root_family: [
      { word: "method", translation: "方法" },
      { word: "methodical", translation: "有条理的" }
    ]
  },
  "qualitative": {
    lexeme: "qualitative",
    pos: "adj",
    ipa: "/ˈkwɒl.ɪ.tə.tɪv/",
    syllables: ["qual", "i", "ta", "tive"],
    translation_zh: ["定性的", "性质上的"],
    morphology: {
      prefix: null,
      roots: [{ text: "qualis-", meaning: "什么样的" }],
      suffix: ["-ative"]
    },
    etymology: {
      path: ["Latin: qualitas"],
      certainty: "high"
    },
    root_family: [
      { word: "quality", translation: "质量，品质" },
      { word: "qualify", translation: "限定，修饰" }
    ]
  },
  "quantitative": {
    lexeme: "quantitative",
    pos: "adj",
    ipa: "/ˈkwɒn.tɪ.tə.tɪv/",
    syllables: ["quan", "ti", "ta", "tive"],
    translation_zh: ["定量的", "数量上的"],
    morphology: {
      prefix: null,
      roots: [{ text: "quantus-", meaning: "多少" }],
      suffix: ["-ative"]
    },
    etymology: {
      path: ["Latin: quantitas"],
      certainty: "high"
    },
    root_family: [
      { word: "quantity", translation: "数量" },
      { word: "quantify", translation: "量化" }
    ]
  },
  "phenomenon": {
    lexeme: "phenomenon",
    pos: "noun",
    ipa: "/fəˈnɒm.ɪ.nən/",
    syllables: ["phe", "nom", "e", "non"],
    translation_zh: ["现象"],
    morphology: {
      prefix: null,
      roots: [{ text: "phain-", meaning: "显示，出现" }],
      suffix: ["-on"]
    },
    etymology: {
      path: ["Greek: phainomenon"],
      certainty: "high"
    },
    root_family: [
      { word: "phenomenal", translation: "现象的，非凡的" },
      { word: "phenomenology", translation: "现象学" }
    ]
  },
  "correlation": {
    lexeme: "correlation",
    pos: "noun",
    ipa: "/ˌkɒr.əˈleɪ.ʃən/",
    syllables: ["cor", "re", "la", "tion"],
    translation_zh: ["相关性", "关联"],
    morphology: {
      prefix: "cor- (共同)",
      roots: [{ text: "relat-", meaning: "携带，关系" }],
      suffix: ["-ion"]
    },
    etymology: {
      path: ["Latin: correlatio"],
      certainty: "high"
    },
    root_family: [
      { word: "correlate", translation: "相关 (v.)" },
      { word: "relative", translation: "相对的" }
    ]
  },
  "causality": {
    lexeme: "causality",
    pos: "noun",
    ipa: "/kɔːˈzæl.ə.ti/",
    syllables: ["cau", "sal", "i", "ty"],
    translation_zh: ["因果关系"],
    morphology: {
      prefix: null,
      roots: [{ text: "caus-", meaning: "原因" }],
      suffix: ["-ality"]
    },
    etymology: {
      path: ["Latin: causalitas"],
      certainty: "high"
    },
    root_family: [
      { word: "cause", translation: "原因" },
      { word: "causal", translation: "因果的" }
    ]
  },
  "validation": {
    lexeme: "validation",
    pos: "noun",
    ipa: "/ˌvæl.ɪˈdeɪ.ʃən/",
    syllables: ["val", "i", "da", "tion"],
    translation_zh: ["验证", "合法化"],
    morphology: {
      prefix: null,
      roots: [{ text: "val-", meaning: "强壮，价值" }],
      suffix: ["-ation"]
    },
    etymology: {
      path: ["Latin: validatio"],
      certainty: "high"
    },
    root_family: [
      { word: "valid", translation: "有效的" },
      { word: "validate", translation: "验证 (v.)" },
      { word: "validity", translation: "有效性" }
    ]
  },
  "iteration": {
    lexeme: "iteration",
    pos: "noun",
    ipa: "/ˌɪt.əˈreɪ.ʃən/",
    syllables: ["it", "er", "a", "tion"],
    translation_zh: ["迭代"],
    morphology: {
      prefix: null,
      roots: [{ text: "iter-", meaning: "再次" }],
      suffix: ["-ation"]
    },
    etymology: {
      path: ["Latin: iteratio"],
      certainty: "high"
    },
    root_family: [
      { word: "iterate", translation: "迭代 (v.)" },
      { word: "iterative", translation: "迭代的" }
    ]
  }
};
