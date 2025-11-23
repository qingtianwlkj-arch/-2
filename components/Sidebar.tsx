import React from 'react';
import { COMPONENT_TEMPLATES } from '../constants';
import { ComponentCategory } from '../types';
import { GripVertical } from 'lucide-react';

interface SidebarProps {
  onDragStart: (e: React.DragEvent, type: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => {
  const categories = Object.values(ComponentCategory);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full overflow-y-auto text-slate-200">
      <div className="p-4 border-b border-slate-700 bg-slate-950">
        <h2 className="font-bold text-lg text-yellow-500 flex items-center gap-2">
          <span>⚡</span> 元器件库
        </h2>
        <p className="text-xs text-slate-400 mt-1">拖拽至画布添加</p>
      </div>

      <div className="p-2 space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              {category}
            </h3>
            <div className="space-y-2">
              {Object.values(COMPONENT_TEMPLATES)
                .filter(c => c.category === category)
                .map(template => (
                  <div
                    key={template.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, template.type)}
                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors border border-slate-700 hover:border-yellow-500/50 group shadow-sm"
                  >
                    <div className="text-slate-400 group-hover:text-yellow-500 transition-colors">
                      <GripVertical size={16} />
                    </div>
                    {template.icon && React.createElement(template.icon, { size: 20, className: "text-slate-300" })}
                    <span className="text-sm font-medium">{template.name}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          ProCircuit 架构师 v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;