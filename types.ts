import { LucideIcon } from "lucide-react";

export enum WireType {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  N = 'N',
  PE = 'PE'
}

export enum WireStyle {
  ORTHOGONAL = 'orthogonal',
  CURVED = 'curved',
  STRAIGHT = 'straight'
}

export enum ComponentCategory {
  SOURCE = '电源/进线',
  PROTECTION = '断路器/保护',
  CONTROL = '控制/开关',
  MEASUREMENT = '仪表/互感器',
  LOAD = '负载/外设',
  ACCESSORY = '端子/辅材',
  AUXILIARY = '辅助标注'
}

export interface ComponentTemplate {
  type: string;
  name: string;
  category: ComponentCategory;
  defaultWidth: number;
  defaultHeight: number;
  terminals: TerminalDef[];
  icon?: LucideIcon;
  svgPath?: string; // For custom drawing
}

export interface TerminalDef {
  id: string;
  label: string;
  xOffset: number; // 0-1 percentage relative to width
  yOffset: number; // 0-1 percentage relative to height
  type: 'input' | 'output' | 'bi';
}

export interface CircuitNode {
  id: string;
  templateType: string;
  x: number;
  y: number;
  customLabel?: string;
  customImage?: string;
}

export interface CircuitConnection {
  id: string;
  sourceNodeId: string;
  sourceTerminalId: string;
  targetNodeId: string;
  targetTerminalId: string;
  wireType: WireType;
  wireStyle: WireStyle;
  points?: Point[]; // For manual routing waypoints
}

export interface Point {
  x: number;
  y: number;
}