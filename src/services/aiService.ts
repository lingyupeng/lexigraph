import { LexemeData } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function analyzeWord(word: string, domains: string[]): Promise<LexemeData> {
  const enableStory = localStorage.getItem('lexistories_enabled') === 'true';
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ word, domains, enableStory }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to analyze word");
  }

  return response.json();
}
