# AIVIVI – Fejlesztési Roadmap

> **Utolsó frissítés:** 2026-05-16  
> **Repo:** [palkonecsny01-del/aivivi](https://github.com/palkonecsny01-del/aivivi)

---

## Státusz áttekintés

| Sprint | Cél | Státusz |
|--------|-----|---------|
| Sprint 0 | Alap stabilizáció – kritikus hibák javítása | 🟥 Folyamatban |
| Sprint 1 | UX és session-kezelés | 🟧 Részben folyamatban |
| Sprint 2 | System Prompt rendszer újraírása | 🟥 Todo |
| Sprint 3 | Anthropic Skills integráció | 🟧 Részben folyamatban |
| Sprint 4 | Kódminőség és architektúra | 🟧 Részben kész |
| Sprint 5 | Extra fejlesztések (opcionális) | 🟦 Backlog |

---

## 🔴 Sprint 0 – Alap stabilizáció (kritikus hibák javítása)

**Cél:** A jelenlegi hibák megszüntetése, hogy a rendszer megbízhatóan működjön.

### 0.1 – PDF export javítása `Bug` `High`

**Probléma:** A PDF export jelenleg a teljes chatet tölti le.

**Elvárások:**
- Csak a generált AI-válasz kerüljön bele
- Formázott, tipográfiailag tiszta kimenet
- Ne tartalmazzon metaadatot, promptot, előzményeket

**Elfogadási kritérium:** PDF csak a végső választ tartalmazza, formázva.

---

### 0.2 – Modellválasztó UI fix `Bug` `High`

**Probléma:** A modellválasztó lenyíló eltűnik → újrarenderelési bug.

**Elvárások:**
- Mindig teljesen látható
- Fix pozícióban marad
- Scrollozható

**Elfogadási kritérium:** Modellválasztó mindig látható, nem csúszik el.

---

### 0.3 – Tiltott modellek kiszűrése `Task` `High`

**Probléma:** Nem kívánt modellek jelennek meg a UI-ban és backendben.

**Eltávolítandó modellek:**
```
gemini-3.1-pro-preview
gemini-3-pro-image-preview
```

**Elvárások:**
- Teljes eltávolítás a UI-ból
- Teljes eltávolítás a backendből

**Elfogadási kritérium:** Modellek nem jelennek meg UI-ban és backendben sem.

---

## 🟠 Sprint 1 – UX és session-kezelés

### 1.1 – Preview panel automatikus bezárása `UX` `Medium` *(In Progress)*

**Probléma:** Chatváltáskor a korábbi preview panel nyitva marad.

**Elvárások:**
- Chatváltáskor automatikus bezárás
- Ne maradjon ott a korábbi prompt fejlesztése vagy válasz

**Elfogadási kritérium:** Chatváltás → preview eltűnik.

---

### 1.2 – Session state tisztítása `UX` `Medium`

**Probléma:** Chatváltáskor megmarad az ideiglenes state.

**Törölni kell chatváltáskor:**
- Preview state
- Ideiglenes prompt-módosítás
- Generálási előnézet

**Elfogadási kritérium:** Nincs leftover preview vagy prompt state.

---

## 🔴 Sprint 2 – System Prompt rendszer újraírása

### 2.1 – Settings → AI Rendszerüzenet működésének javítása `Core` `High`

**Probléma:** A felhasználó által megadott system prompt nem érvényesül globálisan.

**Elvárások:**
- Minden modellhívásnál automatikusan injektálódjon
- Minden új beszélgetésnél töltődjön be
- Ne legyen felülírva alapértelmezett értékkel

**Elfogadási kritérium:** Minden modellhívás tartalmazza a user system promptját.

---

### 2.2 – Prompt pipeline refaktor `Refactor` `High`

**Cél:** Egységes, determinisztikus prompt-összeállítás.

**Prompt stack sorrendje:**
1. System prompt *(user által megadott)*
2. Developer prompt
3. User prompt
4. Context injection

**Elfogadási kritérium:** Prompt stack determinisztikus és dokumentált.

---

## 🟠 Sprint 3 – Anthropic Skills integráció

> **Referencia repo:** [github.com/anthropics/skills](https://github.com/anthropics/skills)

### 3.1 – Skills modul beépítése `Feature` `High` *(In Progress)*

**Feladatok:**
- Skills engine integrálása a backendbe
- Skill-betöltés a rendszerprompt pipeline-ba
- Skill-alapú válaszgenerálás támogatása

**Elfogadási kritérium:** Skills modul működik, válaszokban érvényesül.

---

### 3.2 – Skill konfiguráció UI `Feature` `Medium`

**Settings menüben:**
- Skill-lista megjelenítése
- Engedélyezés / tiltás toggle
- Prioritások kezelése

**Elfogadási kritérium:** UI-ból állítható skill lista.

---

## 🟢 Sprint 4 – Kódminőség és architektúra

### 4.1 – Prompt pipeline dokumentáció `Docs` `Low` ✅ *Kész*

**Feladatok:**
- Minden prompt-réteg dokumentálása
- Skill-integráció dokumentálása

**Kimenet:** `README` + `docs/prompt-pipeline.md`

---

### 4.2 – Tesztelés `Test` `Medium`

**Unit tesztek:**
- PDF export
- Modellválasztó
- System prompt injection

**E2E tesztek:**
- Chatváltás
- Preview panel viselkedés

**Elfogadási kritérium:** Tesztek futnak CI-ben; Playwright/Cypress tesztek zöldek.

---

## 🔵 Sprint 5 – Extra fejlesztések (opcionális)

### 5.1 – Export modul bővítése `Feature` `Low` *Backlog*

- Markdown export
- HTML export
- Chat-szintű export

**Elfogadási kritérium:** Új export formátumok működnek.

---

### 5.2 – Prompt fejlesztő mód továbbfejlesztése `Feature` `Low` *Backlog*

- Prompt verziózás
- Prompt history
- Prompt diff nézet

**Elfogadási kritérium:** Prompt history UI működik.

---

## Feladatlista összesítő

| ID | Cím | Típus | Prioritás | Sprint | Státusz |
|----|-----|-------|-----------|--------|---------|
| 0.1 | PDF export javítása | Bug | High | Sprint 0 | 🟥 Todo |
| 0.2 | Modellválasztó UI hiba javítása | Bug | High | Sprint 0 | 🟥 Todo |
| 0.3 | Tiltott modellek kiszűrése | Task | High | Sprint 0 | 🟥 Todo |
| 1.1 | Preview panel automatikus bezárása | UX | Medium | Sprint 1 | 🟧 In Progress |
| 1.2 | Session state tisztítása | UX | Medium | Sprint 1 | 🟥 Todo |
| 2.1 | System Prompt működésének javítása | Core | High | Sprint 2 | 🟥 Todo |
| 2.2 | Prompt pipeline refaktor | Refactor | High | Sprint 2 | 🟥 Todo |
| 3.1 | Anthropic Skills integráció | Feature | High | Sprint 3 | 🟧 In Progress |
| 3.2 | Skills UI konfiguráció | Feature | Medium | Sprint 3 | 🟥 Todo |
| 4.1 | Prompt pipeline dokumentáció | Docs | Low | Sprint 4 | 🟩 Done |
| 4.2 | Unit tesztek | Test | Medium | Sprint 4 | 🟥 Todo |
| 4.3 | E2E tesztek | Test | Medium | Sprint 4 | 🟥 Todo |
| 5.1 | Export modul bővítése | Feature | Low | Sprint 5 | 🟦 Backlog |
| 5.2 | Prompt fejlesztő mód | Feature | Low | Sprint 5 | 🟦 Backlog |

---

*Ez a dokumentum a `docs/issues.csv` GitHub Projects importfájllal együtt kezelendő.*
