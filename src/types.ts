export type Domain = string;

export interface Morphology {
  prefix: string | null;
  roots: { text: string; meaning: string }[];
  suffix: string[];
}

export interface Etymology {
  path: string[];
  explanations?: string[];
  certainty: 'high' | 'medium' | 'low' | 'uncertain';
}

export interface DomainContext {
  domain: string;
  typical_scenes: string[];
  examples: string[];
}

export interface Story {
  text: string;
  is_analogy: boolean;
  notes?: string;
}

export interface LexemeData {
  lexeme: string;
  pos: string;
  ipa: string;
  syllables: string[];
  translation_zh: string[];
  morphology: Morphology;
  etymology: Etymology;
  root_family: { word: string; translation: string }[];
  story: Story;
  domain_context: DomainContext[];
  collocations: string[];
  relevance_score: number; // 0-100, relevance to the primary research domain
  etymological_depth_score: number; // 0-100, complexity/productivity of the root
  suggested_edges: {
    type: string;
    from: string;
    to: string;
  }[];
}

export type NodeType = 'lexeme' | 'root' | 'concept' | 'example' | 'source';

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  val?: number;
  color?: string;
  data?: any;
}

export interface GraphLink {
  id?: string;
  source: string;
  target: string;
  type: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface UserProfile {
  selectedDomains: Domain[];
  hasCompletedOnboarding: boolean;
}
