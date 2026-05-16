# Prompt Pipeline – Dokumentáció

> Ez a dokumentum az AIVIVI rendszer prompt-összeállítási logikáját írja le. (Sprint 4.1)

---

## A prompt stack felépítése

A rendszer minden modellhívásnál az alábbi sorrendben állítja össze a promptot:

```
┌─────────────────────────────────┐
│  1. System Prompt (user által)  │
│  2. Developer Prompt            │
│  3. User Prompt                 │
│  4. Context Injection           │
└─────────────────────────────────┘
```

### 1. System Prompt (user által megadott)
- **Forrás:** Settings → AI Rendszerüzenet
- **Injektálás:** minden modellhívás előtt, automatikusan
- **Tárolás:** localStorage / user session
- **Felülírás:** TILOS alapértelmezett értékkel felülírni

### 2. Developer Prompt
- **Forrás:** backend konfiguráció
- **Tartalom:** általános viselkedési szabályok, biztonsági keretek
- **Frissítés:** csak fejlesztői deploy során

### 3. User Prompt
- **Forrás:** chat input mező
- **Tartalom:** a felhasználó aktuális üzenete

### 4. Context Injection
- **Forrás:** aktív skill-ek, előző üzenetek szükség szerint
- **Tartalom:** skill-specifikus kontextus, releváns előzmények

---

## Skills integráció a pipeline-ban

Ha aktív skill van betöltve, a context injection fázisban kerül be:

```
System Prompt
    ↓
Developer Prompt
    ↓
[Skill context block – ha aktív skill van]
    ↓
User Prompt
    ↓
Context Injection (maradék)
```

**Skill forrás:** [github.com/anthropics/skills](https://github.com/anthropics/skills)

---

## Chatváltáskor törlendő state

| State elem | Törlés módja |
|------------|-------------|
| Preview state | `clearPreviewState()` |
| Ideiglenes prompt módosítás | `resetPromptDraft()` |
| Generálási előnézet | `closePreviewPanel()` |

---

## Kapcsolódó feladatok

- Sprint 2.1 – System Prompt működésének javítása
- Sprint 2.2 – Prompt pipeline refaktor
- Sprint 3.1 – Skills engine integráció
