import { ComponentCategory, ComponentTemplate, WireType } from './types';
import { 
  Zap, Power, Lightbulb, Fan, ToggleLeft, ShieldAlert, ShieldCheck, Shield, 
  CloudLightning, Plug, StickyNote, Gauge, Timer, Repeat, Activity, 
  AlertOctagon, Sliders, Settings2, BoxSelect, GripHorizontal, CircleDot,
  ToggleRight, MousePointerClick, Unplug
} from 'lucide-react';

export const COMPONENT_TEMPLATES: Record<string, ComponentTemplate> = {
  // --- 一、电源/进线 ---
  '3ph-source': {
    type: '3ph-source',
    name: '三相五线进线 (TN-S)',
    category: ComponentCategory.SOURCE,
    defaultWidth: 120,
    defaultHeight: 80,
    icon: Zap,
    terminals: [
      { id: 'L1', label: 'L1', xOffset: 0.1, yOffset: 1, type: 'output' },
      { id: 'L2', label: 'L2', xOffset: 0.3, yOffset: 1, type: 'output' },
      { id: 'L3', label: 'L3', xOffset: 0.5, yOffset: 1, type: 'output' },
      { id: 'N', label: 'N', xOffset: 0.7, yOffset: 1, type: 'output' },
      { id: 'PE', label: 'PE', xOffset: 0.9, yOffset: 1, type: 'output' },
    ]
  },
  '1ph-source': {
    type: '1ph-source',
    name: '单相电源进线',
    category: ComponentCategory.SOURCE,
    defaultWidth: 60,
    defaultHeight: 60,
    icon: Plug,
    terminals: [
      { id: 'L', label: 'L', xOffset: 0.3, yOffset: 1, type: 'output' },
      { id: 'N', label: 'N', xOffset: 0.7, yOffset: 1, type: 'output' },
      { id: 'PE', label: 'PE', xOffset: 0.5, yOffset: 0.5, type: 'output' },
    ]
  },

  // --- 二、断路器/保护 ---
  'ats-4p': {
    type: 'ats-4p',
    name: '双电源切换 (ATS)',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 140,
    defaultHeight: 140,
    icon: Repeat,
    terminals: [
      { id: 'A1', label: 'A1', xOffset: 0.1, yOffset: 0, type: 'input' },
      { id: 'A2', label: 'A2', xOffset: 0.2, yOffset: 0, type: 'input' },
      { id: 'A3', label: 'A3', xOffset: 0.3, yOffset: 0, type: 'input' },
      { id: 'AN', label: 'AN', xOffset: 0.4, yOffset: 0, type: 'input' },
      { id: 'B1', label: 'B1', xOffset: 0.6, yOffset: 0, type: 'input' },
      { id: 'B2', label: 'B2', xOffset: 0.7, yOffset: 0, type: 'input' },
      { id: 'B3', label: 'B3', xOffset: 0.8, yOffset: 0, type: 'input' },
      { id: 'BN', label: 'BN', xOffset: 0.9, yOffset: 0, type: 'input' },
      { id: 'O1', label: 'L1', xOffset: 0.2, yOffset: 1, type: 'output' },
      { id: 'O2', label: 'L2', xOffset: 0.4, yOffset: 1, type: 'output' },
      { id: 'O3', label: 'L3', xOffset: 0.6, yOffset: 1, type: 'output' },
      { id: 'ON', label: 'N', xOffset: 0.8, yOffset: 1, type: 'output' },
    ]
  },
  'mccb-3p': {
    type: 'mccb-3p',
    name: '塑壳断路器 (MCCB 3P)',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 100,
    defaultHeight: 130,
    icon: Shield,
    terminals: [
      { id: '1', label: '1', xOffset: 0.2, yOffset: 0, type: 'input' },
      { id: '3', label: '3', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: '5', label: '5', xOffset: 0.8, yOffset: 0, type: 'input' },
      { id: '2', label: '2', xOffset: 0.2, yOffset: 1, type: 'output' },
      { id: '4', label: '4', xOffset: 0.5, yOffset: 1, type: 'output' },
      { id: '6', label: '6', xOffset: 0.8, yOffset: 1, type: 'output' },
    ]
  },
  'mcb-4p': {
    type: 'mcb-4p',
    name: '微断 4P',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 110,
    defaultHeight: 100,
    icon: Shield,
    terminals: [
      { id: '1', label: '1', xOffset: 0.15, yOffset: 0, type: 'input' },
      { id: '3', label: '3', xOffset: 0.38, yOffset: 0, type: 'input' },
      { id: '5', label: '5', xOffset: 0.62, yOffset: 0, type: 'input' },
      { id: 'N1', label: 'N', xOffset: 0.85, yOffset: 0, type: 'input' },
      { id: '2', label: '2', xOffset: 0.15, yOffset: 1, type: 'output' },
      { id: '4', label: '4', xOffset: 0.38, yOffset: 1, type: 'output' },
      { id: '6', label: '6', xOffset: 0.62, yOffset: 1, type: 'output' },
      { id: 'N2', label: 'N', xOffset: 0.85, yOffset: 1, type: 'output' },
    ]
  },
  'mcb-3p': {
    type: 'mcb-3p',
    name: '微断 3P',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 80,
    defaultHeight: 100,
    icon: Shield,
    terminals: [
      { id: '1', label: '1', xOffset: 0.2, yOffset: 0, type: 'input' },
      { id: '3', label: '3', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: '5', label: '5', xOffset: 0.8, yOffset: 0, type: 'input' },
      { id: '2', label: '2', xOffset: 0.2, yOffset: 1, type: 'output' },
      { id: '4', label: '4', xOffset: 0.5, yOffset: 1, type: 'output' },
      { id: '6', label: '6', xOffset: 0.8, yOffset: 1, type: 'output' },
    ]
  },
  'mcb-2p': {
    type: 'mcb-2p',
    name: '微断 2P',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 55,
    defaultHeight: 100,
    icon: Shield,
    terminals: [
      { id: '1', label: '1', xOffset: 0.3, yOffset: 0, type: 'input' },
      { id: '3', label: '3', xOffset: 0.7, yOffset: 0, type: 'input' },
      { id: '2', label: '2', xOffset: 0.3, yOffset: 1, type: 'output' },
      { id: '4', label: '4', xOffset: 0.7, yOffset: 1, type: 'output' },
    ]
  },
  'mcb-1p': {
    type: 'mcb-1p',
    name: '微断 1P',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 30,
    defaultHeight: 100,
    icon: Shield,
    terminals: [
      { id: '1', label: '1', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: '2', label: '2', xOffset: 0.5, yOffset: 1, type: 'output' },
    ]
  },
  'rcbo-2p': {
    type: 'rcbo-2p',
    name: '漏电保护器 2P',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 70,
    defaultHeight: 100,
    icon: ShieldCheck,
    terminals: [
      { id: 'inL', label: '1', xOffset: 0.3, yOffset: 0, type: 'input' },
      { id: 'inN', label: 'N', xOffset: 0.7, yOffset: 0, type: 'input' },
      { id: 'outL', label: '2', xOffset: 0.3, yOffset: 1, type: 'output' },
      { id: 'outN', label: 'N', xOffset: 0.7, yOffset: 1, type: 'output' },
    ]
  },
  'rcbo-4p': {
    type: 'rcbo-4p',
    name: '漏电保护器 4P',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 120,
    defaultHeight: 100,
    icon: ShieldCheck,
    terminals: [
      { id: 'in1', label: '1', xOffset: 0.15, yOffset: 0, type: 'input' },
      { id: 'in2', label: '3', xOffset: 0.38, yOffset: 0, type: 'input' },
      { id: 'in3', label: '5', xOffset: 0.62, yOffset: 0, type: 'input' },
      { id: 'inN', label: 'N', xOffset: 0.85, yOffset: 0, type: 'input' },
      { id: 'out1', label: '2', xOffset: 0.15, yOffset: 1, type: 'output' },
      { id: 'out2', label: '4', xOffset: 0.38, yOffset: 1, type: 'output' },
      { id: 'out3', label: '6', xOffset: 0.62, yOffset: 1, type: 'output' },
      { id: 'outN', label: 'N', xOffset: 0.85, yOffset: 1, type: 'output' },
    ]
  },
  'spd-4p': {
    type: 'spd-4p',
    name: '浪涌保护器 (4P)',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 110,
    defaultHeight: 90,
    icon: CloudLightning,
    terminals: [
      { id: 'L1', label: 'L1', xOffset: 0.15, yOffset: 0, type: 'input' },
      { id: 'L2', label: 'L2', xOffset: 0.38, yOffset: 0, type: 'input' },
      { id: 'L3', label: 'L3', xOffset: 0.62, yOffset: 0, type: 'input' },
      { id: 'N', label: 'N', xOffset: 0.85, yOffset: 0, type: 'input' },
      { id: 'PE', label: 'PE', xOffset: 0.5, yOffset: 1, type: 'output' },
    ]
  },
  'fuse-base': {
    type: 'fuse-base',
    name: '熔断器底座 (RT18)',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 30,
    defaultHeight: 80,
    icon: Unplug,
    terminals: [
      { id: '1', label: '1', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: '2', label: '2', xOffset: 0.5, yOffset: 1, type: 'output' },
    ]
  },
  'thermal-relay': {
    type: 'thermal-relay',
    name: '热继电器 (JR)',
    category: ComponentCategory.PROTECTION,
    defaultWidth: 80,
    defaultHeight: 90,
    icon: Activity,
    terminals: [
      { id: '1', label: '1', xOffset: 0.2, yOffset: 0, type: 'input' },
      { id: '3', label: '3', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: '5', label: '5', xOffset: 0.8, yOffset: 0, type: 'input' },
      { id: '2', label: '2', xOffset: 0.2, yOffset: 1, type: 'output' },
      { id: '4', label: '4', xOffset: 0.5, yOffset: 1, type: 'output' },
      { id: '6', label: '6', xOffset: 0.8, yOffset: 1, type: 'output' },
      { id: '95', label: 'NC', xOffset: 0, yOffset: 0.3, type: 'bi' },
      { id: '96', label: 'NC', xOffset: 0, yOffset: 0.7, type: 'bi' },
      { id: '97', label: 'NO', xOffset: 1, yOffset: 0.3, type: 'bi' },
      { id: '98', label: 'NO', xOffset: 1, yOffset: 0.7, type: 'bi' },
    ]
  },

  // --- 三、控制/开关 ---
  'contactor-ac': {
    type: 'contactor-ac',
    name: '交流接触器 (CJX2)',
    category: ComponentCategory.CONTROL,
    defaultWidth: 90,
    defaultHeight: 110,
    icon: ToggleLeft,
    terminals: [
      { id: '1', label: '1/L1', xOffset: 0.2, yOffset: 0, type: 'input' },
      { id: '3', label: '3/L2', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: '5', label: '5/L3', xOffset: 0.8, yOffset: 0, type: 'input' },
      { id: '2', label: '2/T1', xOffset: 0.2, yOffset: 1, type: 'output' },
      { id: '4', label: '4/T2', xOffset: 0.5, yOffset: 1, type: 'output' },
      { id: '6', label: '6/T3', xOffset: 0.8, yOffset: 1, type: 'output' },
      { id: 'A1', label: 'A1', xOffset: 0.05, yOffset: 0.2, type: 'input' },
      { id: 'A2', label: 'A2', xOffset: 0.95, yOffset: 0.2, type: 'input' },
      { id: '13', label: '13NO', xOffset: 0.05, yOffset: 0.7, type: 'bi' },
      { id: '14', label: '14NO', xOffset: 0.95, yOffset: 0.7, type: 'bi' },
    ]
  },
  'relay-inter': {
    type: 'relay-inter',
    name: '中间继电器 (MY4N)',
    category: ComponentCategory.CONTROL,
    defaultWidth: 60,
    defaultHeight: 80,
    icon: BoxSelect,
    terminals: [
      { id: '13', label: '13', xOffset: 0.2, yOffset: 1, type: 'input' }, // Coil
      { id: '14', label: '14', xOffset: 0.8, yOffset: 1, type: 'input' }, // Coil
      { id: '9', label: '9', xOffset: 0.2, yOffset: 0, type: 'bi' }, // Com
      { id: '5', label: '5', xOffset: 0.5, yOffset: 0, type: 'bi' }, // NO
      { id: '1', label: '1', xOffset: 0.8, yOffset: 0, type: 'bi' }, // NC
    ]
  },
  'relay-time': {
    type: 'relay-time',
    name: '时间继电器 (JS14)',
    category: ComponentCategory.CONTROL,
    defaultWidth: 60,
    defaultHeight: 80,
    icon: Timer,
    terminals: [
      { id: '2', label: '2', xOffset: 0.2, yOffset: 1, type: 'input' },
      { id: '7', label: '7', xOffset: 0.8, yOffset: 1, type: 'input' },
      { id: '8', label: '8', xOffset: 0.5, yOffset: 0, type: 'bi' },
      { id: '6', label: '6', xOffset: 0.8, yOffset: 0, type: 'bi' },
    ]
  },
  'switch-start': {
    type: 'switch-start',
    name: '启动按钮 (绿色 NO)',
    category: ComponentCategory.CONTROL,
    defaultWidth: 50,
    defaultHeight: 50,
    icon: MousePointerClick,
    terminals: [
      { id: '3', label: '3', xOffset: 0, yOffset: 0.5, type: 'bi' },
      { id: '4', label: '4', xOffset: 1, yOffset: 0.5, type: 'bi' },
    ]
  },
  'switch-stop': {
    type: 'switch-stop',
    name: '停止按钮 (红色 NC)',
    category: ComponentCategory.CONTROL,
    defaultWidth: 50,
    defaultHeight: 50,
    icon: CircleDot,
    terminals: [
      { id: '1', label: '1', xOffset: 0, yOffset: 0.5, type: 'bi' },
      { id: '2', label: '2', xOffset: 1, yOffset: 0.5, type: 'bi' },
    ]
  },
  'switch-estop': {
    type: 'switch-estop',
    name: '急停按钮',
    category: ComponentCategory.CONTROL,
    defaultWidth: 50,
    defaultHeight: 50,
    icon: AlertOctagon,
    terminals: [
      { id: '1', label: '1', xOffset: 0, yOffset: 0.5, type: 'bi' },
      { id: '2', label: '2', xOffset: 1, yOffset: 0.5, type: 'bi' },
    ]
  },
  'switch-selector': {
    type: 'switch-selector',
    name: '旋钮开关 (三档)',
    category: ComponentCategory.CONTROL,
    defaultWidth: 60,
    defaultHeight: 60,
    icon: Settings2,
    terminals: [
      { id: '1', label: '1', xOffset: 0.2, yOffset: 0.5, type: 'bi' },
      { id: '2', label: '2', xOffset: 0.8, yOffset: 0.5, type: 'bi' },
      { id: '3', label: '3', xOffset: 0.5, yOffset: 1, type: 'bi' },
    ]
  },
  'switch-1gang': {
    type: 'switch-1gang',
    name: '单联开关',
    category: ComponentCategory.CONTROL,
    defaultWidth: 50,
    defaultHeight: 50,
    icon: ToggleRight,
    terminals: [
      { id: 'L', label: 'L', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: 'L1', label: 'L1', xOffset: 0.5, yOffset: 1, type: 'output' },
    ]
  },

  // --- 四、仪表/互感器 ---
  'meter-multi': {
    type: 'meter-multi',
    name: '多功能电力仪表',
    category: ComponentCategory.MEASUREMENT,
    defaultWidth: 90,
    defaultHeight: 90,
    icon: Gauge,
    terminals: [
      { id: 'V1', label: 'U1', xOffset: 0.1, yOffset: 1, type: 'input' },
      { id: 'V2', label: 'U2', xOffset: 0.3, yOffset: 1, type: 'input' },
      { id: 'V3', label: 'U3', xOffset: 0.5, yOffset: 1, type: 'input' },
      { id: 'N', label: 'N', xOffset: 0.7, yOffset: 1, type: 'input' },
      { id: 'I1', label: 'I*', xOffset: 0.9, yOffset: 0.3, type: 'input' },
      { id: 'I2', label: 'I*', xOffset: 0.9, yOffset: 0.7, type: 'input' },
    ]
  },
  'ct': {
    type: 'ct',
    name: '电流互感器 (CT)',
    category: ComponentCategory.MEASUREMENT,
    defaultWidth: 50,
    defaultHeight: 60,
    icon: Activity,
    terminals: [
      { id: 'P1', label: 'P1', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: 'P2', label: 'P2', xOffset: 0.5, yOffset: 1, type: 'output' },
      { id: 'S1', label: 'S1', xOffset: 0, yOffset: 0.5, type: 'output' },
      { id: 'S2', label: 'S2', xOffset: 1, yOffset: 0.5, type: 'output' },
    ]
  },

  // --- 五、端子/辅材 ---
  'terminal-ground': {
    type: 'terminal-ground',
    name: 'PE 接地排',
    category: ComponentCategory.ACCESSORY,
    defaultWidth: 150,
    defaultHeight: 30,
    icon: GripHorizontal,
    terminals: [
      { id: 'PE1', label: 'PE', xOffset: 0.1, yOffset: 0.5, type: 'bi' },
      { id: 'PE2', label: 'PE', xOffset: 0.3, yOffset: 0.5, type: 'bi' },
      { id: 'PE3', label: 'PE', xOffset: 0.5, yOffset: 0.5, type: 'bi' },
      { id: 'PE4', label: 'PE', xOffset: 0.7, yOffset: 0.5, type: 'bi' },
      { id: 'PE5', label: 'PE', xOffset: 0.9, yOffset: 0.5, type: 'bi' },
    ]
  },
  'terminal-neutral': {
    type: 'terminal-neutral',
    name: 'N 零线排',
    category: ComponentCategory.ACCESSORY,
    defaultWidth: 150,
    defaultHeight: 30,
    icon: GripHorizontal,
    terminals: [
      { id: 'N1', label: 'N', xOffset: 0.1, yOffset: 0.5, type: 'bi' },
      { id: 'N2', label: 'N', xOffset: 0.3, yOffset: 0.5, type: 'bi' },
      { id: 'N3', label: 'N', xOffset: 0.5, yOffset: 0.5, type: 'bi' },
      { id: 'N4', label: 'N', xOffset: 0.7, yOffset: 0.5, type: 'bi' },
      { id: 'N5', label: 'N', xOffset: 0.9, yOffset: 0.5, type: 'bi' },
    ]
  },

  // --- 六、负载/外设 ---
  'motor-3ph': {
    type: 'motor-3ph',
    name: '三相异步电机',
    category: ComponentCategory.LOAD,
    defaultWidth: 100,
    defaultHeight: 100,
    icon: Fan,
    terminals: [
      { id: 'U', label: 'U', xOffset: 0.2, yOffset: 0, type: 'input' },
      { id: 'V', label: 'V', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: 'W', label: 'W', xOffset: 0.8, yOffset: 0, type: 'input' },
      { id: 'PE', label: 'PE', xOffset: 1, yOffset: 1, type: 'input' },
    ]
  },
  'socket-5hole': {
    type: 'socket-5hole',
    name: '五孔插座 (面板)',
    category: ComponentCategory.LOAD,
    defaultWidth: 60,
    defaultHeight: 60,
    icon: Plug,
    terminals: [
      { id: 'PE', label: 'PE', xOffset: 0.5, yOffset: 0, type: 'input' },
      { id: 'L', label: 'L', xOffset: 0.2, yOffset: 1, type: 'input' },
      { id: 'N', label: 'N', xOffset: 0.8, yOffset: 1, type: 'input' },
    ]
  },
  'lamp-indicator': {
    type: 'lamp-indicator',
    name: '信号指示灯',
    category: ComponentCategory.LOAD,
    defaultWidth: 50,
    defaultHeight: 50,
    icon: Lightbulb,
    terminals: [
      { id: 'X1', label: 'X1', xOffset: 0.5, yOffset: 1, type: 'input' },
      { id: 'X2', label: 'X2', xOffset: 0.5, yOffset: 0, type: 'input' },
    ]
  },
  'limit-switch': {
    type: 'limit-switch',
    name: '行程开关 (SQ)',
    category: ComponentCategory.LOAD,
    defaultWidth: 60,
    defaultHeight: 60,
    icon: Sliders,
    terminals: [
      { id: 'NO', label: 'NO', xOffset: 0.2, yOffset: 0.5, type: 'bi' },
      { id: 'COM', label: 'C', xOffset: 0.8, yOffset: 0.5, type: 'bi' },
    ]
  },

  // --- 七、辅助 ---
  'text-annotation': {
    type: 'text-annotation',
    name: '文字备注/标签',
    category: ComponentCategory.AUXILIARY,
    defaultWidth: 120,
    defaultHeight: 40,
    icon: StickyNote,
    terminals: []
  }
};

export const WIRE_COLORS: Record<WireType, string> = {
  [WireType.L1]: '#eab308', // Yellow
  [WireType.L2]: '#22c55e', // Green
  [WireType.L3]: '#ef4444', // Red
  [WireType.N]: '#3b82f6',  // Blue
  [WireType.PE]: '#84cc16', // Yellow-Green
};

export const WIRE_LABELS: Record<WireType, string> = {
  [WireType.L1]: 'L1 (A相)',
  [WireType.L2]: 'L2 (B相)',
  [WireType.L3]: 'L3 (C相)',
  [WireType.N]: 'N (零线)',
  [WireType.PE]: 'PE (地线)',
};