# Metro

[Русский](README.md) | **English**

Interactive metro maps on top of a city map: Saint Petersburg and Thessaloniki. Click two stations to see the route, travel time and transfers. The Timeline slider shows how the network grew and what it will look like under the development plans; routes are built on the selected network.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/) [![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-396CB2?logo=maplibre&logoColor=white)](https://maplibre.org/) [![OpenFreeMap](https://img.shields.io/badge/OpenFreeMap-7EBC6F?logo=openstreetmap&logoColor=white)](https://openfreemap.org/)


| [Saint Petersburg](https://gkalian.github.io/metro/) | [Thessaloniki](https://gkalian.github.io/metro/thessaloniki/) |
| --- | --- |
| ![](./public/og.jpg) | ![](./public/thessaloniki/og.jpg) |

Switch cities from the list under the panel heading. The interface is in Russian and English, and Thessaloniki also has Greek.

## Saint Petersburg

The network at the end of each decade since the 1950s, today, and in the future according to the 2040 development plan. The map also shows the railway stations from the metro's official map; they are not part of routes.

<details>
<summary><b>Stations and lines</b></summary>

- Stations, coordinates and status (open / under construction / planned) — the [metrostr.ru](https://www.metrostr.ru/map/) development map.
- Lines between stations are smoothed curves, not the real tunnel alignment.
- Teatralnaya is marked as under construction: trains pass it without stopping. Its opening year is taken as 2029, the date of its first entrance on the plan.
- Transfers to the future line 6 stations (Karetnaya, Zastavskaya, Ligovsky Prospekt-2, Znamenskaya) follow the line's project.

</details>

<details>
<summary><b>Plans to 2040</b></summary>

- Opening years, the red line branch to Pulkovo, the extensions to Kolomyazhskaya, Ruchyi and Prospekt Marshala Zhukova, and the northern part of the Circle line come from the development plan in the metro's 2025 report ([Fontanka, 18.08.2026](https://www.fontanka.ru/2026/08/18/76594703/)). These stations are placed from the plan; expect errors of a few hundred metres.
- Only the northern part of the Circle line is shown (Bolshoy Prospekt — Polyustrovsky Prospekt): the plan doesn't name its other stations.
- Pulkovskiye Vysoty and Expoforum have no date on the plan and appear only at the "all plans" step.
- The south-western section of line 6 (2037) follows the plan, although the city has reportedly abandoned this alignment.

</details>

<details>
<summary><b>Travel time</b></summary>

- Times between open stations — [spb.metrobook.ru](https://spb.metrobook.ru/), to the minute.
- Where no time is published (all of line 6 and planned sections), it is estimated from distance; the data marks these with `toNextEstimated` and the interface shows the total with "≈".
- Transfers are a rough guess: 3 minutes everywhere, 1 minute at Tekhnologichesky Institut.

</details>

<details>
<summary><b>Suburban rail</b></summary>

- Stations are those on the official [metro map (12.2025)](https://metro.spb.ru/uploads/metromap_12.2025.jpg): five clock-face routes (Finlyandsky station — Sestroretsk and — Melnichny Ruchey, Baltiysky station — Oranienbaum-1 and — Krasnoye Selo, Vitebsky station — Pavlovsk), Moskovsky and Ladozhsky stations, and platforms next to the metro (Udelnaya, Devyatkino, Obukhovo, Rybatskoye).
- Coordinates — [OpenStreetMap](https://www.openstreetmap.org/); Moskovsky station, which OSM has no point for, is placed by hand at the head of the platforms.
- Transfers to the metro follow the dotted lines of the map. Train travel time is not calculated.

</details>

## Thessaloniki

Line 1 (2024) and line 2 (2026), plus the future network from the 2040 plan. In the past the slider steps through opening years.

<details>
<summary><b>Lines</b></summary>

- Numbers and colours as on the metro maps and in the brand book ([Wikipedia](https://en.wikipedia.org/wiki/Thessaloniki_Metro)): **1, red** New Railway Station — Nea Elvetia (30.11.2024); **2, blue** New Railway Station — Mikra (27.08.2026).
- Up to 25 Martiou lines 1 and 2 share tracks: the map draws them side by side, a train of either line will do, and a trip from one branch to the other shows a change of train at 25 Martiou. The operator's site ([thessmetro.gr](https://www.thessmetro.gr/en/metro-stations/)) calls the whole network line 1.
- Coordinates of open stations and Greek names — [OpenStreetMap](https://www.openstreetmap.org/).

</details>

<details>
<summary><b>Plans to 2040</b></summary>

- [The 2040 development plan](https://www.thessmetro.gr/en/plan-for-2040/), station order from [ypodomes.com](https://ypodomes.com/metro-thessalonikis-i-anatomia-tis-neas-grammis-2-amp-oi-nees-epektaseis-tis-grammis-1-poy-tha-ginoyn-oi-26-neoi-stathmoi/): line 2 extended to the airport and ThessINTEC; **3, green** Ano Evosmos — Agia Kyriaki with a branch to Kordelio; **yellow** from Dimokratias to Papageorgiou hospital.
- In the plan the yellow line is an extension of line 1; the number 4 is made up. There is no service pattern, so routes count a transfer at Dimokratias.
- The plan gives no dates per section, so everything opens at the "2040" step. The Thermi spur is only a provision and appears only at the "all" step.
- Future stations are placed from the plan (errors of a few hundred metres) and adjusted to landmarks: Aristotelous Square, X.A.N.TH. (YMCA), Charilaou Square, KTEL bus station, Papageorgiou hospital, the Hellenic Army Academy, the airport, ThessINTEC.
- [Elliniko Metro's 2024 map](https://www.emetro.gr/wp-content/uploads/2024/08/%CE%9C%CE%B5%CF%84%CF%81%CF%8C-18-%CE%A3%CE%91%CE%93%CE%9C%CE%98-A3-Eng-%CE%95%CE%9C-%CE%95%CE%A3%CE%A0%CE%91-2021-2027-1.jpg) draws the north-west as a loop through Evosmos and Stavroupoli, but the loop has [reportedly](https://www.typosthes.gr/thessaloniki/438664_metro-thessalonikis-anoigei-o-dromos-gia-epektasi-sta-dytika-poies-einai-oi) been dropped.

</details>

<details>
<summary><b>Travel time</b></summary>

- Times between stations are not published and are estimated from distance: 40 seconds for the stop and acceleration plus the straight line between stations with a 15% margin. The speed is set so that New Railway Station — Nea Elvetia takes 17 minutes ([ypodomes.com](https://ypodomes.com/metro-thessalonikis-se-17-lepta-apo-ton-n-s-stathmo-sti-nea-elvetia-ola-osa-thelete-na-mathete-gia-stathmoys-eisitiria-kai-dromologia/)). This gives 22 minutes to Mikra; the press reports 24–26 ([tanea.gr](https://www.tanea.gr/2026/08/26/greece/metro-thessalonikis-apo-ayrio-stin-kalamaria-o-xristikos-odigos-gia-dromologia-xronous-kai-eisitiria/)). Totals are always marked "≈".
- Transfers to line 3 take 3 minutes at New Railway Station and Dimokratias, 2 minutes at Panepistimio. A change of train at a shared station needs no walk; waiting is not counted.

</details>

## Development

<details>
<summary><b>Adding new city</b></summary>

## Code

```
src/
  main.ts              entry: city from the page's data-city → load data → start
  core/                the engine, knows nothing about a particular city
    city.ts            the City type — a city description
    pages.ts           Vite plugin: an HTML page per city from one template
    start.ts           map, panel, route in the URL
    domain/            network, history, routing (no DOM)
    map/  ui/  geo/    MapLibre map, panel, geometry
    app/messages/      UI texts (ru.ts defines the keys)
  cities/
    index.ts           list of cities
    spb/  thessaloniki/
      city.ts          path, titles, colour, languages, map bounds
      data/            lines/*.json, transfers, history, exits, railway
scripts/               font glyphs, Thessaloniki data generator
```

There are no HTML files in the repository: `src/core/pages.ts` generates the pages. Each city has its own page for link previews, since Telegram and VK don't run JS. Each city's data is loaded separately. Lines can share tracks: a line file holds `{"ref": "id"}` instead of a station, and `since` gives the year its trains start running. Tests live in `__tests__` next to the code.

### Adding a city

1. Put the data in `src/cities/<id>/data/`; `data.ts` imports it and `city.ts` describes the city (see `thessaloniki`).
2. Add the city to `src/cities/index.ts` — its page and the link in the city list appear automatically.
3. Link preview image, 1200×630 — `public/<path>og.jpg`.
4. A new language needs the `Lang` type, a dictionary in `src/core/app/messages` and `data-<lang>` attributes in the template; a new alphabet also needs glyphs (see below).

<b>Font</b>

Montserrat everywhere: from Google Fonts in the interface, and on the map as SDF glyphs in `public/fonts` built with `scripts/glyphs.py` (needs `freetype-py`, `numpy`, `scipy`):

```
python scripts/glyphs.py Montserrat-Regular.ttf "Montserrat Regular" public/fonts
```

Montserrat has no Greek, so [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) provides it: second in the interface's `font-family`, and on the map the Greek range `768-1023.pbf` is built from it over Montserrat (`--ranges` rewrites only the given range, `--wght` sets the weight). Manrope has no italic, so the Italic set has upright Greek letters.

```
python scripts/glyphs.py "Manrope[wght].ttf" "Montserrat Regular" public/fonts --wght 400 --ranges 768-1023
python scripts/glyphs.py "Manrope[wght].ttf" "Montserrat SemiBold" public/fonts --wght 600 --ranges 768-1023
python scripts/glyphs.py "Manrope[wght].ttf" "Montserrat Italic" public/fonts --wght 400 --ranges 768-1023
```

Both fonts are under the OFL; the licence texts are in `public/fonts`.


Thessaloniki data is generated by `scripts/thessaloniki/gen_lines.py` — edit the script, not the JSON:

```
py -3 scripts/thessaloniki/gen_lines.py src/cities/thessaloniki/data
```

</details>