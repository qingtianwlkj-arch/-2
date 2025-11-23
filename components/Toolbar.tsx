import React from 'react';
import { WireType, WireStyle } from '../types';
import { WIRE_COLORS, WIRE_LABELS } from '../constants';
import { Trash2, Sparkles, Loader2, FileDown, Undo2, Redo2, CornerDownRight, Spline, Minus, List } from 'lucide-react';

interface ToolbarProps {
  activeWireType: WireType;
  activeWireStyle: WireStyle;
  onWireTypeChange: (type: WireType) => void;
  onWireStyleChange: (style: WireStyle) => void;
  onClear: () => void;
  onAnalyze: () => void;
  onExport: () => void;
  onExportBOM: () => void; // New prop
  isAnalyzing: boolean;
  isExporting: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeWireType, 
  activeWireStyle,
  onWireTypeChange, 
  onWireStyleChange,
  onClear,
  onAnalyze,
  onExport,
  onExportBOM,
  isAnalyzing,
  isExporting,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shadow-md z-10 gap-4">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
        {/* History Controls */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="重做 (Ctrl+Y)"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 size={18} />
          </button>
        </div>

        <div className="h-8 w-px bg-slate-800 shrink-0" />

        {/* Wire Style Selection */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700 shrink-0">
           <button
              onClick={() => onWireStyleChange(WireStyle.ORTHOGONAL)}
              title="智能直角 (默认)"
              className={`p-1.5 rounded transition-colors ${activeWireStyle === WireStyle.ORTHOGONAL ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
           >
              <CornerDownRight size={18} />
           </button>
           <button
              onClick={() => onWireStyleChange(WireStyle.CURVED)}
              title="平滑曲线"
              className={`p-1.5 rounded transition-colors ${activeWireStyle === WireStyle.CURVED ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
           >
              <Spline size={18} />
           </button>
           <button
              onClick={() => onWireStyleChange(WireStyle.STRAIGHT)}
              title="直线连接"
              className={`p-1.5 rounded transition-colors ${activeWireStyle === WireStyle.STRAIGHT ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
           >
              <Minus size={18} className="rotate-45" />
           </button>
        </div>

        <div className="h-8 w-px bg-slate-800 shrink-0" />

        {/* Wire Selection */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            {Object.values(WireType).map((type) => (
              <button
                key={type}
                onClick={() => onWireTypeChange(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  activeWireType === type 
                    ? 'bg-slate-700 shadow-sm ring-1 ring-inset ring-white/10 translate-y-0' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: WIRE_COLORS[type] }}
                />
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-slate-500 hidden xl:block shrink-0">
          当前: <span style={{ color: WIRE_COLORS[activeWireType] }}>{WIRE_LABELS[activeWireType]}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportBOM}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all border border-slate-700"
          title="导出配电箱材料清单 (CSV)"
        >
           <List size={16} />
           <span className="hidden xl:inline">清单</span>
        </button>

        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all border border-slate-700 disabled:opacity-50"
          title="导出工程图纸 (PDF)"
        >
           {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
           <span className="hidden xl:inline">图纸</span>
        </button>

        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          <span className="hidden xl:inline">AI 检测</span>
        </button>

        <button
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20 text-sm font-medium rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;