import { GoogleGenAI, Type } from "@google/genai";
import { FMEAItem, ControlPlanItem } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

export async function suggestFMEAContent(processStep: string, func: string, product: string): Promise<Partial<FMEAItem>[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert in Process FMEA (PFMEA). 
Suggest ALL relevant PFMEA scenarios (failure modes) based on the following inputs:
Process Step: ${processStep || "Suggest based on function"}
Function: ${func}
Product Characteristic: ${product}

Return a JSON array of objects, where each object has the following fields:
- process_step: The process step name (use the provided one or suggest a better one).
- function: The function (use the provided one or suggest a better one).
- product: The product characteristic (use the provided one or suggest a better one).
- process: A specific process characteristic requirement.
- potential_failure_mode: A specific failure mode.
- potential_effects: Impact on customer/process.
- severity: Integer (1-10).
- potential_causes: Root cause of failure.
- occurrence: Integer (1-10).
- current_prevention: Process control to prevent (BASED ON THE POTENTIAL CAUSES AND PROCESS STEP).
- current_detection: Process control to detect (BASED ON THE POTENTIAL CAUSES AND PROCESS STEP).
- detection: Integer (1-10).
- recommended_action: Action to reduce risk.

Provide exactly 3 realistic and optimized failure modes for this combination.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            process_step: { type: Type.STRING },
            function: { type: Type.STRING },
            product: { type: Type.STRING },
            process: { type: Type.STRING },
            potential_failure_mode: { type: Type.STRING },
            potential_effects: { type: Type.STRING },
            severity: { type: Type.INTEGER },
            potential_causes: { type: Type.STRING },
            occurrence: { type: Type.INTEGER },
            current_prevention: { type: Type.STRING },
            current_detection: { type: Type.STRING },
            detection: { type: Type.INTEGER },
            recommended_action: { type: Type.STRING }
          },
          required: [
            "process_step",
            "function",
            "product",
            "process",
            "potential_failure_mode", 
            "potential_effects", 
            "severity", 
            "potential_causes", 
            "occurrence", 
            "current_prevention", 
            "current_detection", 
            "detection",
            "recommended_action"
          ]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    const data = JSON.parse(text) as any[];
    return data.map(item => ({
      ...item,
      rpn: (item.severity || 0) * (item.occurrence || 0) * (item.detection || 0)
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function suggestRecommendedAction(failureMode: string, effects: string, causes: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert in Process FMEA (PFMEA). 
Suggest a 'Recommended Action' to reduce risk for the following scenario:
Potential Failure Mode: ${failureMode}
Potential Effects: ${effects}
Potential Causes: ${causes}

Return only the text for the recommended action.`,
  });

  return response.text || "";
}

export async function suggestControlPlanDetails(productChar: string, processChar: string, spec: string): Promise<Partial<ControlPlanItem>> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert in Quality Control Plans. 
Suggest control plan details for the following characteristic:
Product Characteristic: ${productChar}
Process Characteristic: ${processChar}
Specification: ${spec}

Return a JSON object with the following fields:
- eval_method: Measurement equipment or evaluation method.
- sample_size: Typical sample size (e.g., "5 pcs").
- sample_freq: Typical frequency (e.g., "1/shift").
- control_method: Control method (e.g., "X-bar R Chart").
- responsibility: Typical responsibility (e.g., "Operator").
- reaction_plan: Reaction plan if out of spec.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          eval_method: { type: Type.STRING },
          sample_size: { type: Type.STRING },
          sample_freq: { type: Type.STRING },
          control_method: { type: Type.STRING },
          responsibility: { type: Type.STRING },
          reaction_plan: { type: Type.STRING }
        },
        required: ["eval_method", "sample_size", "sample_freq", "control_method", "responsibility", "reaction_plan"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {};
  }
}

export async function suggestFunctions(step: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert in PFMEA. 
For the following Process Step, suggest 3-5 typical Functions or Requirements.
Process Step: ${step}

Return a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse functions", e);
    return [];
  }
}

export async function generateFullControlPlan(partName: string, processes: { processName: string, productChar: string, processChar: string, spec: string }[]): Promise<ControlPlanItem[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert in Quality Control Plans. 
Generate a comprehensive Control Plan for the following part and processes:
Part Name: ${partName}
Processes: ${JSON.stringify(processes)}

For each process, generate the ControlPlanItem.
CRITICAL: If the specification tolerance is less than 50 microns (0.05 mm), mark it as a 'SC' (Special Characteristic) in the balloon_no field. Otherwise, leave it empty.

Return a JSON array of ControlPlanItem objects. Each object should have:
- process_no: String
- process_name: String
- machine_name: String
- tool_fixture: String
- serial_no: Number
- balloon_no: String (Mark 'SC' if < 50 microns, else empty)
- product_char: String
- process_char: String
- spec: String
- tolerance_type: '+' | '-' | '±' | 'GD&T'
- tolerance_value: String
- upper_limit: String
- lower_limit: String
- eval_method: String
- sample_size: String
- sample_freq: String
- control_method: String
- responsibility: String
- reaction_plan: String`,
    config: {
      systemInstruction: "Keep the response concise. Return only the JSON array.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            process_no: { type: Type.STRING },
            process_name: { type: Type.STRING },
            machine_name: { type: Type.STRING },
            tool_fixture: { type: Type.STRING },
            serial_no: { type: Type.INTEGER },
            balloon_no: { type: Type.STRING },
            product_char: { type: Type.STRING },
            process_char: { type: Type.STRING },
            spec: { type: Type.STRING },
            tolerance_type: { type: Type.STRING, enum: ['+', '-', '±', 'GD&T'] },
            tolerance_value: { type: Type.STRING },
            upper_limit: { type: Type.STRING },
            lower_limit: { type: Type.STRING },
            eval_method: { type: Type.STRING },
            sample_size: { type: Type.STRING },
            sample_freq: { type: Type.STRING },
            control_method: { type: Type.STRING },
            responsibility: { type: Type.STRING },
            reaction_plan: { type: Type.STRING }
          },
          required: ["process_no", "process_name", "machine_name", "tool_fixture", "serial_no", "balloon_no", "product_char", "process_char", "spec", "tolerance_type", "tolerance_value", "upper_limit", "lower_limit", "eval_method", "sample_size", "sample_freq", "control_method", "responsibility", "reaction_plan"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse control plan", e);
    return [];
  }
}
