import React, { useRef, useState, useEffect } from 'react';
import { CircuitNode, CircuitConnection, WireType, WireStyle, TerminalDef, Point } from '../types';
import { COMPONENT_TEMPLATES, WIRE_COLORS } from '../constants';

interface CircuitCanvasProps {
  nodes: CircuitNode[];
  connections: CircuitConnection[];
  activeWireType: WireType;
  activeWireStyle: WireStyle;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onUpdateNodeLabel: (id: string, label: string) => void;
  onAddConnection: (conn: CircuitConnection) => void;
  onDeleteNode: (id: string) => void;
  onNodeMoveEnd: () => void;
}

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
  hasMoved: boolean;
}

interface WireDraft {
  isDrawing: boolean;
  sourceNodeId: string;
  sourceTerminalId: string;
  currentX: number;
  currentY: number;
  points: Point[]; // Waypoints for manual routing
}

const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  nodes,
  connections,
  activeWireType,
  activeWireStyle,
  onUpdateNodePosition,
  onUpdateNodeLabel,
  onAddConnection,
  onDeleteNode,
  onNodeMoveEnd
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    originalX: 0,
    originalY: 0,
    hasMoved: false,
  });

  const [wireDraft, setWireDraft] = useState<WireDraft>({
    isDrawing: false,
    sourceNodeId: '',
    sourceTerminalId: '',
    currentX: 0,
    currentY: 0,
    points: [],
  });

  const [hoveredTerminal, setHoveredTerminal] = useState<{nodeId: string, terminalId: string} | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // --- Utilities ---

  const getMousePosition = (evt: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  };

  const getTerminalPosition = (node: CircuitNode, terminalId: string) => {
    const template = COMPONENT_TEMPLATES[node.templateType];
    const terminal = template.terminals.find(t => t.id === terminalId);
    if (!terminal) return { x: node.x, y: node.y };
    return {
      x: node.x + (terminal.xOffset * template.defaultWidth),
      y: node.y + (terminal.yOffset * template.defaultHeight)
    };
  };

  // --- Event Handlers ---

  // Cancel drawing on Escape or Right Click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (wireDraft.isDrawing) {
           setWireDraft({ isDrawing: false, sourceNodeId: '', sourceTerminalId: '', currentX: 0, currentY: 0, points: [] });
        } else if (editingId) {
           setEditingId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wireDraft.isDrawing, editingId]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (wireDraft.isDrawing) {
      e.preventDefault();
      setWireDraft({ isDrawing: false, sourceNodeId: '', sourceTerminalId: '', currentX: 0, currentY: 0, points: [] });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Click canvas to save editing
    if (editingId) {
      saveLabel();
      return;
    }

    // If we are in "Manual Drawing" mode (wireDraft.isDrawing is true and points > 0 or implied manual),
    // clicking on canvas adds a waypoint.
    if (wireDraft.isDrawing) {
       const pos = getMousePosition(e);
       setWireDraft(prev => ({
         ...prev,
         points: [...prev.points, { x: pos.x, y: pos.y }]
       }));
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (wireDraft.isDrawing) return; // Don't drag nodes while drawing wire
    if (editingId === nodeId) return; 

    e.stopPropagation();
    const pos = getMousePosition(e);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDragState({
      isDragging: true,
      nodeId,
      startX: pos.x,
      startY: pos.y,
      originalX: node.x,
      originalY: node.y,
      hasMoved: false,
    });
  };

  const handleTerminalMouseDown = (e: React.MouseEvent, nodeId: string, terminalId: string) => {
    e.stopPropagation();
    if (editingId) return;

    // If we are already drawing, clicking another terminal finishes the connection
    if (wireDraft.isDrawing) {
      finishConnection(nodeId, terminalId);
      return;
    }

    // Start new wire draft
    const pos = getMousePosition(e);
    setWireDraft({
      isDrawing: true,
      sourceNodeId: nodeId,
      sourceTerminalId: terminalId,
      currentX: pos.x,
      currentY: pos.y,
      points: [], // Start with no intermediate points
    });
  };

  const handleTerminalMouseUp = (e: React.MouseEvent, nodeId: string, terminalId: string) => {
    e.stopPropagation();
    
    // If we released mouse over a terminal...
    if (wireDraft.isDrawing) {
       // Case 1: We started on this same terminal. 
       // If we haven't moved much, it might be a "Click" to start manual routing.
       if (wireDraft.sourceNodeId === nodeId && wireDraft.sourceTerminalId === terminalId) {
         // If no points yet, we just keep drawing state active (user enters Manual Mode)
         return; 
       }
       
       // Case 2: Different terminal -> Finish connection (Standard Drag-Drop)
       finishConnection(nodeId, terminalId);
    }
  };

  const finishConnection = (targetNodeId: string, targetTerminalId: string) => {
      // Don't connect to self/same terminal
      if (wireDraft.sourceNodeId === targetNodeId && wireDraft.sourceTerminalId === targetTerminalId) {
        setWireDraft({ ...wireDraft, isDrawing: false });
        return;
      }

      const newConnection: CircuitConnection = {
        id: `conn_${Date.now()}`,
        sourceNodeId: wireDraft.sourceNodeId,
        sourceTerminalId: wireDraft.sourceTerminalId,
        targetNodeId: targetNodeId,
        targetTerminalId: targetTerminalId,
        wireType: activeWireType,
        wireStyle: activeWireStyle,
        // Only save points if we have manually added them. 
        // If it's a straight drag (0 points), we leave it undefined to let the Style renderer handle it.
        points: wireDraft.points.length > 0 ? wireDraft.points : undefined
      };
      onAddConnection(newConnection);
      setWireDraft({ ...wireDraft, isDrawing: false, points: [] });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);

    if (dragState.isDragging && dragState.nodeId) {
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      onUpdateNodePosition(dragState.nodeId, dragState.originalX + dx, dragState.originalY + dy);
      setDragState(prev => ({ ...prev, hasMoved: true }));
    }

    if (wireDraft.isDrawing) {
      setWireDraft(prev => ({ ...prev, currentX: pos.x, currentY: pos.y }));
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      if (dragState.hasMoved) {
        onNodeMoveEnd();
      }
      setDragState(prev => ({ ...prev, isDragging: false, nodeId: null }));
    }
    // NOTE: We do NOT cancel wireDraft drawing here globally. 
    // This allows "Click -> Move -> Click" manual routing to persist across mouse ups on empty canvas.
  };
  
  const startEditing = (e: React.MouseEvent, node: CircuitNode, currentLabel: string) => {
    e.stopPropagation();
    setEditingId(node.id);
    setEditValue(currentLabel || (node.templateType === 'text-annotation' ? "双击编辑注释" : ""));
  };

  const saveLabel = () => {
    if (editingId) {
      onUpdateNodeLabel(editingId, editValue);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        saveLabel();
    }
  };

  // --- PATH GENERATION LOGIC ---

  const getLaneOffset = (wireType: WireType) => {
    const spacing = 16; 
    const order = [WireType.L1, WireType.L2, WireType.L3, WireType.N, WireType.PE];
    const index = order.indexOf(wireType);
    return (index !== -1 ? index : 0) * spacing;
  };

  // 1. Smart Orthogonal
  type Direction = 'N' | 'S' | 'E' | 'W';
  const getTerminalDirection = (t?: TerminalDef): Direction => {
    if (!t) return 'S';
    if (t.xOffset <= 0.1) return 'W';
    if (t.xOffset >= 0.9) return 'E';
    if (t.yOffset <= 0.1) return 'N';
    if (t.yOffset >= 0.9) return 'S';
    if (t.yOffset > t.xOffset && t.yOffset > (1 - t.xOffset)) return 'S';
    if (t.yOffset < t.xOffset && t.yOffset < (1 - t.xOffset)) return 'N';
    return 'S';
  };

  const getOrthogonalPath = (
    x1: number, y1: number, dir1: Direction,
    x2: number, y2: number, dir2: Direction,
    wireType: WireType
  ) => {
    const baseMargin = 30; 
    const laneOffset = getLaneOffset(wireType);
    const margin = baseMargin + laneOffset;
    
    let e1x = x1, e1y = y1;
    if (dir1 === 'N') e1y -= margin; else if (dir1 === 'S') e1y += margin;
    else if (dir1 === 'W') e1x -= margin; else if (dir1 === 'E') e1x += margin;

    let e2x = x2, e2y = y2;
    if (dir2 === 'N') e2y -= margin; else if (dir2 === 'S') e2y += margin;
    else if (dir2 === 'W') e2x -= margin; else if (dir2 === 'E') e2x += margin;

    let path = `M ${x1} ${y1} L ${e1x} ${e1y}`;
    let labelX = x1;
    let labelY = y1;

    const isVertical1 = dir1 === 'N' || dir1 === 'S';
    const isVertical2 = dir2 === 'N' || dir2 === 'S';

    const getStagger = (start: number, end: number) => {
        const range = end - start;
        const order = [WireType.L1, WireType.L2, WireType.L3, WireType.N, WireType.PE];
        const idx = order.indexOf(wireType);
        const percent = 0.4 + (idx * 0.05); 
        return start + (range * percent);
    };

    if (isVertical1 && isVertical2) {
      let midY = (e1y + e2y) / 2;
      if ((dir1 === 'N' && dir2 === 'N') || (dir1 === 'S' && dir2 === 'S')) {
         midY = dir1 === 'N' ? Math.min(e1y, e2y) : Math.max(e1y, e2y);
      }
      path += ` L ${e1x} ${midY} L ${e2x} ${midY}`;
      labelX = getStagger(e1x, e2x);
      labelY = midY;
    } else if (!isVertical1 && !isVertical2) {
      let midX = (e1x + e2x) / 2;
      path += ` L ${midX} ${e1y} L ${midX} ${e2y}`;
      labelX = midX;
      labelY = getStagger(e1y, e2y);
    } else if (isVertical1 && !isVertical2) {
      path += ` L ${e1x} ${e2y}`;
      if (Math.abs(e2y - e1y) > Math.abs(e2x - e1x)) {
          labelX = e1x; labelY = getStagger(e1y, e2y);
      } else {
          labelX = getStagger(e1x, e2x); labelY = e2y;
      }
    } else {
      path += ` L ${e2x} ${e1y}`;
      if (Math.abs(e2x - e1x) > Math.abs(e2y - e1y)) {
          labelX = getStagger(e1x, e2x); labelY = e1y;
      } else {
          labelX = e2x; labelY = getStagger(e1y, e2y);
      }
    }
    path += ` L ${e2x} ${e2y} L ${x2} ${y2}`;
    return { path, labelX, labelY };
  };

  // 2. Curved (Bezier)
  const getCurvedPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dist = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
    const controlOffset = Math.max(dist * 0.5, 50);
    const path = `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`;
    
    // Approximate midpoint of Bezier for label
    // B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
    // For t=0.5, simply mid of midpoints
    const labelX = (x1 + x2) / 2; // Simplified
    const labelY = (y1 + y2) / 2;
    
    return { path, labelX, labelY };
  };

  // 3. Straight
  const getStraightPath = (x1: number, y1: number, x2: number, y2: number) => {
    return { 
      path: `M ${x1} ${y1} L ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2
    };
  };

  // 4. Manual Polyline
  const getManualPath = (x1: number, y1: number, points: Point[], x2: number, y2: number) => {
    const allPoints = [{x: x1, y: y1}, ...points, {x: x2, y: y2}];
    let path = `M ${x1} ${y1}`;
    for (let i = 1; i < allPoints.length; i++) {
      path += ` L ${allPoints[i].x} ${allPoints[i].y}`;
    }
    
    // Find longest segment for label
    let maxLen = 0;
    let labelX = x1;
    let labelY = y1;
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      const pA = allPoints[i];
      const pB = allPoints[i+1];
      const len = Math.sqrt(Math.pow(pB.x - pA.x, 2) + Math.pow(pB.y - pA.y, 2));
      if (len > maxLen) {
        maxLen = len;
        labelX = (pA.x + pB.x) / 2;
        labelY = (pA.y + pB.y) / 2;
      }
    }
    
    return { path, labelX, labelY };
  };

  return (
    <svg 
      ref={svgRef}
      className="w-full h-full block"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={handleContextMenu}
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="grid-line"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {connections.map(conn => {
        const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
        const targetNode = nodes.find(n => n.id === conn.targetNodeId);
        if (!sourceNode || !targetNode) return null;

        const p1 = getTerminalPosition(sourceNode, conn.sourceTerminalId);
        const p2 = getTerminalPosition(targetNode, conn.targetTerminalId);
        
        let result;
        if (conn.points && conn.points.length > 0) {
           result = getManualPath(p1.x, p1.y, conn.points, p2.x, p2.y);
        } else {
           switch (conn.wireStyle) {
             case WireStyle.CURVED:
               result = getCurvedPath(p1.x, p1.y, p2.x, p2.y);
               break;
             case WireStyle.STRAIGHT:
               result = getStraightPath(p1.x, p1.y, p2.x, p2.y);
               break;
             case WireStyle.ORTHOGONAL:
             default:
               const sourceTemplate = COMPONENT_TEMPLATES[sourceNode.templateType];
               const targetTemplate = COMPONENT_TEMPLATES[targetNode.templateType];
               const t1 = sourceTemplate.terminals.find(t => t.id === conn.sourceTerminalId);
               const t2 = targetTemplate.terminals.find(t => t.id === conn.targetTerminalId);
               const dir1 = getTerminalDirection(t1);
               const dir2 = getTerminalDirection(t2);
               result = getOrthogonalPath(p1.x, p1.y, dir1, p2.x, p2.y, dir2, conn.wireType);
               break;
           }
        }

        return (
          <g key={conn.id} className="wire-group">
            <path d={result.path} fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="wire-outline" />
            <path d={result.path} fill="none" stroke={WIRE_COLORS[conn.wireType]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none wire-core" />
            <circle cx={p1.x} cy={p1.y} r="4" fill={WIRE_COLORS[conn.wireType]} className="wire-junction" />
            <circle cx={p2.x} cy={p2.y} r="4" fill={WIRE_COLORS[conn.wireType]} className="wire-junction" />
            
            <g>
              <rect 
                x={result.labelX - 10} y={result.labelY - 7} width="20" height="14" 
                rx="3" fill="#1e293b" 
                className="wire-label-bg"
                stroke={WIRE_COLORS[conn.wireType]}
                strokeWidth="0.5"
              />
              <text 
                x={result.labelX} y={result.labelY + 3.5} 
                textAnchor="middle" 
                fontSize="11" 
                fill={WIRE_COLORS[conn.wireType]} 
                fontWeight="bold"
                className="select-none pointer-events-none wire-label-text"
              >
                {conn.wireType}
              </text>
            </g>
          </g>
        );
      })}

      {/* Draft Wire Drawing */}
      {wireDraft.isDrawing && (
        <path 
          d={(() => {
            const sourceNode = nodes.find(n => n.id === wireDraft.sourceNodeId);
            if (!sourceNode) return '';
            const p1 = getTerminalPosition(sourceNode, wireDraft.sourceTerminalId);
            
            // If we have manual points, connect them
            if (wireDraft.points.length > 0) {
               return getManualPath(p1.x, p1.y, wireDraft.points, wireDraft.currentX, wireDraft.currentY).path;
            }

            // Otherwise render preview of current style
            switch (activeWireStyle) {
                case WireStyle.CURVED:
                   return getCurvedPath(p1.x, p1.y, wireDraft.currentX, wireDraft.currentY).path;
                case WireStyle.STRAIGHT:
                   return getStraightPath(p1.x, p1.y, wireDraft.currentX, wireDraft.currentY).path;
                case WireStyle.ORTHOGONAL:
                default:
                   const sourceTemplate = COMPONENT_TEMPLATES[sourceNode.templateType];
                   const t1 = sourceTemplate.terminals.find(t => t.id === wireDraft.sourceTerminalId);
                   const dir1 = getTerminalDirection(t1);
                   // Guess dir2 based on mouse pos
                   const dx = wireDraft.currentX - p1.x;
                   const dy = wireDraft.currentY - p1.y;
                   const dir2: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'W' : 'E') : (dy > 0 ? 'N' : 'S');
                   return getOrthogonalPath(p1.x, p1.y, dir1, wireDraft.currentX, wireDraft.currentY, dir2, activeWireType).path;
            }
          })()}
          fill="none"
          stroke={WIRE_COLORS[activeWireType]}
          strokeWidth="2"
          strokeDasharray="5,5"
          className="pointer-events-none opacity-70"
        />
      )}

      {/* Render Manual Points (Drafting) */}
      {wireDraft.points.map((pt, idx) => (
        <circle key={idx} cx={pt.x} cy={pt.y} r="3" fill="white" opacity="0.5" />
      ))}

      {nodes.map(node => {
        const template = COMPONENT_TEMPLATES[node.templateType];
        const isSelected = dragState.nodeId === node.id;
        const isEditing = editingId === node.id;
        const displayLabel = node.customLabel || (template.type === 'text-annotation' ? "双击编辑注释" : template.name);
        const isAnnotation = template.type === 'text-annotation';
        
        return (
          <g 
            key={node.id} 
            transform={`translate(${node.x}, ${node.y})`}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            className={`cursor-move group ${isAnnotation ? 'annotation-group' : 'component-group'}`}
          >
            {isAnnotation ? (
              <rect 
                width={template.defaultWidth} 
                height={template.defaultHeight} 
                fill="#fef08a" 
                stroke={isSelected ? "#eab308" : "#ca8a04"}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray="4,2"
                rx="2"
                className="transition-colors shadow-sm component-note"
              />
            ) : (
              <rect 
                width={template.defaultWidth} 
                height={template.defaultHeight} 
                fill="#1e293b" 
                stroke={isSelected ? "#eab308" : "#475569"}
                strokeWidth={isSelected ? 2 : 1}
                rx="6"
                className="transition-colors shadow-lg drop-shadow-xl component-body"
              />
            )}

            <foreignObject width={template.defaultWidth} height={template.defaultHeight} style={{ pointerEvents: 'none' }}>
              <div 
                className={`w-full h-full flex flex-col ${isAnnotation ? 'items-start p-2' : 'items-center justify-center p-1'} select-none`}
                style={{ pointerEvents: 'auto' }}
                onDoubleClick={(e) => startEditing(e, node, displayLabel)}
              >
                {!isAnnotation && template.icon && React.createElement(template.icon, { 
                  size: Math.min(template.defaultWidth, template.defaultHeight) * 0.4, 
                  className: "text-slate-400 mb-1 pointer-events-none component-icon" 
                })}
                
                {isEditing ? (
                  isAnnotation ? (
                    <textarea
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveLabel}
                      onKeyDown={handleKeyDown}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-[13px] w-full h-full bg-transparent text-slate-900 border-none outline-none resize-none font-mono leading-tight"
                    />
                  ) : (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveLabel}
                      onKeyDown={handleKeyDown}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-[12px] w-full text-center bg-slate-800 text-white border border-blue-500 rounded px-0 py-0.5 outline-none shadow-inner font-sans"
                    />
                  )
                ) : (
                  <span className={`
                    ${isAnnotation 
                      ? 'text-[13px] text-slate-800 font-mono text-left whitespace-pre-wrap w-full h-full overflow-hidden leading-tight' 
                      : 'text-[12px] text-slate-300 font-medium text-center leading-tight overflow-hidden px-1 w-full text-ellipsis whitespace-nowrap'
                    } 
                    cursor-text hover:text-yellow-600 transition-colors component-label
                  `}>
                    {displayLabel}
                  </span>
                )}
              </div>
            </foreignObject>

            {template.terminals.map(term => {
               const cx = term.xOffset * template.defaultWidth;
               const cy = term.yOffset * template.defaultHeight;
               const isHovered = hoveredTerminal?.nodeId === node.id && hoveredTerminal?.terminalId === term.id;

               return (
                 <g key={term.id}>
                   <circle 
                     cx={cx} cy={cy} r={12} fill="transparent"
                     onMouseEnter={() => setHoveredTerminal({nodeId: node.id, terminalId: term.id})}
                     onMouseLeave={() => setHoveredTerminal(null)}
                     onMouseDown={(e) => handleTerminalMouseDown(e, node.id, term.id)}
                     onMouseUp={(e) => handleTerminalMouseUp(e, node.id, term.id)}
                     className="cursor-crosshair"
                   />
                   <circle 
                     cx={cx} cy={cy} r={4} 
                     fill={isHovered ? "#eab308" : "#94a3b8"}
                     stroke="#0f172a" strokeWidth="1"
                     className="pointer-events-none transition-colors terminal-point"
                   />
                   <text x={cx} y={term.yOffset > 0.5 ? cy - 10 : cy + 14} textAnchor="middle" fill="#64748b" fontSize="10" className="pointer-events-none select-none terminal-label">
                     {term.label}
                   </text>
                 </g>
               );
            })}
            
            {!isEditing && (
              <g 
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer delete-btn"
                onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                transform={`translate(${template.defaultWidth + 10}, -20)`}
              >
                <circle r="8" fill="#ef4444" />
                <line x1="-3" y1="-3" x2="3" y2="3" stroke="white" strokeWidth="1.5" />
                <line x1="3" y1="-3" x2="-3" y2="3" stroke="white" strokeWidth="1.5" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default CircuitCanvas;