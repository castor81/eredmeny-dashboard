# Storyline beállítás (v1.0, 2026-11-24)

Projektváltozók (Triggers panel → Manage Project Variables), mind szöveg típusú:

| Változó | Szerep |
| --- | --- |
| `Name` | a hallgató beírt szövege (név, rendfokozat, szervezet) – az 1.1 dia szövegbevitele tölti |
| `rekordId` | a rekord azonosítója, a JavaScript tölti; alapértéke üres |
| `szazalek` | tartalék számváltozó, csak ha az eredmény dia változója más néven érhető el |

## 1.1 dia, „Tovább" gomb
Trigger: **Execute JavaScript** → `eredmeny-start_v1.2_2026-11-27.js`, a „Jump to slide" trigger mellett, when user clicks.

## Teszteredmény dia
Trigger: **Execute JavaScript** → `eredmeny-result_v1.2_2026-11-24.js`, When timeline starts on this slide.
Az eredmény dia változója `<dia neve>.ScorePercent` (alapból `Quiz1.ScorePercent`); ha a dia neve más, a kód `PCT_VARS` tömbjének első elemét át kell írni.

## Sorrend a kurzusban (v1.1, 2026-11-24)
A név megadása a teszt UTÁN van (Tesztkérdések → eredmény dia → „Oklevél - név/szervezet" → Oklevél). Ezért a nevet és a százalékot együtt az `eredmeny-start_v1.2` küldi el a név-dia „Tovább" gombjáról (előbb `start`, utána `result`). A százalékot a `szazalek`, majd a `Quiz2.ScorePercent` változóból olvassa. Az eredménydia triggere (`eredmeny-result`) ebben a sorrendben már nem szükséges.

## v1.2 (2026-11-27)
A százalékot a script több forrásból olvassa (`szazalek`, `Quiz2.ScorePercent`, `Quiz1.ScorePercent`, végül a `ScorePoints`/`PassPoints`/`PassPercent` változókból számolja). A kérés `dbg` mezője az n8n végrehajtási naplóban megmutatja, mit látott a script – hibakereséshez.
