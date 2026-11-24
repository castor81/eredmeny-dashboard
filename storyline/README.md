# Storyline beállítás (v1.0, 2026-11-24)

Projektváltozók (Triggers panel → Manage Project Variables), mind szöveg típusú:

| Változó | Szerep |
| --- | --- |
| `Name` | a hallgató beírt szövege (név, rendfokozat, szervezet) – az 1.1 dia szövegbevitele tölti |
| `rekordId` | a rekord azonosítója, a JavaScript tölti; alapértéke üres |
| `szazalek` | tartalék számváltozó, csak ha az eredmény dia változója más néven érhető el |

## 1.1 dia, „Tovább" gomb
Trigger: **Execute JavaScript** → `eredmeny-start_v1.0_2026-11-24.js`, a „Jump to slide" trigger mellett, when user clicks.

## Teszteredmény dia
Trigger: **Execute JavaScript** → `eredmeny-result_v1.2_2026-11-24.js`, When timeline starts on this slide.
Az eredmény dia változója `<dia neve>.ScorePercent` (alapból `Quiz1.ScorePercent`); ha a dia neve más, a kód `PCT_VARS` tömbjének első elemét át kell írni.
