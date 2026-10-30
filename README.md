# Ima li lijeka?

Klikabilni hi-fi prototip mobilne web aplikacije za pronalazak i rezervaciju lijekova u apotekama u Sarajevu. Napravljen je za seminarski rad iz predmeta **Interakcija čovjek-računar**.

Prototip nema backend: svi podaci su izmišljeni i nalaze se u `src/data/mockData.ts`. Rezervacije i promjene zaliha postoje dok klikate, a reload stranice ih vraća na početno stanje. Pamte se samo podešavanja pristupačnosti. Vrijeme je fiksirano na **subotu, 31. 10. 2026. u 22:30**, da filter „Otvoreno sada" i dežurne apoteke imaju smisla.

## Pokretanje

Potreban je Node.js 20 ili noviji.

```bash
npm install
npm run dev
```

Zatim otvorite adresu koju ispiše Vite (obično http://localhost:5173).

- **Desktop:** aplikacija je prikazana u okviru telefona (390 × 844). Iznad okvira je prekidač **Pacijent / Farmaceut**.
- **Mobitel ili uski prozor:** aplikacija zauzima cijeli ekran, a prekidač uloga je u **Podešavanjima**.

Ostale komande:

```bash
npm run build     # provjera tipova + produkcijski build u dist/
npm run preview   # pregled produkcijskog builda
```

## Ekrani

### Pacijent

| # | Ekran | Putanja | Opis |
|---|-------|---------|------|
| 1 | Početna | `/pacijent` | Pretraga lijeka s automatskim prijedlozima, dugme „Skeniraj kutiju" (nakon 1,5 s prepozna Brufen 400), često traženi lijekovi, brzi pristup dežurnim apotekama i rezervacijama. |
| 2 | Rezultati pretrage | `/pacijent/pretraga?lijek=…` | Prekidač Lista / Mapa, filteri „Otvoreno sada" i „Samo na stanju", sortiranje po udaljenosti. Status zalihe je prikazan bojom, ikonom i tekstom. Ako lijeka nema nigdje, nudi se generička zamjena. |
| 3 | Detalj apoteke | `/pacijent/apoteka/:id` | Adresa, telefon, radno vrijeme (današnji dan je istaknut), zaliha traženog lijeka, dugmad Pozovi, Navigacija (simulacija s toastom) i Rezerviši. |
| 4 | Rezervacija | `/pacijent/rezervacija/:apoteka/:lijek` | Količina, potvrda „Ponijeću recept" za lijekove na recept, napomena, ukupna cijena i rok preuzimanja. |
| 4b | Uspjeh | `/pacijent/rezervacija-uspjeh/:id` | Kod rezervacije (npr. RZ-4821) i rok preuzimanja od 2 sata. |
| 5 | Moje rezervacije | `/pacijent/rezervacije` | Statusi Na čekanju / Spremno za preuzimanje / Preuzeto / Otkazano. Otkazivanje ide uz potvrdni dijalog. |
| 6 | Dežurne apoteke | `/pacijent/dezurne` | Lista i mapa dežurnih apoteka za večeras. |
| 7 | Podešavanja | `/pacijent/podesavanja` | Veličina teksta (3 nivoa), tamni način, visoki kontrast i zvukovi. Primjenjuju se globalno. |

### Farmaceut (Apoteka Centar)

| # | Ekran | Putanja | Opis |
|---|-------|---------|------|
| 8 | Prijava | `/farmaceut/prijava` | Samo dugme, bez lozinke. |
| 9 | Dolazne rezervacije | `/farmaceut/rezervacije` | Kartice s dugmadima Potvrdi / Spremno / Odbij (jedan klik, uz „Poništi" u toastu). Promjena se odmah vidi u pacijentovim „Mojim rezervacijama". |
| 10 | Stanje lijekova | `/farmaceut/zalihe` | Tabela s pretragom i filterom. Status (Ima / Malo / Nema) mijenja se jednim tapom. |

## Scenariji za screenshotove

- **Rezervacija u 3 tapa:** Početna → „Brufen 400 mg" (1) → „Rezerviši" na kartici apoteke (2) → „Potvrdi rezervaciju" (3).
- **Nema nigdje, ima zamjena:** pretražite *Augmentin*.
- **Nema nigdje, bez zamjene:** pretražite *Ventolin* (prikazuje se „Šta možete uraditi?").
- **Nema rezultata pretrage:** upišite npr. *xyz* i pritisnite Enter.
- **Filter bez rezultata:** *Controloc* + „Otvoreno sada" + „Samo na stanju".
- **Veza dvije uloge:** rezervišite lijek u Apoteci Centar → prebacite na Farmaceut → Prijavi se → „Spremno" → vratite se na Pacijent → Rezervacije.
- **Pristupačnost:** Podešavanja → Najveća + Tamni način ili Visoki kontrast.

Podešavanja → „Vrati podatke prototipa na početak" vraća sve podatke bez reloada stranice.

## Tehnologije

React 19, Vite, TypeScript, Tailwind CSS v4, React Router, lucide-react (ikone) i Figtree (font preko @fontsource). Mapa je ručno nacrtan SVG; ne koriste se Google Maps ni Leaflet.
