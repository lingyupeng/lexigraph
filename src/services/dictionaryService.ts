export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string; synonyms: string[]; antonyms: string[] }[];
    synonyms: string[];
    antonyms: string[];
  }[];
}

export async function fetchDictionaryData(word: string): Promise<Partial<DictionaryEntry> | null> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (error) {
    console.error("Dictionary API fetch failed:", error);
    return null;
  }
}

// Spell check using Datamuse API (returns top spelling suggestion or null)
export async function fetchSpellSuggestion(word: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(word.toLowerCase())}`);
    if (!response.ok) return null;
    const data = await response.json();
    // Returns array of { word, score }, top result is best suggestion
    if (Array.isArray(data) && data.length > 0 && data[0].word) {
      const suggestion = data[0].word;
      // Only suggest if it's actually different from the input
      if (suggestion.toLowerCase() !== word.toLowerCase()) {
        return suggestion;
      }
    }
    return null;
  } catch (error) {
    console.error("Spell check failed:", error);
    return null;
  }
}
