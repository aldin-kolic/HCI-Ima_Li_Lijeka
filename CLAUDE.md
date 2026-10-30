# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Ima li lijeka?" – clickable hi-fi prototype (mobile web app) for a Human–Computer Interaction (Interakcija čovjek-računar) course project: find a medicine in Sarajevo pharmacies and reserve it. Two roles: **Pacijent** and **Farmaceut**. All UI text is Bosnian (ijekavica); identifiers and comments are also Bosnian – keep it that way.

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

- `src/App.tsx` – providers, phone frame (390×844 on desktop, fullscreen on mobile), role switch above the frame, all routes, both layouts with bottom navigation. `#modal-root` and `<ToastViewport/>` live inside the frame so dialogs/toasts stay inside the phone.
- `src/context/AppContext.tsx` – single source of truth: stock matrix (`zalihe[apotekaId][lijekId]`), reservations, settings, pharmacist login, `pustiZvuk`. Pharmacist status changes on a reservation are immediately visible in the patient's "Moje rezervacije" because both read the same array.
- `src/context/ToastContext.tsx` – `useToast()(poruka, { tip, akcija })`; toasts play sounds from `public/zvukovi/` (when enabled) and support an undo action ("Poništi").
- `src/data/mockData.ts` – 8 pharmacies (with SVG map coordinates), 15 medicines (with generic substitutes), stock matrix as a compact string table (`N`/`M`/`-` per pharmacy column), initial reservations.
- `src/lib/format.ts` – opening hours, deadlines, Bosnian plurals (`mnozina`), status labels, diacritic-insensitive search (`normalizuj`, `pretraziLijekove`). `src/lib/hooks.ts` – `useSimuliranoUcitavanje` (400–600 ms fake loading for skeletons).
- `src/components/ui.tsx` – shared primitives (Dugme, Zaglavlje, status badges, FilterCip, Segmenti, Prekidac, skeleton, PraznoStanje, PotvrdniDijalog). `SvgMapa.tsx` – stylized Sarajevo SVG map with accessible pins.
- `src/pages/pacijent/*`, `src/pages/farmaceut/*`, shared `src/pages/Podesavanja.tsx`.

### Theming / accessibility

Colors are CSS variables in `src/index.css`, exposed to Tailwind via `@theme inline` (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `bg-primary`, `text-ok`, `bg-warn-soft`, …). Dark mode and high contrast are `.dark` / `.hc` classes on `<html>` that override the variables. Font size is set via `html { font-size }`, so **use semantic color tokens and rem units only** – never hardcoded colors or px font sizes.

## UX requirements (graded – don't regress)

- Max 3 taps from home to a confirmed reservation (chip → "Rezerviši" on result card → "Potvrdi rezervaciju"); the Rx checkbox is pre-checked for this reason.
- Touch targets ≥ 44px (`min-h-11`/`size-11`), WCAG AA contrast, visible keyboard focus (`:focus-visible` outline).
- Status never conveyed by color alone: always color + icon + text (badges, map pins).
- Every list has loading skeleton, empty state and "no results" state with a next step.
- Toasts for actions; confirmation dialog for cancelling a reservation.
- Visual style: calm dark green + warm neutral, single font (Figtree); no purple gradients / generic AI look.
- Map is the custom SVG – do not add Google Maps or Leaflet.
