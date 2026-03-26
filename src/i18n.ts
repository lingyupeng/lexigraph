// Simple i18n for LexiGraph

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // App title
    appName: 'LexiGraph',

    // Onboarding
    onboarding: {
      welcome: 'Welcome to LexiGraph',
      selectDomains: 'Select up to 5 research domains to personalize your vocabulary analysis and knowledge network.',
      addCustomDomain: 'Add custom domain...',
      add: 'Add',
      of5Selected: 'of 5 selected',
      startExploring: 'Start Exploring',
    },

    // Navigation
    nav: {
      explore: 'Explore',
      graph: 'Graph',
      history: 'History',
      settings: 'Settings',
    },

    // Word Lookup
    lookup: {
      title: 'Lexical Exploration',
      subtitle: 'Enter words or phrases to build your research network.',
      placeholder: 'Enter words (one per line)...',
      analyze: 'Analyze Lexemes',
      addToGraph: 'Add to Graph',
      added: 'Added to Graph',
      wordsToAnalyze: 'Words to analyze',
      translationMeaning: 'Translation & Meaning',
      morphologyRoots: 'Morphology & Roots',
      prefix: 'Prefix',
      roots: 'Roots',
      suffix: 'Suffix',
      etymologyPath: 'Etymology Path',
      rootFamily: 'Root Family',
      domainContext: 'Domain Contextualization',
      academicExamples: 'Academic Examples',
      academicCollocations: 'Academic Collocations',
      lexiStory: 'The LexiStory',
      aiCrafting: 'AI is crafting your story...',
      verifiedBase: 'Verified Base',
      dictionaryApi: 'Dictionary API',
      certainty: 'certainty',
    },

    // Graph
    graph: {
      noData: 'No data available',
      noDataHint: 'Search for words and add them to the graph',
      recenter: 'Recenter View',
      showSettings: 'Show Settings',
      hideSettings: 'Hide Settings',
      showRoots: 'Show Roots',
      showLinks: 'Show Links',
      navigator: 'Navigator',
      searchGraph: 'Search graph...',
      lexemes: 'Lexemes (A-Z)',
      roots: 'Roots (A-Z)',
      noLexemes: 'No lexemes found',
      noRoots: 'No roots found',
      controls: 'Graph Controls',
      legend: 'Legend',
      domainCenter: 'Domain Center',
      lexemeWord: 'Lexeme (Word)',
      rootEtymology: 'Root (Etymology)',
      clearAll: 'Clear All',
    },

    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'Configure your research preferences and manage your data.',

      // API Config
      apiConfig: 'API Configuration',
      betaMode: 'Beta Mode (Internal Testing)',
      publicMode: 'Public Mode',
      betaDesc: 'Using built-in API. API key is protected.',
      publicDesc: 'Users configure their own API key.',
      switchToBeta: 'Switch to Beta',
      switchToPublic: 'Switch to Public',
      apiKeyProtected: 'API Key Protected',
      apiKeyProtectedDesc: 'The API key is stored on the server and not exposed to users.',
      configViaEnv: 'Configuration via .env file',
      configViaEnvDesc: 'Users need to configure their own API. Edit the .env file in the project root.',
      supportedProviders: 'Supported Providers',
      openaiCompatible: 'OpenAI Compatible',
      openaiDesc: 'OpenAI, toapis.com, Groq, etc.',
      minimax: 'MiniMax',
      minimaxDesc: 'MiniMax AI API',
      gemini: 'Gemini',
      geminiDesc: 'Google AI Gemini',
      exampleEnv: 'Example .env Configuration',

      // Research Domains
      researchDomains: 'Research Domains',
      researchDomainsDesc: 'Select and reorder disciplines. Main domain (top) generates 3 examples, others generate 1 each.',
      addCustomDomain: 'Add custom domain...',
      add: 'Add',
      noDomainsSelected: 'No domains selected. Using general academic context.',
      mainDomain: 'Main',

      // Data & Privacy
      dataPrivacy: 'Data & Privacy',
      enableLexiStory: 'Enable LexiStory',
      enableLexiStoryDesc: 'Generate mnemonic stories for vocabulary. Disable to speed up analysis.',
      clearCache: 'Clear Dictionary Cache',
      clearCacheDesc: 'Remove all local copies of AI-generated results to free up space.',
      cacheCleared: 'Cache cleared successfully.',
      resetAll: 'Reset Application',
      resetAllDesc: 'Wipe all data and start from scratch. This action is permanent.',
      resetConfirm: 'DANGER: This will delete ALL your history, graph data, and settings. This cannot be undone. Proceed?',

      // Language
      language: 'Language',
      languageDesc: 'Choose your preferred language for the interface.',
      english: 'English',
      chinese: '中文',

      // About
      about: 'About',
      aboutDesc: 'LexiGraph uses a hybrid lookup system. It first checks a local academic database, then queries the Free Dictionary API for phonetics, and finally uses AI to craft domain-specific academic context.',
      version: 'Version 1.0.0 • Academic Lexical Analysis Tool',
    },

    // Graph Settings
    graphSettings: {
      nodeSize: 'Node Size',
      bloom: 'Bloom',
      lineThickness: 'Line Thickness',
      labelSize: 'Label Size',
      linkDistance: 'Link Distance',
      colors: 'Colors',
      central: 'Central',
      lexeme: 'Lexeme',
      root: 'Root',
      wordLinks: 'Word Links',
      rootLinks: 'Root Links',
      domainLinks: 'Domain Links',
    },

    // Node Detail
    nodeDetail: {
      translation: 'Translation',
      story: 'Story',
      noStory: 'No story available.',
      domainRelevance: 'Domain Relevance',
      etymologicalDepth: 'Etymological Depth',
      meaning: 'Meaning',
      rootNote: 'This root is shared across multiple words in your research vocabulary.',
    },

    // History
    history: {
      title: 'Search History',
      clear: 'Clear History',
      empty: 'No search history yet.',
    },

    // Common
    common: {
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      deleteConfirm: 'Delete from graph?',
      save: 'Save',
      close: 'Close',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      uncertain: 'Uncertain',
    },
  },

  zh: {
    // App title
    appName: 'LexiGraph',

    // Onboarding
    onboarding: {
      welcome: '欢迎使用 LexiGraph',
      selectDomains: '选择最多5个研究领域来个性化您的词汇分析和知识网络。',
      addCustomDomain: '添加自定义领域...',
      add: '添加',
      of5Selected: '已选 5 个',
      startExploring: '开始探索',
    },

    // Navigation
    nav: {
      explore: '探索',
      graph: '图谱',
      history: '历史',
      settings: '设置',
    },

    // Word Lookup
    lookup: {
      title: '词汇探索',
      subtitle: '输入单词或短语来构建你的研究网络。',
      placeholder: '输入词汇（每行一个）...',
      analyze: '分析词汇',
      addToGraph: '添加到图谱',
      added: '已添加',
      wordsToAnalyze: '待分析词汇',
      translationMeaning: '翻译与含义',
      morphologyRoots: '形态学与词根',
      prefix: '前缀',
      roots: '词根',
      suffix: '后缀',
      etymologyPath: '词源路径',
      rootFamily: '词根家族',
      domainContext: '领域语境',
      academicExamples: '学术例句',
      academicCollocations: '学术搭配',
      lexiStory: '词汇故事',
      aiCrafting: 'AI正在编写故事...',
      verifiedBase: '已验证基础',
      dictionaryApi: '词典API',
      certainty: '确定性',
    },

    // Graph
    graph: {
      noData: '暂无数据',
      noDataHint: '搜索词汇并添加到图谱',
      recenter: '重新居中',
      showSettings: '显示设置',
      hideSettings: '隐藏设置',
      showRoots: '显示词根',
      showLinks: '显示连线',
      navigator: '导航',
      searchGraph: '搜索图谱...',
      lexemes: '词汇 (A-Z)',
      roots: '词根 (A-Z)',
      noLexemes: '未找到词汇',
      noRoots: '未找到词根',
      controls: '图谱控制',
      legend: '图例',
      domainCenter: '领域中心',
      lexemeWord: '词汇',
      rootEtymology: '词根 (词源)',
      clearAll: '清除全部',
    },

    // Settings
    settings: {
      title: '设置',
      subtitle: '配置你的研究偏好并管理数据。',

      // API Config
      apiConfig: 'API 配置',
      betaMode: '内测模式',
      publicMode: '公开模式',
      betaDesc: '使用内置API，API密钥受保护。',
      publicDesc: '用户需配置自己的API密钥。',
      switchToBeta: '切换到内测',
      switchToPublic: '切换到公开',
      apiKeyProtected: 'API密钥已保护',
      apiKeyProtectedDesc: 'API密钥存储在服务器端，不会暴露给用户。',
      configViaEnv: '通过.env文件配置',
      configViaEnvDesc: '用户需要配置自己的API。编辑项目根目录下的.env文件。',
      supportedProviders: '支持的提供商',
      openaiCompatible: 'OpenAI兼容',
      openaiDesc: 'OpenAI、toapis.com、Groq等',
      minimax: 'MiniMax',
      minimaxDesc: 'MiniMax AI API',
      gemini: 'Gemini',
      geminiDesc: 'Google AI Gemini',
      exampleEnv: '.env 配置示例',

      // Research Domains
      researchDomains: '研究领域',
      researchDomainsDesc: '选择并排序学科。第一个（主领域）生成3个例句，其他生成1个。',
      addCustomDomain: '添加自定义领域...',
      add: '添加',
      noDomainsSelected: '未选择领域，使用通用学术背景。',
      mainDomain: '主',

      // Data & Privacy
      dataPrivacy: '数据与隐私',
      enableLexiStory: '启用LexiStory',
      enableLexiStoryDesc: '为词汇生成助记故事。关闭可加快分析速度。',
      clearCache: '清除词典缓存',
      clearCacheDesc: '删除所有本地缓存的AI生成结果以释放空间。',
      cacheCleared: '缓存已清除。',
      resetAll: '重置应用',
      resetAllDesc: '删除所有历史、图谱数据和设置。此操作不可撤销。',
      resetConfirm: '危险：此操作将删除所有历史、图谱数据和设置。此操作不可撤销。确定继续吗？',

      // Language
      language: '语言',
      languageDesc: '选择你喜欢的界面语言。',
      english: 'English',
      chinese: '中文',

      // About
      about: '关于',
      aboutDesc: 'LexiGraph使用混合查询系统。首先检查本地学术数据库，然后查询Free Dictionary API获取音标，最后使用AI生成特定领域的学术内容。',
      version: '版本 1.0.0 • 学术词汇分析工具',
    },

    // Graph Settings
    graphSettings: {
      nodeSize: '节点大小',
      bloom: '发光效果',
      lineThickness: '线条粗细',
      labelSize: '标签大小',
      linkDistance: '连线距离',
      colors: '颜色',
      central: '中心',
      lexeme: '词汇',
      root: '词根',
      wordLinks: '词汇连线',
      rootLinks: '词根连线',
      domainLinks: '领域连线',
    },

    // Node Detail
    nodeDetail: {
      translation: '翻译',
      story: '故事',
      noStory: '暂无故事。',
      domainRelevance: '领域相关性',
      etymologicalDepth: '词源深度',
      meaning: '含义',
      rootNote: '此词根在你的研究词汇中多个词共享。',
    },

    // History
    history: {
      title: '搜索历史',
      clear: '清除历史',
      empty: '暂无搜索历史。',
    },

    // Common
    common: {
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      deleteConfirm: '从图谱中删除？',
      save: '保存',
      close: '关闭',
      high: '高',
      medium: '中',
      low: '低',
      uncertain: '不确定',
    },
  },
};

export function t(key: string, lang: Language): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}
