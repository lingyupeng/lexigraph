import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { KnowledgeGraph, GraphNode, GraphLink, LexemeData } from '../types';
import { NODE_COLORS } from '../constants';
import { X, Info, Search as SearchIcon, ChevronDown, Target, Network, Settings, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { useLanguage } from '../hooks/useLanguage';

interface GraphSettings {
  nodeSize: number;
  bloomStrength: number;
  linkWidth: number;
  labelFontSize: number;
  linkDistance: number; // Multiplier for domain relevance link distance
  colors: {
    central: string;
    lexeme: string;
    root: string;
    domainLink: string;
    wordLink: string;
    rootLink: string;
  };
}

interface Props {
  graph: KnowledgeGraph;
  primaryDomain: string;
  onDeleteNode?: (nodeId: string) => void;
  onViewWord?: (lexemeData: LexemeData) => void;
}

export default function GraphView({ graph, primaryDomain, onDeleteNode, onViewWord }: Props) {
  const { t } = useLanguage();
  const fgRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showRoots, setShowRoots] = useState(() => {
    return localStorage.getItem('lexigraph_show_roots') !== 'false';
  });
  const [showLinks, setShowLinks] = useState(() => {
    return localStorage.getItem('lexigraph_show_links') !== 'false';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const defaultSettings: GraphSettings = {
    nodeSize: 1,
    bloomStrength: 1,
    linkWidth: 1,
    labelFontSize: 12,
    linkDistance: 1,
    colors: {
      central: '#ffffff',
      lexeme: '#818cf8',
      root: '#34d399',
      domainLink: '#9ca3af',
      wordLink: '#fbbf24',
      rootLink: '#6ee7b7'
    }
  };

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GraphSettings>(() => {
    const saved = localStorage.getItem('lexigraph_graph_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure new properties exist
        return { ...defaultSettings, ...parsed, colors: { ...defaultSettings.colors, ...parsed.colors } };
      } catch {
        // ignore
      }
    }
    return defaultSettings;
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('lexigraph_graph_settings', JSON.stringify(settings));
  }, [settings]);

  // Save showRoots/showLinks to localStorage
  useEffect(() => {
    localStorage.setItem('lexigraph_show_roots', String(showRoots));
  }, [showRoots]);

  useEffect(() => {
    localStorage.setItem('lexigraph_show_links', String(showLinks));
  }, [showLinks]);

  // Create CSS2DRenderer and UnrealBloomPass once
  const { css2dRenderer, bloomPass } = useMemo(() => {
    const css2dRenderer = new CSS2DRenderer();
    css2dRenderer.setSize(window.innerWidth, window.innerHeight);
    css2dRenderer.domElement.style.position = 'absolute';
    css2dRenderer.domElement.style.top = '0';
    css2dRenderer.domElement.style.pointerEvents = 'none';

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5, // strength
      0.4, // radius
      0.5  // threshold
    );

    return { css2dRenderer, bloomPass };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Transform graph data to show knowledge associations based on toggles
  const displayData = useMemo(() => {
    const nodes: GraphNode[] = [
      { id: 'central_domain', name: primaryDomain, type: 'concept', val: 20 },
      ...graph.nodes.filter(n => {
        if (n.type === 'lexeme') return true;
        if (n.type === 'root' && showRoots) return true;
        return false;
      })
    ];

    const getSourceId = (s: any) => typeof s === 'object' ? s.id : s;
    const getTargetId = (t: any) => typeof t === 'object' ? t.id : t;

    // Links from graph + domain relevance links
    // Always include all links for physics simulation, use linkVisibility to control rendering
    const links: GraphLink[] = [
      ...graph.links.filter(l => {
        const sId = getSourceId(l.source);
        const tId = getTargetId(l.target);

        const sourceNode = graph.nodes.find(n => n.id === sId);
        const targetNode = graph.nodes.find(n => n.id === tId);

        // Only include links if both ends are visible
        const sourceVisible = sId === 'central_domain' || (sourceNode && (sourceNode.type === 'lexeme' || (sourceNode.type === 'root' && showRoots)));
        const targetVisible = tId === 'central_domain' || (targetNode && (targetNode.type === 'lexeme' || (targetNode.type === 'root' && showRoots)));

        return sourceVisible && targetVisible;
      }).map(l => {
        const sId = getSourceId(l.source);
        const tId = getTargetId(l.target);
        return {
          ...l,
          source: sId,
          target: tId,
          id: l.id || `link_${sId}_${tId}`
        };
      }),
      ...graph.nodes
        .filter(n => n.type === 'lexeme')
        .map(l => ({
          id: `link_domain_${l.id}`,
          source: 'central_domain',
          target: l.id,
          type: 'DOMAIN_RELEVANCE'
        }))
    ];

    return { nodes, links };
  }, [graph, primaryDomain, showRoots, showLinks]);

  const lexemes = useMemo(() => {
    return displayData.nodes
      .filter(n => n.type === 'lexeme')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [displayData]);

  const roots = useMemo(() => {
    return displayData.nodes
      .filter(n => n.type === 'root')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [displayData]);

  const filteredLexemes = useMemo(() => {
    if (!searchQuery) return lexemes;
    return lexemes.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [lexemes, searchQuery]);

  const filteredRoots = useMemo(() => {
    if (!searchQuery) return roots;
    return roots.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [roots, searchQuery]);

  useEffect(() => {
    if (!fgRef.current) return;
    if (!graph.nodes || graph.nodes.length === 0) return;

    const linkForce = fgRef.current.d3Force('link');
    if (linkForce) {
      linkForce.distance((link: any) => {
        const tId = typeof link.target === 'object' ? link.target.id : link.target;
        if (link.type === 'DOMAIN_RELEVANCE') {
          const lexemeNode = graph.nodes.find(n => n.id === tId);
          const scoreStr = lexemeNode?.data?.relevance_score;
          const score = typeof scoreStr === 'string' ? parseInt(scoreStr) : (scoreStr || 50);
          // Low relevance = far from center, high relevance = closer
          // Base range: 15% score → 155, 85% score → 55, scaled by linkDistance
          return ((100 - score) * 1.25 + 50) * settings.linkDistance;
        }
        if (link.type === 'HAS_ROOT') return 40;
        if (link.type === 'ROOT_FAMILY') return 80;
        return 60;
      });
    }

    const chargeForce = fgRef.current.d3Force('charge');
    if (chargeForce) {
      chargeForce.strength(-150);
    }
  }, [showRoots, settings.linkDistance, graph.nodes]);

  // Separate effect to re-apply link distance when it changes
  useEffect(() => {
    if (!fgRef.current) return;
    // Only reheat if we have nodes
    if (!graph.nodes || graph.nodes.length === 0) return;
    const linkForce = fgRef.current.d3Force('link');
    if (linkForce) {
      linkForce.distance((link: any) => {
        if (link.type === 'DOMAIN_RELEVANCE') {
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const lexemeNode = graph.nodes.find(n => n.id === tId);
          const scoreStr = lexemeNode?.data?.relevance_score;
          const score = typeof scoreStr === 'string' ? parseInt(scoreStr) : (scoreStr || 50);
          return ((100 - score) * 1.25 + 50) * settings.linkDistance;
        }
        if (link.type === 'HAS_ROOT') return 40;
        if (link.type === 'ROOT_FAMILY') return 80;
        return 60;
      });
      // Reheat simulation to apply new distances
      if (typeof fgRef.current.d3ReheatSimulation === 'function') {
        try {
          fgRef.current.d3ReheatSimulation();
        } catch (e) {
          // Simulation may not be fully initialized yet
        }
      }
    }
  }, [settings.linkDistance, graph.nodes]);

  useEffect(() => {
    if (fgRef.current) {
      const controls = fgRef.current.controls();
      if (controls) {
        controls.autoRotateSpeed = 0.5;
      }
    }
  }, []);

  const handleNodeClick = (node: any) => {
    if (node.id === 'central_domain') return;
    setSelectedNode(node as GraphNode);

    const distance = 120;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      1000
    );
  };

  const handleRecenter = () => {
    if (fgRef.current) {
      // Simply zoom to fit all nodes
      fgRef.current.zoomToFit(500, 50);
    }
  };

  useEffect(() => {
    if (fgRef.current) {
      const scene = fgRef.current.scene();

      // Pure black background
      scene.background = new THREE.Color(0x000000);

      // Add subtle ambient light
      const ambient = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambient);

      // Add bloom pass for glow effect
      const composer = fgRef.current.postProcessingComposer();
      if (composer && bloomPass) {
        composer.addPass(bloomPass);
      }

      // Enable auto-rotation
      const controls = fgRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }

      return () => {
        scene.remove(ambient);
      };
    }
  }, [bloomPass]);

  // Update bloom when settings change
  useEffect(() => {
    if (bloomPass) {
      bloomPass.strength = settings.bloomStrength * 0.5;
      bloomPass.threshold = 0;
    }
  }, [settings.bloomStrength, bloomPass]);

  // Early return for empty graph
  if (!graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white/50">
          <Network size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">{t('graph.noData')}</p>
          <p className="text-sm mt-2">{t('graph.noDataHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black">
      <ForceGraph3D
        ref={fgRef}
        graphData={displayData}
        linkVisibility={showLinks}
        nodeLabel={() => ''}
        nodeThreeObject={(node: any) => {
          const isCentral = node.id === 'central_domain';
          const isRoot = node.type === 'root';
          const isLexeme = node.type === 'lexeme';

          // Color based on type and settings
          let color = '#ffffff';
          if (isCentral) {
            color = settings.colors.central;
          } else if (isLexeme) {
            color = settings.colors.lexeme;
          } else if (isRoot) {
            color = settings.colors.root;
          }

          // Size based on settings - Central is fixed, others scale with nodeSize
          // Central: fixed at 4, Lexeme: 2.0 * nodeSize, Root: 1.0 * nodeSize (smaller/thinner)
          let baseSize = 4;
          if (isLexeme) baseSize = 2.0 * settings.nodeSize;
          if (isRoot) baseSize = 1.0 * settings.nodeSize;

          const group = new THREE.Group();

          // Main sphere - bloom will create glow effect
          const geometry = new THREE.SphereGeometry(baseSize, 32, 32);
          const material = new THREE.MeshBasicMaterial({ color });
          const sphere = new THREE.Mesh(geometry, material);
          group.add(sphere);

          // CSS2D label positioned above
          const labelDiv = document.createElement('div');
          labelDiv.textContent = node.name;
          labelDiv.style.color = '#ffffff';
          labelDiv.style.fontSize = `${settings.labelFontSize}px`;
          labelDiv.style.textShadow = '0 0 8px rgba(0,0,0,1)';
          // Root uses serif font and italic/thin for distinction
          if (isRoot) {
            labelDiv.style.fontFamily = 'Georgia, "Times New Roman", serif';
            labelDiv.style.fontStyle = 'italic';
            labelDiv.style.fontWeight = 'normal';
          } else {
            labelDiv.style.fontFamily = 'Inter, system-ui, sans-serif';
            labelDiv.style.fontWeight = 'bold';
          }
          labelDiv.style.pointerEvents = 'none';
          labelDiv.style.userSelect = 'none';
          labelDiv.style.whiteSpace = 'nowrap';
          const label = new CSS2DObject(labelDiv);
          label.position.set(0, baseSize + 1.5, 0);
          group.add(label);

          return group;
        }}
        linkWidth={(link: any) => {
          const linkType = link.type;
          if (linkType === 'DOMAIN_RELEVANCE') return settings.linkWidth; // 1.0x - 最粗
          if (linkType === 'HAS_ROOT') return settings.linkWidth * 0.8; // 0.8x
          if (linkType === 'ROOT_FAMILY') return settings.linkWidth * 0.6; // 0.6x
          return settings.linkWidth;
        }}
        linkColor={(link: any) => {
          const linkType = link.type;
          if (linkType === 'DOMAIN_RELEVANCE') return settings.colors.domainLink;
          if (linkType === 'HAS_ROOT') return settings.colors.rootLink;
          if (linkType === 'ROOT_FAMILY') return settings.colors.wordLink;
          return '#d1d5db';
        }}
        linkOpacity={0.6}
        onNodeClick={handleNodeClick}
        backgroundColor="#000000"
        extraRenderers={[css2dRenderer]}
        width={dimensions.width - (window.innerWidth >= 768 ? (selectedNode ? 320 : 0) : 0)}
        height={dimensions.height}
      />

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="absolute top-20 left-6 z-20 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white p-5 w-72"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders size={16} />
                <p className="text-sm font-bold">Graph Settings</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-5">
              {/* Size Controls */}
              <div>
                <label className="text-xs text-white/60 mb-2 block">{t('graphSettings.nodeSize')}: {settings.nodeSize.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.1"
                  value={settings.nodeSize}
                  onChange={(e) => setSettings(s => ({ ...s, nodeSize: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-2 block">{t('graphSettings.bloom')}: {settings.bloomStrength.toFixed(1)}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={settings.bloomStrength}
                  onChange={(e) => setSettings(s => ({ ...s, bloomStrength: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-2 block">{t('graphSettings.lineThickness')}: {settings.linkWidth.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.1"
                  value={settings.linkWidth}
                  onChange={(e) => setSettings(s => ({ ...s, linkWidth: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-2 block">{t('graphSettings.labelSize')}: {settings.labelFontSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  step="1"
                  value={settings.labelFontSize}
                  onChange={(e) => setSettings(s => ({ ...s, labelFontSize: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-2 block">{t('graphSettings.linkDistance')}: {settings.linkDistance.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.linkDistance}
                  onChange={(e) => setSettings(s => ({ ...s, linkDistance: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Color Controls */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/60 mb-3">{t('graphSettings.colors')}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">{t('graphSettings.central')}</span>
                    <input
                      type="color"
                      value={settings.colors.central}
                      onChange={(e) => setSettings(s => ({ ...s, colors: { ...s.colors, central: e.target.value } }))}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">{t('graphSettings.lexeme')}</span>
                    <input
                      type="color"
                      value={settings.colors.lexeme}
                      onChange={(e) => setSettings(s => ({ ...s, colors: { ...s.colors, lexeme: e.target.value } }))}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">{t('graphSettings.root')}</span>
                    <input
                      type="color"
                      value={settings.colors.root}
                      onChange={(e) => setSettings(s => ({ ...s, colors: { ...s.colors, root: e.target.value } }))}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">{t('graphSettings.wordLinks')}</span>
                    <input
                      type="color"
                      value={settings.colors.wordLink}
                      onChange={(e) => setSettings(s => ({ ...s, colors: { ...s.colors, wordLink: e.target.value } }))}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">{t('graphSettings.rootLinks')}</span>
                    <input
                      type="color"
                      value={settings.colors.rootLink}
                      onChange={(e) => setSettings(s => ({ ...s, colors: { ...s.colors, rootLink: e.target.value } }))}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">{t('graphSettings.domainLinks')}</span>
                    <input
                      type="color"
                      value={settings.colors.domainLink}
                      onChange={(e) => setSettings(s => ({ ...s, colors: { ...s.colors, domainLink: e.target.value } }))}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md border-l border-stone-200 shadow-2xl p-8 overflow-y-auto z-20"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-8 mt-8">
              <header className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                    selectedNode.type === 'lexeme' ? "bg-indigo-100 text-indigo-700" :
                    selectedNode.type === 'root' ? "bg-emerald-100 text-emerald-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {selectedNode.type}
                  </span>
                  {selectedNode.type !== 'concept' && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${selectedNode.name}" from graph?`)) {
                          onDeleteNode?.(selectedNode.id);
                          setSelectedNode(null);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete from graph"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-stone-900">{selectedNode.name}</h3>
              </header>

              {selectedNode.type === 'root' && selectedNode.data && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase">Meaning</p>
                    <p className="text-lg text-stone-700 font-medium">{selectedNode.data.meaning}</p>
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-xs text-stone-500 leading-relaxed italic">
                      This root is shared across multiple words in your research vocabulary.
                    </p>
                  </div>
                </div>
              )}

              {selectedNode.type === 'lexeme' && selectedNode.data && (
                <div className="space-y-6">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Domain Relevance</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-1000"
                          style={{ width: `${typeof selectedNode.data.relevance_score === 'string' ? selectedNode.data.relevance_score : selectedNode.data.relevance_score + '%'}` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-indigo-600">{typeof selectedNode.data.relevance_score === 'string' ? selectedNode.data.relevance_score : selectedNode.data.relevance_score + '%'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Etymological Depth</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-1000"
                          style={{ width: `${typeof selectedNode.data.etymological_depth_score === 'string' ? selectedNode.data.etymological_depth_score : selectedNode.data.etymological_depth_score + '%'}` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{typeof selectedNode.data.etymological_depth_score === 'string' ? selectedNode.data.etymological_depth_score : selectedNode.data.etymological_depth_score + '%'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase">Translation</p>
                    <p className="text-stone-700">{(Array.isArray(selectedNode.data.translation_zh) ? selectedNode.data.translation_zh : []).join(', ')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase">Story</p>
                    <p className="text-sm text-stone-600 italic leading-relaxed">"{selectedNode.data.story?.text || 'No story available.'}"</p>
                  </div>
                </div>
              )}

              {selectedNode.type === 'lexeme' && (
                <button
                  onClick={() => onViewWord?.(selectedNode.data as LexemeData)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <SearchIcon size={16} />
                  View Full Analysis
                </button>
              )}

              <div className="pt-8 border-t border-stone-100">
                <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-2xl">
                  <Info size={16} className="text-stone-400 shrink-0 mt-1" />
                  <div className="text-xs text-stone-500 leading-relaxed space-y-2">
                    <p>
                      <strong>Domain Relevance:</strong> Determines the distance from the center (<strong>{primaryDomain}</strong>).
                    </p>
                    <p>
                      <strong>Etymological Depth:</strong> Determines the size of the word node, reflecting its linguistic complexity and productivity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute top-20 left-6 z-10 flex flex-col gap-4 max-w-[280px]">
        {/* Search & Selection */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white overflow-hidden flex flex-col">
          <button
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <SearchIcon size={16} className="text-white/40" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">{t('graph.navigator')}</span>
            </div>
            <ChevronDown size={16} className={cn("text-white/40 transition-transform", isSearchExpanded && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={t('graph.searchGraph')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-full placeholder:text-white/20"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X size={14} className="text-white/40 hover:text-white" />
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {/* Lexemes Section */}
                  <div className="p-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-2 py-1">{t('graph.lexemes')}</p>
                    <div className="space-y-0.5">
                      {filteredLexemes.length > 0 ? filteredLexemes.map(l => (
                        <button
                          key={l.id}
                          onClick={() => handleNodeClick(l)}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-xs text-white/70 hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate">{l.name}</span>
                          <Target size={12} className="opacity-0 group-hover:opacity-40" />
                        </button>
                      )) : (
                        <p className="text-[10px] text-white/20 px-2 py-1">{t('graph.noLexemes')}</p>
                      )}
                    </div>
                  </div>

                  {/* Roots Section */}
                  {showRoots && (
                    <div className="p-2 border-t border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-2 py-1">{t('graph.roots')}</p>
                      <div className="space-y-0.5">
                        {filteredRoots.length > 0 ? filteredRoots.map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleNodeClick(r)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-xs text-white/70 hover:text-white transition-colors flex items-center justify-between group"
                          >
                            <span className="truncate">{r.name}</span>
                            <Target size={12} className="opacity-0 group-hover:opacity-40" />
                          </button>
                        )) : (
                          <p className="text-[10px] text-white/20 px-2 py-1">{t('graph.noRoots')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t('graph.controls')}</p>

          <button
            onClick={handleRecenter}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-xs font-medium"
          >
            {t('graph.recenter')}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-xs font-medium"
          >
            <Settings size={14} />
            {showSettings ? t('graph.hideSettings') : t('graph.showSettings')}
          </button>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setShowRoots(!showRoots)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showRoots ? "bg-indigo-600" : "bg-stone-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                showRoots ? "left-6" : "left-1"
              )} />
            </div>
            <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">{t('graph.showRoots')}</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setShowLinks(!showLinks)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                showLinks ? "bg-indigo-600" : "bg-stone-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                showLinks ? "left-6" : "left-1"
              )} />
            </div>
            <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">{t('graph.showLinks')}</span>
          </label>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-10 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white/60 text-[10px] space-y-2">
        <p className="font-bold uppercase tracking-widest mb-2">{t('graph.legend')}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.colors.central }} /> {t('graph.domainCenter')}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.colors.lexeme }} /> {t('graph.lexemeWord')}
        </div>
        {showRoots && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.colors.root }} /> {t('graph.rootEtymology')}
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
