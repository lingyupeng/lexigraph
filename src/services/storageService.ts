import { KnowledgeGraph, UserProfile, LexemeData, GraphNode, GraphLink } from "../types";

const STORAGE_KEYS = {
  PROFILE: 'lexigraph_profile',
  GRAPH: 'lexigraph_graph',
  HISTORY: 'lexigraph_history'
};

export const storageService = {
  getProfile(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : { selectedDomains: [], hasCompletedOnboarding: false };
  },

  saveProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getGraph(): KnowledgeGraph {
    const data = localStorage.getItem(STORAGE_KEYS.GRAPH);
    return data ? JSON.parse(data) : { nodes: [], links: [] };
  },

  saveGraph(graph: KnowledgeGraph) {
    localStorage.setItem(STORAGE_KEYS.GRAPH, JSON.stringify(graph));
  },

  getHistory(): LexemeData[] {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveHistory(history: LexemeData[]) {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  addToHistory(lexeme: LexemeData) {
    const history = this.getHistory();
    const filtered = history.filter(h => h.lexeme !== lexeme.lexeme);
    this.saveHistory([lexeme, ...filtered].slice(0, 50));
  },

  addToGraph(lexeme: LexemeData) {
    const graph = this.getGraph();

    // Helper to normalize root text (remove hyphens, etc)
    const normalizeRoot = (text: string) => text.replace(/^-/, '').toLowerCase();

    // Add Lexeme Node
    if (!graph.nodes.find(n => n.id === lexeme.lexeme)) {
      graph.nodes.push({
        id: lexeme.lexeme,
        name: lexeme.lexeme,
        type: 'lexeme',
        val: 10,
        data: lexeme
      });
    }

    // Add Root Nodes - normalize to avoid duplicates like "graph" vs "-graph"
    lexeme.morphology.roots.forEach(rootObj => {
      const normalizedRoot = normalizeRoot(rootObj.text);
      const rootId = `root_${normalizedRoot}`;
      if (!graph.nodes.find(n => n.id === rootId)) {
        graph.nodes.push({
          id: rootId,
          name: normalizedRoot,
          type: 'root',
          val: 8,
          data: { meaning: rootObj.meaning }
        });
      }
      if (!graph.links.find(l => (l.source === lexeme.lexeme && l.target === rootId) || (l.source === rootId && l.target === lexeme.lexeme))) {
        graph.links.push({
          source: lexeme.lexeme,
          target: rootId,
          type: 'HAS_ROOT'
        });
      }
    });

    // Add Root Family Connections - link to existing words in graph
    // This includes both AI's root_family suggestions AND auto-detected shared roots
    lexeme.root_family.forEach(familyMember => {
      const memberId = familyMember.word;
      if (graph.nodes.find(n => n.id === memberId)) {
        if (!graph.links.find(l => (l.source === lexeme.lexeme && l.target === memberId) || (l.source === memberId && l.target === lexeme.lexeme))) {
          graph.links.push({
            source: lexeme.lexeme,
            target: memberId,
            type: 'ROOT_FAMILY'
          });
        }
      }
    });

    // Auto-link words sharing the same root (merge with ROOT_FAMILY concept)
    const currentLexemeRoots = new Set(
      lexeme.morphology.roots.map(r => normalizeRoot(r.text))
    );

    graph.nodes.forEach(existingNode => {
      if (existingNode.type === 'lexeme' && existingNode.id !== lexeme.lexeme) {
        const existingLexeme = existingNode.data as LexemeData;
        if (existingLexeme && existingLexeme.morphology && existingLexeme.morphology.roots) {
          const existingRoots = new Set(
            existingLexeme.morphology.roots.map(r => normalizeRoot(r.text))
          );
          // Check if there's any overlap in roots
          let hasCommonRoot = false;
          currentLexemeRoots.forEach(root => {
            if (existingRoots.has(root)) hasCommonRoot = true;
          });

          if (hasCommonRoot) {
            // Create a direct link - use ROOT_FAMILY type
            const linkExists = graph.links.find(l =>
              (l.source === lexeme.lexeme && l.target === existingNode.id) ||
              (l.source === existingNode.id && l.target === lexeme.lexeme)
            );
            if (!linkExists) {
              graph.links.push({
                source: lexeme.lexeme,
                target: existingNode.id,
                type: 'ROOT_FAMILY'
              });
            }
          }
        }
      }
    });

    // Add AI Suggested Edges
    if (lexeme.suggested_edges) {
      lexeme.suggested_edges.forEach(edge => {
        // Only add edges between nodes that exist in the graph
        const fromExists = graph.nodes.find(n => n.id === edge.from || n.id === lexeme.lexeme);
        const toExists = graph.nodes.find(n => n.id === edge.to);

        if (fromExists && toExists) {
          const source = edge.from === lexeme.lexeme ? lexeme.lexeme : edge.from;
          if (!graph.links.find(l => (l.source === source && l.target === edge.to) || (l.source === edge.to && l.target === source))) {
            graph.links.push({
              source: source,
              target: edge.to,
              type: edge.type
            });
          }
        }
      });
    }

    this.saveGraph(graph);
  }
};
