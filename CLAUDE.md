# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Ima li lijeka?" – clickable hi-fi prototype (desktop-first responsive web app) for a Human–Computer Interaction (Interakcija čovjek-računar) course project: find a medicine in Sarajevo pharmacies and reserve it. Two roles: **Pacijent** and **Farmaceut**. All UI text is Bosnian (ijekavica); identifiers and comments are also Bosnian – keep it that way.

Everything is hardcoded: no backend, API calls or real auth. All data lives in `src/data/mockData.ts`. App state lives in React context; a page reload resets it (only accessibility settings persist in `localStorage`). "Now" is fixed to `SADA` = Saturday 31. 10. 2026. 22:30 – all opening-hours/"open now"/deadline logic uses `SADA`, never `new Date()`.

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build – must pass with zero errors
npm run preview
```

No test runner or linter. Toolchain versions are new (TypeScript 7, Vite 8, React Router 8 imported from `react-router`, lucide-react 1.x, Tailwind v4 via `@tailwindcss/vite`) – verify APIs against `node_modules` rather than memory.

## Architecture

- `src/App.tsx` – providers, routes, `<ToastViewport/>`. `/pacijent/*` and `/farmaceut/*` are nested under `Okvir` (layout); `/farmaceut/*` is guarded and redirects to `/farmaceut/prijava` when not logged in.
- `src/components/Okvir.tsx` – app shell: fixed sidebar (`BocnaNavigacija`, overlay drawer below `lg`), sticky header (compact search, time, shortcuts, theme toggle, notifications popover, user menu), skip link, global keyboard shortcuts (`/` focuses `[data-pretraga]`, `?` opens shortcuts). Also renders the global `RezervacijaDijalog` for the patient.
- `src/context/AppContext.tsx` – single source of truth: stock matrix (`zalihe[apotekaId][lijekId]`), reservations, notifications (`obavijesti` per role), settings, pharmacist login, `rezervacijaZa` (which apoteka/lijek the reservation dialog is open for), `pustiZvuk`. `promijeniStatusRezervacije(id, status, { razlog?, tiho? })` – `tiho` skips the patient notification (used by undo).
- `src/context/ToastContext.tsx` – `useToast()(poruka, { tip, akcija })`; sounds from `public/zvukovi/`, undo action ("Poništi"). `src/lib/akcije.ts` – `useAkcijeRezervacije()` = pharmacist status change + undo toast.
- `src/data/mockData.ts` – 8 pharmacies (SVG map coords), 15 medicines (generic substitutes), stock matrix as compact string table, initial reservations/notifications, dashboard data (`rezervacijePoSatu`, `pretrageDanas`).
- `src/lib/format.ts` – opening hours, deadlines, Bosnian plurals (`mnozina`), status labels, diacritic-insensitive search. `src/lib/hooks.ts` – `useSimuliranoUcitavanje` (fake loading for skeletons).
- `src/components/ui.tsx` – shared primitives: Dugme, IkonaDugme (aria-label + CSS tooltip via `data-tooltip`), ZaglavljeStranice (h1 + breadcrumbs + actions), EtiketaLijeka, status badges, FilterCip, Segmenti, Prekidac, Paginacija, SkeletonRedovi, PraznoStanje, Modal (portal, focus trap, Esc, `[data-autofokus]`), PotvrdniDijalog.
- Other components: `PretragaLijeka` (ARIA combobox), `RedApoteke` (list row, uses container queries `@xl:` to stack in narrow spaces), `SvgMapa`, `RezervacijaDijalog`, `GrafikonPoSatu` (SVG bar chart + table view).
- `src/pages/pacijent/*`, `src/pages/farmaceut/*` (Prijava, Pregled, DolazneRezervacije, StanjeLijekova), shared `src/pages/Podesavanja.tsx`.

### Theming / accessibility

Colors are CSS variables in `src/index.css`, exposed to Tailwind via `@theme inline` (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `bg-primary`, `text-ok`, `bg-warn-soft`, …). Dark mode and high contrast are `.dark` / `.hc` classes on `<html>` that override the variables. `--chart` is the bar-chart color, validated (dataviz skill) for both light and dark surfaces. Font size is set via `html { font-size }`, so **use semantic color tokens and rem units only** – never hardcoded colors or px font sizes.

## UX requirements (graded – don't regress)

- Max 3 clicks from home to a confirmed reservation (chip → "Rezerviši" in a result row → "Potvrdi rezervaciju" in the dialog); the Rx checkbox is pre-checked for this reason.
- Touch targets ≥ 44px (`min-h-11`/`size-11`), WCAG AA contrast, visible keyboard focus (`:focus-visible` outline).
- Status never conveyed by color alone: always color + icon + text (badges, map pins).
- Every list has loading skeleton, empty state and "no results" state with a next step.
- Toasts for actions; confirmation dialog for cancelling a reservation.
- Visual style: dark-green sidebar, cool green-grey surfaces, Atkinson Hyperlegible Next (body) + condensed Archivo (headings, medicine "box label" names); the glowing green cross marks dežurne apoteke. No purple gradients / generic AI look, no middle-dot meta strings, no all-caps labels.
- Pharmacist actions are one click + "Poništi" undo in the toast, not confirm dialogs.
- Map is the custom SVG – do not add Google Maps or Leaflet.
