/**
 * skill: swot-analysis
 * ──────────────────────────────────────────────────────────────────────────
 * AI Vivien Agent Skill — SWOT Analysis Generator
 *
 * HOW IT WORKS
 * ─────────────
 * This skill is called by the agent orchestrator when the user asks for a
 * SWOT matrix, competitor profile, or market analysis.
 *
 * HOW TO REGISTER
 * ───────────────
 * Import `swotAnalysisTool` and add it to the `tools` array in your
 * Anthropic API call (see src/lib/agent.ts or wherever you call the API).
 *
 * Example:
 *   import { swotAnalysisTool, runSwotSkill } from "./skills/swot-analysis";
 *
 *   const response = await anthropic.messages.create({
 *     model: "claude-opus-4-5",
 *     tools: [swotAnalysisTool],   // ← register here
 *     messages: [...],
 *   });
 *
 *   // Handle tool_use blocks in the response:
 *   for (const block of response.content) {
 *     if (block.type === "tool_use" && block.name === "swot_analysis") {
 *       const result = await runSwotSkill(block.input as SwotInput);
 *       // Push result back into the conversation as tool_result
 *     }
 *   }
 */

import Anthropic from "@anthropic-ai/sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SwotInput {
  /** Company or product name to analyse */
  company_name: string;
  /** Industry or sector (e.g. "SaaS", "e-commerce", "étterem") */
  industry: string;
  /** Optional: known competitors, comma-separated */
  competitors?: string;
  /** Response language, defaults to "hu" (Hungarian) */
  language?: "hu" | "en";
}

export interface SwotResult {
  company_name: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategic_summary: string;
  recommended_actions: string[];
}

// ─── Tool definition (passed to Anthropic API) ───────────────────────────────

export const swotAnalysisTool: Anthropic.Tool = {
  name: "swot_analysis",
  description:
    "Generates a structured SWOT matrix (Strengths, Weaknesses, Opportunities, Threats) " +
    "for a given company or product along with strategic recommendations. " +
    "Use this when the user asks for market analysis, competitor analysis, or strategic planning.",
  input_schema: {
    type: "object" as const,
    properties: {
      company_name: {
        type: "string",
        description: "Name of the company or product to analyse.",
      },
      industry: {
        type: "string",
        description: 'Industry or sector, e.g. "SaaS", "e-commerce", "vendéglátás".',
      },
      competitors: {
        type: "string",
        description: "Optional comma-separated list of known competitors.",
      },
      language: {
        type: "string",
        enum: ["hu", "en"],
        description: 'Response language. Default "hu" (Hungarian).',
      },
    },
    required: ["company_name", "industry"],
  },
};

// ─── Skill runner ─────────────────────────────────────────────────────────────

/**
 * Execute the SWOT analysis skill.
 * Called by the agent loop when the model decides to use this tool.
 */
export async function runSwotSkill(input: SwotInput): Promise<SwotResult> {
  const client = new Anthropic();

  const lang = input.language ?? "hu";
  const langInstruction =
    lang === "hu"
      ? "Válaszolj kizárólag magyarul. Legyen szakmai, tömör és üzleti szempontból releváns."
      : "Respond in English only. Be professional, concise, and business-relevant.";

  const prompt = `
${langInstruction}

Készíts részletes SWOT elemzést a következő cégről / termékről:

Vállalat/termék neve: ${input.company_name}
Iparág / szegmens: ${input.industry}
${input.competitors ? `Ismert versenytársak: ${input.competitors}` : ""}

Válaszolj KIZÁRÓLAG az alábbi JSON formátumban, semmi más szöveg nélkül:

{
  "company_name": "<string>",
  "strengths": ["<erősség 1>", "<erősség 2>", "<erősség 3>", "<erősség 4>"],
  "weaknesses": ["<gyengeség 1>", "<gyengeség 2>", "<gyengeség 3>"],
  "opportunities": ["<lehetőség 1>", "<lehetőség 2>", "<lehetőség 3>"],
  "threats": ["<fenyegetés 1>", "<fenyegetés 2>", "<fenyegetés 3>"],
  "strategic_summary": "<2-3 mondatos stratégiai összefoglaló>",
  "recommended_actions": ["<javasolt lépés 1>", "<javasolt lépés 2>", "<javasolt lépés 3>"]
}
`.trim();

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("");

  // Strip possible markdown code fences
  const clean = text.replace(/```json|```/g, "").trim();

  return JSON.parse(clean) as SwotResult;
}
