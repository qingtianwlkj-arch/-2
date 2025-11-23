import { GoogleGenAI } from "@google/genai";
import { CircuitNode, CircuitConnection } from "../types";
import { COMPONENT_TEMPLATES } from "../constants";

export const analyzeCircuit = async (
  nodes: CircuitNode[], 
  connections: CircuitConnection[]
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });

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