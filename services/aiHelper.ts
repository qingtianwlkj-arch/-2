import { GoogleGenAI, Type } from "@google/genai";
import { CircuitNode, CircuitConnection, WireType, WireStyle } from "../types";
import { COMPONENT_TEMPLATES } from "../constants";

const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeCircuit = async (
  nodes: CircuitNode[], 
  connections: CircuitConnection[]
): Promise<string> => {
  try {
    if (!ai) throw new Error("API Key not found");

    // Construct a text representation of the circuit
    const componentList = nodes.map(n => {
      const template = COMPONENT_TEMPLATES[n.templateType];
      const name = n.customLabel || template.name;
      return `- ${name} (ID: ${n.id}) 坐标 [${Math.round(n.x)}, ${Math.round(n.y)}]`;
    }).join('\n');

    const connectionList = connections.map(c => {
      const sourceNode = nodes.find(n => n.id === c.sourceNodeId);
      const targetNode = nodes.find(n => n.id === c.targetNodeId);
      
      const sourceTemplate = sourceNode ? COMPONENT_TEMPLATES[sourceNode.templateType] : null;
      const targetTemplate = targetNode ? COMPONENT_TEMPLATES[targetNode.templateType] : null;
      
      const sourceName = sourceNode?.customLabel || sourceTemplate?.name || "Unknown";
      const targetName = targetNode?.customLabel || targetTemplate?.name || "Unknown";

      return `- 导线 (${c.wireType}) 从 ${sourceName}:${c.sourceTerminalId} 连接到 ${targetName}:${c.targetTerminalId}`;
    }).join('\n');

    const prompt = `
      你是一位资深电气工程师专家。请分析以下电路图结构：
      
      元器件列表：
      ${componentList}

      连接列表：
      ${connectionList}

      请提供一份简明扼要的中文分析报告，包含以下内容：
      1. 这个电路的主要功能是什么？
      2. 是否存在明显的安全隐患或缺少保护元件（如熔断器、断路器或接地）？
      3. 给出一个有效的布线或改进建议。
      
      请保持语气专业且乐于助人。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法生成分析报告。";

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "暂时无法分析电路。请检查您的 API Key 或网络连接。";
  }
};

export const generateCircuitFromImage = async (base64Image: string): Promise<{nodes: CircuitNode[], connections: CircuitConnection[]} | null> => {
  try {
    if (!ai) throw new Error("API Key not found");

    const validTypes = Object.keys(COMPONENT_TEMPLATES).join(', ');

    const prompt = `
      Analyze this electrical circuit image or distribution box photo.
      Identify the electrical components and their approximate relative positions.
      
      Map the identified components to the following supported type keys:
      [${validTypes}]

      If you see a generic Circuit Breaker:
      - Use 'mcb-1p' for thin single pole.
      - Use 'mcb-2p' or 'mcb-3p' for wider ones.
      - Use 'mcb-4p' or 'mccb-3p' for large main switches.
      
      If you see a Contactor, use 'contactor-ac'.
      If you see a Terminal Block, use 'terminal-neutral' or 'terminal-ground'.
      If you see a Meter, use 'meter-multi'.

      Return a JSON object with:
      1. 'nodes': Array of components. Each must have:
         - 'templateType': One of the keys listed above.
         - 'x': Approximate X coordinate (0-1000).
         - 'y': Approximate Y coordinate (0-800).
         - 'label': A short name (e.g., "QF1", "KM1").
      2. 'connections': Array of inferred connections (if wires are clearly visible). 
         - 'fromIndex': Index of source node in the nodes array.
         - 'toIndex': Index of target node in the nodes array.
         - 'wireType': 'L1', 'L2', 'L3', 'N', or 'PE'.

      Output raw JSON only. No markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  templateType: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  label: { type: Type.STRING }
                }
              }
            },
            connections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fromIndex: { type: Type.INTEGER },
                  toIndex: { type: Type.INTEGER },
                  wireType: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) return null;

    const data = JSON.parse(resultText);
    
    // Transform simple JSON to full CircuitNode/Connection objects
    const newNodes: CircuitNode[] = data.nodes.map((n: any, idx: number) => ({
      id: `node_${Date.now()}_${idx}`,
      templateType: COMPONENT_TEMPLATES[n.templateType] ? n.templateType : 'mcb-1p', // Fallback
      x: n.x,
      y: n.y,
      customLabel: n.label
    }));

    const newConnections: CircuitConnection[] = [];
    
    if (data.connections) {
      data.connections.forEach((c: any, idx: number) => {
        const source = newNodes[c.fromIndex];
        const target = newNodes[c.toIndex];
        
        if (source && target) {
          // Auto-guess terminals (simplified)
          const sourceTmpl = COMPONENT_TEMPLATES[source.templateType];
          const targetTmpl = COMPONENT_TEMPLATES[target.templateType];
          
          // Try to connect output of source to input of target
          const sourceTerm = sourceTmpl.terminals.find(t => t.type === 'output' || t.type === 'bi') || sourceTmpl.terminals[0];
          const targetTerm = targetTmpl.terminals.find(t => t.type === 'input' || t.type === 'bi') || targetTmpl.terminals[0];

          if (sourceTerm && targetTerm) {
             newConnections.push({
               id: `conn_${Date.now()}_${idx}`,
               sourceNodeId: source.id,
               sourceTerminalId: sourceTerm.id,
               targetNodeId: target.id,
               targetTerminalId: targetTerm.id,
               wireType: (c.wireType as WireType) || WireType.L1,
               wireStyle: WireStyle.ORTHOGONAL
             });
          }
        }
      });
    }

    return { nodes: newNodes, connections: newConnections };

  } catch (error) {
    console.error("Vision generation failed:", error);
    return null;
  }
};
