# eredmeny-dashboard

Szervezeti (HR) eredmény-dashboard a Storyline 360 tesztekhez. Verzió: **v1.0 (dashboard) / v1.1 (belépő oldal)**, 2026-11-24.

## Működés

1. **Storyline** – a hallgató megadja a nevét, rendfokozatát és szervezetét (1.1 dia), a továbblépés gombra egy JavaScript trigger elküldi az n8n `eredmeny-rogzites` webhookjának. A teszteredmény dián a százalékos eredményt ugyanide küldi.
2. **n8n** – a szervezetet a beírt szövegből illeszti (Data Table: `eredmeny_szervezetek`), az eredményt az `eredmeny_eredmenyek` táblában rögzíti.
3. **Belépés (`index.html`)** – gránátos belépő oldal; a szervezet nevét és jelszavát az n8n `eredmeny-api` webhook ellenőrzi szerver oldalon, majd munkamenet-tokent ad.
4. **Dashboard (`dashboard.html`)** – glassmorphism felület, csak a belépett szervezet eredményeit mutatja; XLSX és PDF export.

## Fájlok

| Fájl | Szerep |
| --- | --- |
| `index.html` | Gránátos belépő oldal (signin-grenade v1.1) |
| `dashboard.html` | Eredmény-dashboard v1.0 |
| `dashboard-lib.js` | Logika (statisztika, szűrés, export adatok), tesztelhető |
| `vendor/` | SheetJS 0.18.5 (XLSX), pdfmake 0.2.20 + Roboto (PDF) |
| `versions/` | Verziózott pillanatképek |

## Konfiguráció

Az n8n webhook-címek a fájlokban vannak: `dashboard.html` → `CONFIG.API_URL`, `index.html` → `De.API_URL`. Jelszavak nincsenek a tárolóban: az n8n Data Table-ben SHA-256 lenyomatként tárolódnak (`sha256(orgId:jelszó)`).

Új szervezet felvétele: sor az `eredmeny_szervezetek` táblába (`orgId`, `name`, `keywords` JSON-tömb, `pwhash`, `active`).

## Master szervezet (v1.1, 2026-11-24)
A `Master` belépéssel (szervezet: `Master`) minden szervezet eredménye látszik, külön „Szervezet" oszloppal a táblában, az XLSX-ben és a PDF-ben, az ismeretlen szervezetűek „Ismeretlen" címkével. A master sor az `eredmeny_szervezetek` táblában van (`orgId: master`), a rögzítés nem illeszt rá szervezetet.

## Soronkénti törlés (v1.2, 2026-11-24)
Minden sor végén „Törlés" gomb (megerősítéssel). Végpont: `POST /webhook/eredmeny-torles` `{action:"delete", token, rid}`. A szervezet csak a saját sorait törölheti, a Master bármelyiket; a törlés végleges (az n8n `eredmeny_eredmenyek` táblából).
