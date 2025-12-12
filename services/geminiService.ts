import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, RiskLevel } from "../types";

const VIBE_DEBUGGER_PROMPT = `
You are the "Vibe Debugger". You are NOT a linter. You are a world-class Senior Principal Engineer analyzing code written in a "vibe coding" style (fast, intuitive, potentially fragile).

Your goal is to find "Time Bombs" — things that work now but will break later.

For every issue, you must identify:
1. The Problem.
2. The Line Number (approximate start).
3. A "Timeline" of failure:
   - Now: Why it works currently.
   - Soon: When it starts hurting (refactor pain).
   - Later: What are the concrete BUSINESS consequences? (e.g., "Data breach", "$50k billing spike", "User churn"). DO NOT just say "it breaks".
4. "Why you see it": Explain the pattern, not just the syntax.
5. Two explanations: One for a Junior (simple analogy) and one for a Senior (technical depth).
6. A "Fix Checklist": 3-4 specific, actionable steps to resolve this.
7. "Suggested Fix Code": The actual code snippet to replace the problematic line(s).

Also provide:
- A "Top Risk": The single most dangerous thing in this code.
- "Cost of Ignoring": What happens to the business/team if they don't fix this (time lost, bugs, frustration).
- "Recommended Action": One single task to do first.

Tone: Mentor-like, specific, slightly witty but professional.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    topRisk: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ["title", "description"],
    },
    summary: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          problem: { type: Type.STRING },
          lineStart: { type: Type.INTEGER, description: "The line number where this issue starts" },
          vibeSmell: { type: Type.STRING, description: "Technical explanation for Seniors" },
          simplifiedExplanation: { type: Type.STRING, description: "Simple explanation for Juniors" },
          whyDetection: { type: Type.STRING, description: "Why the AI flagged this (pattern recognition)" },
          timeline: {
            type: Type.OBJECT,
            properties: {
              now: { type: Type.STRING, description: "Current state (It works...)" },
              soon: { type: Type.STRING, description: "Minor friction point" },
              later: { type: Type.STRING, description: "Concrete business consequence (Breach, Bill shock, etc.)" }
            },
            required: ["now", "soon", "later"]
          },
          risk: { type: Type.STRING, enum: [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH] },
          minimalFix: { type: Type.STRING, description: "One line summary of the fix" },
          suggestedFixCode: { type: Type.STRING, description: "The actual code snippet to apply" },
          fixChecklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 short actionable steps" }
        },
        required: ["id", "problem", "lineStart", "vibeSmell", "simplifiedExplanation", "whyDetection", "timeline", "risk", "minimalFix"],
      },
    },
    costOfIgnoring: { type: Type.STRING },
    recommendedAction: { type: Type.STRING },
  },
  required: ["topRisk", "summary", "items", "costOfIgnoring", "recommendedAction"],
};

export const analyzeCode = async (code: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("Missing API Key");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const start = performance.now();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze this code with line numbers in mind:\n\n${code}` }]
        }
      ],
      config: {
        systemInstruction: VIBE_DEBUGGER_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    });
    const end = performance.now();
    console.log(`Analysis took ${Math.round(end - start)}ms`);

    let text = response.text;
    if (!text) {
        throw new Error("No response from AI");
    }
    
    // Clean potential markdown code blocks (Gemini sometimes adds them even with JSON mimeType)
    text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    
    // Add unique IDs if missing (fallback)
    const result = JSON.parse(text) as AnalysisResult;
    
    // Ensure items is an array
    if (!Array.isArray(result.items)) {
        result.items = [];
    }

    result.items = result.items.map((item, idx) => ({
        ...item,
        id: item.id || `issue-${idx}`
    }));

    return result;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};