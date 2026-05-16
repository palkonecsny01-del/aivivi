# AI Vivien — Agent Skills

Ez a mappa tartalmazza az AI Vivien **agent skill**-jeit.  
A skilleket az Anthropic API `tools` paramétereként regisztrálod, és az agent automatikusan meghívja őket, amikor szükséges.

---

## Hogyan működik?

```
Felhasználó kér valamit
        │
        ▼
  Agent (claude-opus-4-5)
  ┌─────────────────────────────────────────────┐
  │  tools: [swotAnalysisTool, cashflowTool, …] │
  └──────────────────────┬──────────────────────┘
                         │  "tool_use" blokk
                         ▼
              runSwotSkill(input)
                         │  SwotResult JSON
                         ▼
           Visszaküldve a modellnek → végső válasz
```

1. **Regisztrálod** a tool definícióját (`*Tool` export) az API hívásban.
2. A modell eldönti, mikor hívja meg.
3. A `run*Skill(input)` függvény végrehajtja a logikát és visszaadja az eredményt.
4. Az eredményt `tool_result` szerepű üzenetként visszaküldöd a modellnek.

---

## Elérhető skillyek

| Fájl | Tool neve | Leírás |
|------|-----------|--------|
| `swot-analysis.ts` | `swot_analysis` | SWOT mátrix + stratégiai javaslatok |
| *(hamarosan)* | `cashflow_model` | Cash-flow előrejelzés |
| *(hamarosan)* | `funnel_planner` | Értékesítési tölcsér tervezés |
| *(hamarosan)* | `competitor_profile` | Versenytárs profil generátor |

---

## Új skill hozzáadása (lépések)

### 1. Hozd létre a fájlt

```
src/lib/skills/uj-skill.ts
```

### 2. Exportáld a tool definíciót és a runner függvényt

```typescript
import Anthropic from "@anthropic-ai/sdk";

export const ujSkillTool: Anthropic.Tool = {
  name: "uj_skill",
  description: "Mit csinál ez a skill...",
  input_schema: {
    type: "object",
    properties: {
      param1: { type: "string", description: "..." },
    },
    required: ["param1"],
  },
};

export async function runUjSkill(input: { param1: string }) {
  // logika itt
  return { result: "..." };
}
```

### 3. Regisztrálj az API hívásban

```typescript
// src/lib/agent.ts  (vagy ahol az Anthropic API-t hívod)
import { swotAnalysisTool, runSwotSkill } from "./skills/swot-analysis";
import { ujSkillTool, runUjSkill } from "./skills/uj-skill";

const TOOLS = [swotAnalysisTool, ujSkillTool];

const response = await client.messages.create({
  model: "claude-opus-4-5",
  tools: TOOLS,
  messages,
});
```

### 4. Kezeld a tool_use blokkokat

```typescript
for (const block of response.content) {
  if (block.type !== "tool_use") continue;

  let toolResult: unknown;

  switch (block.name) {
    case "swot_analysis":
      toolResult = await runSwotSkill(block.input as SwotInput);
      break;
    case "uj_skill":
      toolResult = await runUjSkill(block.input as { param1: string });
      break;
  }

  // Visszaküldjük a modellnek
  messages.push({
    role: "user",
    content: [{
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(toolResult),
    }],
  });
}
```

---

## Referenciák

- [Anthropic Tool Use docs](https://docs.anthropic.com/en/docs/tool-use)
- [anthropics/skills GitHub](https://github.com/anthropics/skills)
