import React, { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import CircuitCanvas from './components/CircuitCanvas';
import { CircuitNode, CircuitConnection, WireType, WireStyle } from './types';
import { COMPONENT_TEMPLATES } from './constants';
import { analyzeCircuit } from './services/aiHelper';
import { Bot, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// History Step Type
interface HistoryStep {
  nodes: CircuitNode[];
  connections: CircuitConnection[];
}

const App: React.FC = () => {
  // Current State
  const [nodes, setNodes] = useState<CircuitNode[]>([]);
  const [connections, setConnections] = useState<CircuitConnection[]>([]);
  
  // History State
  const [history, setHistory] = useState<HistoryStep[]>([{ nodes: [], connections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeWireType, setActiveWireType] = useState<WireType>(WireType.L1);
  const [activeWireStyle, setActiveWireStyle] = useState<WireStyle>(WireStyle.ORTHOGONAL);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- History Management ---

  const saveToHistory = useCallback((newNodes: CircuitNode[], newConnections: CircuitConnection[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, connections: newConnections });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const step = history[prevIndex];
      setNodes(step.nodes);
      setConnections(step.connections);
      setHistoryIndex(prevIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const step = history[nextIndex];
      setNodes(step.nodes);
      setConnections(step.connections);
      setHistoryIndex(nextIndex);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // --- Actions ---

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType');
    if (!type) return;

    const template = COMPONENT_TEMPLATES[type];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - (template.defaultWidth / 2);
    const y = e.clientY - rect.top - (template.defaultHeight / 2);

    const newNode: CircuitNode = {
      id: `node_${Date.now()}`,
      templateType: type,
      x,
      y,
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    saveToHistory(nextNodes, connections);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === id ? { ...node, x, y } : node
    ));
  }, []);

  const handleNodeMoveEnd = useCallback(() => {
    saveToHistory(nodes, connections);
  }, [nodes, connections, saveToHistory]);

  const updateNodeLabel = useCallback((id: string, label: string) => {
    const nextNodes = nodes.map(node => 
      node.id === id ? { ...node, customLabel: label } : node
    );
    setNodes(nextNodes);
    saveToHistory(nextNodes, connections);
  }, [nodes, connections, saveToHistory]);

  const addConnection = useCallback((conn: CircuitConnection) => {
    const nextConnections = [...connections, conn];
    setConnections(nextConnections);
    saveToHistory(nodes, nextConnections);
  }, [nodes, connections, saveToHistory]);

  const deleteNode = useCallback((id: string) => {
    const nextNodes = nodes.filter(n => n.id !== id);
    const nextConnections = connections.filter(c => c.sourceNodeId !== id && c.targetNodeId !== id);
    setNodes(nextNodes);
    setConnections(nextConnections);
    saveToHistory(nextNodes, nextConnections);
  }, [nodes, connections, saveToHistory]);

  const clearAll = () => {
    if (window.confirm("确定要清空整个画布吗？")) {
      setNodes([]);
      setConnections([]);
      setAiAnalysis(null);
      saveToHistory([], []);
    }
  };

  const handleAIAnalysis = async () => {
    if (nodes.length === 0) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeCircuit(nodes, connections);
      setAiAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Export BOM (Materials) ---
  const handleExportBOM = () => {
    const counts: Record<string, { count: number, name: string }> = {};
    
    nodes.forEach(node => {
      const tmpl = COMPONENT_TEMPLATES[node.templateType];
      if (tmpl.category === '辅助标注') return; // Skip annotations
      
      const key = tmpl.name;
      if (!counts[key]) {
        counts[key] = { count: 0, name: key };
      }
      counts[key].count++;
    });

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel
    csvContent += "序号,元器件名称,数量,备注\n";
    
    Object.values(counts).forEach((item, index) => {
      csvContent += `${index + 1},"${item.name}",${item.count},\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "配电箱装配清单.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Export PDF with Frame ---
  const handleExportPDF = async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (documentClone) => {
           const container = documentClone.getElementById('canvas-container');
           if (container) {
             const bgGradient = container.querySelector('div[style*="radial-gradient"]');
             if (bgGradient) (bgGradient as HTMLElement).style.display = 'none';
             
             const gridLines = container.querySelectorAll('.grid-line');
             gridLines.forEach((el) => (el as HTMLElement).style.stroke = '#e2e8f0');

             const bodies = container.querySelectorAll('.component-body');
             bodies.forEach((el) => {
               (el as HTMLElement).style.fill = '#ffffff';
               (el as HTMLElement).style.stroke = '#000000';
               (el as HTMLElement).style.strokeWidth = '2px';
             });
             
             const notes = container.querySelectorAll('.component-note');
             notes.forEach((el) => {
                (el as HTMLElement).style.fill = '#ffffff';
                (el as HTMLElement).style.stroke = '#000000';
                (el as HTMLElement).style.strokeDasharray = '4,4';
             });

             const icons = container.querySelectorAll('.component-icon');
             icons.forEach((el) => {
               (el as HTMLElement).classList.remove('text-slate-400');
               (el as HTMLElement).style.color = '#000000';
             });

             const labels = container.querySelectorAll('.component-label');
             labels.forEach((el) => {
               (el as HTMLElement).classList.remove('text-slate-300', 'text-slate-800');
               (el as HTMLElement).style.color = '#000000';
               (el as HTMLElement).style.fontWeight = 'bold';
             });

             const wireOutlines = container.querySelectorAll('.wire-outline');
             wireOutlines.forEach((el) => (el as HTMLElement).style.stroke = '#000000');
             
             const wireCores = container.querySelectorAll('.wire-core');
             wireCores.forEach((el) => (el as HTMLElement).style.stroke = '#000000');

             const terminals = container.querySelectorAll('.terminal-point');
             terminals.forEach((el) => (el as HTMLElement).style.stroke = '#000000');

             const wireLabelBgs = container.querySelectorAll('.wire-label-bg');
             wireLabelBgs.forEach((el) => (el as HTMLElement).style.fill = '#ffffff');

             const wireLabelTexts = container.querySelectorAll('.wire-label-text');
             wireLabelTexts.forEach((el) => (el as HTMLElement).style.fill = '#000000');
             
             const junctions = container.querySelectorAll('.wire-junction');
             junctions.forEach((el) => (el as HTMLElement).style.fill = '#000000');

             const deleteBtns = container.querySelectorAll('.delete-btn');
             deleteBtns.forEach((el) => (el as HTMLElement).style.display = 'none');
           }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;
      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width + 40, height + 60], // Extra space for borders
      });

      // Add Engineering Title Block
      pdf.setDrawColor(0);
      pdf.setLineWidth(1);
      
      // Outer Border
      pdf.rect(20, 20, width, height + 20);
      
      // Image
      pdf.addImage(imgData, 'PNG', 20, 20, width, height);

      // Title Block Area (Bottom Right)
      const tbWidth = 200;
      const tbHeight = 60;
      const tbX = 20 + width - tbWidth;
      const tbY = 20 + height - tbHeight + 20;

      // Draw Title Block
      pdf.setFillColor(255, 255, 255);
      pdf.rect(tbX, tbY - 20, tbWidth, tbHeight, 'FD'); // Fill white to cover image overlap if any
      
      // Lines
      pdf.line(tbX, tbY, tbX + tbWidth, tbY); // Middle horizontal
      pdf.line(tbX + 60, tbY - 20, tbX + 60, tbY + 40); // Vertical separator

      // Text
      pdf.setFontSize(10);
      pdf.text("项目名称:", tbX + 5, tbY - 8);
      pdf.setFontSize(14);
      pdf.text("配电箱电气原理图", tbX + 65, tbY - 8);

      pdf.setFontSize(10);
      pdf.text("设计:", tbX + 5, tbY + 12);
      pdf.text("ProCircuit Engineer", tbX + 65, tbY + 12);
      
      pdf.text("日期:", tbX + 5, tbY + 28);
      pdf.text(new Date().toLocaleDateString(), tbX + 65, tbY + 28);

      pdf.save('配电箱电气原理图.pdf');
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出 PDF 失败，请重试。");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar onDragStart={handleDragStart} />
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar 
          activeWireType={activeWireType} 
          activeWireStyle={activeWireStyle}
          onWireTypeChange={setActiveWireType} 
          onWireStyleChange={setActiveWireStyle}
          onClear={clearAll}
          onAnalyze={handleAIAnalysis}
          onExport={handleExportPDF}
          onExportBOM={handleExportBOM}
          isAnalyzing={isAnalyzing}
          isExporting={isExporting}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />

        <div 
          id="canvas-container"
          className="flex-1 relative bg-slate-900 overflow-hidden cursor-crosshair"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          ref={canvasRef}
        >
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ 
              backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
              backgroundSize: '20px 20px' 
            }}
          />
          
          <CircuitCanvas
            nodes={nodes}
            connections={connections}
            activeWireType={activeWireType}
            activeWireStyle={activeWireStyle}
            onUpdateNodePosition={updateNodePosition}
            onUpdateNodeLabel={updateNodeLabel}
            onAddConnection={addConnection}
            onDeleteNode={deleteNode}
            onNodeMoveEnd={handleNodeMoveEnd}
          />

          {aiAnalysis && (
            <div className="absolute bottom-4 right-4 w-96 bg-slate-800/95 backdrop-blur border border-yellow-500/30 rounded-xl shadow-2xl z-50 flex flex-col max-h-[50%] animate-in slide-in-from-bottom-4 fade-in duration-300" data-html2canvas-ignore>
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-gradient-to-r from-yellow-500/10 to-transparent">
                <h3 className="font-bold text-yellow-500 flex items-center gap-2">
                  <Bot size={18} /> AI 电气工程师分析报告
                </h3>
                <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                {aiAnalysis}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;