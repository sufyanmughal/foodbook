# Foodbook & Catering Operations — Systeemarchitectuur

Status: v1 scope, 300–350 uur bouwplan (zie client-overeenkomst)
Taal van applicatie: Nederlands (volledig, vanaf dag 1)
Taal van dit document: Engels (intern technisch naslagwerk voor de bouw)

---

## 1. Doel & kernprincipe

Single source of truth voor de hele operationele keten:

```
FOODBOOK → EVENT → ORDER → CALCULATION → QUOTATION → PRODUCTION → PURCHASING → PICKING → DELIVERY → INVOICE
```

Every stage is a real record in the database that carries forward everything computed in the stage before it. Nothing is ever re-typed by a human between stages — a change at the source (e.g. grams per person on a recipe) propagates forward automatically into every downstream document that hasn't been locked/finalized yet.

Two user-facing surfaces, one shared backend:

- **Beheer (Admin/Back-office)** — internal staff manage products, recipes, ingredients, photos, prices, customers, events, and generate documents.
- **Foodbook (presentatie)** — the premium, photo-led catalog view, generated live from the same data, shown to clients (in-app browsing and/or exported).

---

## 2. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React, TypeScript) | Single codebase reusable for web, and wrappable for desktop |
| Desktop packaging (v1: Windows) | Tauri | Small binary, uses OS webview (not a bundled Chromium like Electron) → faster, lighter, easier for one dev to maintain; same wrapper repackages for macOS later with near-zero extra frontend work |
| Backend | Node.js (NestJS or Express + TypeScript) | Matches frontend language; consistent with other NDY-ecosystem backend choices already in use |
| Admin/CRUD layer | Payload CMS (self-hosted, Node/Postgres-native) | Generates authenticated, role-based CRUD admin screens from schema definitions instead of hand-building each one — this is what makes 300–350 hours realistic. Content-modeling fits products/recipes/media naturally. |
| Database | PostgreSQL | Relational integrity matters here (recipe → ingredient → allergen chains, order → invoice traceability); strong JSON support for flexible fields (e.g. translations, document snapshots) |
| File/photo storage | Local disk (dev) → S3-compatible object storage (production) | Photos need durable storage + CDN-style delivery; S3-compatible keeps future cloud portability open |
| Image processing | `sharp` (Node) | Crop/resize/thumbnail generation server-side, triggered on upload |
| PDF generation | `@react-pdf/renderer` or Puppeteer (HTML→PDF) | Renders the same React document templates used on-screen into pixel-consistent PDFs |
| Email sending | Existing NDY infra pattern (SES via transactional email service) if available, otherwise Resend | Sending quotations/invoices/lists by email directly from the system |
| Auth | Session/JWT-based, role permissions (Payload's built-in access control) | Authorised-user editing without a developer; role separation (admin / kitchen / sales) |
| i18n | `next-intl` (already the proven pattern from other NDY projects) with `nl` as default locale | Dutch from day one, additional locales are a config/message-file addition later, not a rebuild |
| Local data layer (desktop) | SQLite, embedded in the Tauri app | Enables true offline operation — see §9 |
| Sync engine | Custom, built on top of `calculation-engine`'s pure functions | Reconciles local SQLite ↔ central PostgreSQL when connectivity returns |

**Why this combination hits the 300–350 hour target:** the biggest cost driver in the original 900-hour plan was hand-building every admin CRUD screen (products, recipes, ingredients, customers, etc.) individually. Payload CMS generates those screens from a schema/collection definition, with role-based access control, media handling, and relational fields built in. Custom work is concentrated where it actually matters: the calculation engine and the document-generation engine — the two things no framework does for you.

---

## 3. Data model — entities in detail

Each entity below: purpose, key fields, relationships, and who can edit it.

### 3.1 Product (`Producten`)

The atomic sellable/servable item — a dish, a drink, a buffet component.

| Field | Type | Notes |
|---|---|---|
| `naam` | string (NL) | Display name shown in Foodbook |
| `beschrijving` | rich text (NL) | Marketing description for the Foodbook |
| `categorie` | relation → Category | e.g. Voorgerecht, Hoofdgerecht, Nagerecht, Buffet, Drank |
| `foto's` | relation → Media[] (ordered) | See §3.9 |
| `hoofdfoto` | relation → Media (single, must be in `foto's`) | Cover photo |
| `porties_basis` | number | Base quantity this recipe/product is costed for (e.g. "per 1 persoon") |
| `eenheid` | enum: gram / ml / stuk | Unit the portion is measured in |
| `hoeveelheid_per_persoon` | decimal | e.g. `160` (grams per person) — **this is the field the calculation engine scales** |
| `recept` | relation → Recipe (optional) | If the product is composed of a recipe with ingredients |
| `prijs_per_persoon` | decimal | Ex-VAT sales price |
| `btw_tarief` | relation → VATRate | Dutch catering VAT is typically 9%, but alcohol/some items are 21% — must be per-product, not global |
| `allergenen` | relation → Allergen[] | Direct tags, OR derived automatically from recipe ingredients (see §4.3) |
| `actief` | boolean | Hide from Foodbook without deleting |
| `seizoen` | relation → Season (optional) | For seasonal-menu filtering later |

**Who edits:** Beheer role (kitchen/menu manager). No developer required.

### 3.2 Recipe (`Recepten`)

The internal composition of a product — what ingredients, in what quantities, to make one base portion.

| Field | Type | Notes |
|---|---|---|
| `naam` | string | Internal name, may differ from product display name |
| `basis_porties` | number | e.g. "this recipe as written serves 10" |
| `ingredienten` | relation → RecipeLine[] | Each line: ingredient + quantity + unit for the base portion count |
| `bereidingswijze` | rich text | Internal kitchen instructions (not shown to client) |
| `kooktijd_minuten` | number (optional) | For production planning/scheduling later |

**RecipeLine** (join entity): `ingredient`, `hoeveelheid`, `eenheid`. This is the level the calculation engine actually scales — see §4.

**Who edits:** Beheer / kitchen role.

### 3.3 Ingredient (`Ingrediënten`)

The raw-material level — what actually gets purchased.

| Field | Type | Notes |
|---|---|---|
| `naam` | string | e.g. "Zalmfilet" |
| `inkoopeenheid` | enum: gram / ml / stuk / kg / liter | Unit as purchased from supplier |
| `inkoopprijs` | decimal | Cost price per purchase unit — drives production cost calculations |
| `leverancier` | relation → Supplier (optional) | For purchasing lists |
| `allergenen` | relation → Allergen[] | The authoritative allergen source — propagates up to recipes → products automatically |
| `houdbaarheid_dagen` | number (optional) | For purchasing-timing logic later |

**Who edits:** Beheer / purchasing role.

### 3.4 Allergen (`Allergenen`)

Fixed reference list per Dutch/EU legal requirement (the 14 officially recognized allergens: gluten, ei, melk, noten, pinda, soja, vis, schaaldieren, weekdieren, selderij, mosterd, sesamzaad, sulfiet, lupine).

| Field | Type | Notes |
|---|---|---|
| `naam` | string | Dutch legal name |
| `icoon` | Media | Standard allergen icon for documents/Foodbook |
| `wettelijke_code` | string | For audit traceability |

**Who edits:** Seeded once at setup; rarely changed. Editable by admin only.

### 3.5 VAT Rate (`BTW-tarieven`)

| Field | Type | Notes |
|---|---|---|
| `naam` | string | e.g. "Laag (9%)", "Hoog (21%)" |
| `percentage` | decimal | |
| `standaard` | boolean | Default rate for new products |

**Who edits:** Admin only (rare changes, legally sensitive).

### 3.6 Customer (`Klanten`)

| Field | Type | Notes |
|---|---|---|
| `naam` | string | Company or individual |
| `contactpersoon` | string | |
| `email`, `telefoon`, `adres` | string | |
| `factuuradres` | address (may differ from delivery address) | |
| `btw_nummer` | string (optional) | For B2B invoicing |
| `notities` | rich text | Internal notes (dietary preferences noted historically, etc.) |

**Who edits:** Sales/Beheer role.

### 3.7 Event (`Evenementen`)

The central planning object — one event = one catering job.

| Field | Type | Notes |
|---|---|---|
| `klant` | relation → Customer | |
| `titel` | string | e.g. "Bruiloft Jansen" |
| `datum` | date | Event date |
| `locatie` | address/text | Delivery/event address |
| `aantal_gasten` | number | **The single number that drives all recalculation** |
| `status` | enum | Concept → Offerte verzonden → Bevestigd → In productie → Geleverd → Gefactureerd → Afgerond |
| `producten` | relation → EventLine[] | The selected products/menu for this event |
| `materialen` | relation → EventMaterialLine[] | Non-food items needed (see §3.8) |
| `notities` | rich text | |

**EventLine** (join entity): `product`, `aantal_gasten_override` (optional, if a specific dish is for a subset of guests), `hoeveelheid_per_persoon_override` (optional, if this specific event needs 200g instead of the product default 160g — critical per client's explicit ask). This override, not the base product, is what the calculation engine reads first.

**Who edits:** Sales/event planner role.

### 3.8 Material (`Materialen`)

Non-food, operational items — plates, cutlery, napkins, trays, gastronorm containers, warming/serving equipment, transport crates. **Explicitly separate from Ingredients**: Materials are never eaten, never appear on a Purchasing/Food Order list, and are tracked and calculated on their own track, parallel to but independent from the food side.

| Field | Type | Notes |
|---|---|---|
| `naam` | string | |
| `categorie` | relation → MaterialCategory | e.g. Serviesgoed, Bestek, Serveermaterialen, Verwarmingsapparatuur, Transport |
| `eenheid` | enum: stuk / set / etc | |
| `schaalbaar_per_persoon` | boolean | If true, `hoeveelheid_per_persoon` below is used to auto-scale with guest count, same mechanism as Product (§4.1) |
| `hoeveelheid_per_persoon` | decimal (optional) | e.g. "1 bord per persoon", "0.1 gastronormbak per persoon" — only used when `schaalbaar_per_persoon` is true |
| `voorraad_beheerd` | boolean | Whether stock is tracked (v1: simple flag; full stock module is phase 2) |
| `huurprijs` / `kostprijs` | decimal (optional) | |

**Linking to Products/Menus:** a `Product` (or a menu/buffet grouping) can optionally declare a set of **required Materials** (e.g. "this buffet needs gastronorm containers + serving tongs + trays"), so that building an Event automatically pulls in the right materials alongside the food — not just a manually maintained parallel list. This link is a simple many-to-many relation (`Product.benodigde_materialen`), resolved into the Event's material list the same way EventLines resolve food quantities.

**Result:** two clearly separate, both auto-calculated lists per event — **Food Order/Production/Purchasing List** (from Products → Recipes → Ingredients) and **Materials List** (from Materials, either directly added to the Event or auto-pulled via Product links, scaled by guest count where `schaalbaar_per_persoon` applies).

**Who edits:** Beheer role.

### 3.9 Media (`Media`) — Photo management

This is its own first-class entity, not just an attachment field, because of the client's explicit requirements.

| Field | Type | Notes |
|---|---|---|
| `bestand` | file (image) | Original upload |
| `varianten` | generated (thumbnail / foodbook-card / foodbook-hero / print) | Auto-generated via `sharp` on upload — see §5 |
| `volgorde` | number | Drives reorder-within-product ordering |
| `alt_tekst` | string | Accessibility + SEO if Foodbook is ever web-published |
| `gekoppeld_aan` | relation → Product (or other entity) | |

**Admin capabilities (all self-service, no developer):**
- Upload new photo(s), including multiple at once
- Replace an existing photo (keeps its position/order)
- Remove a photo
- Attach multiple photos to one product
- Mark one photo as `hoofdfoto` (cover)
- Drag-and-drop reorder
- Crop tool on upload (fixed aspect ratio matching Foodbook card/hero dimensions) with auto-resize/compression server-side regardless of source image size

**Who edits:** Beheer role (any authorised user, not just admin — this was explicitly requested to be fast/frictionless).

### 3.10 Quotation (`Offertes`)

Generated from an Event snapshot at a point in time.

| Field | Type | Notes |
|---|---|---|
| `event` | relation → Event | |
| `versie` | number | Quotations can be revised; each save increments version, old versions retained |
| `regels` | snapshot of EventLine data + calculated prices | **Frozen at generation time** — if the product price changes later, old quotations don't silently change |
| `subtotaal`, `btw_totaal`, `totaal` | decimal | Calculated, stored |
| `status` | enum | Concept / Verzonden / Geaccepteerd / Verlopen / Geweigerd |
| `geldig_tot` | date | |
| `pdf_bestand` | Media (generated) | Stored copy of the generated PDF for audit trail |

**Who edits:** Generated by system from Event data; sales can add quotation-level notes/discounts before sending.

### 3.11 Order (`Orders`)

An accepted Quotation becomes an Order — same underlying data, different status meaning ("this is now committed, not just proposed").

| Field | Type | Notes |
|---|---|---|
| `event` | relation → Event | |
| `offerte` | relation → Quotation (the accepted version) | |
| `status` | enum | Bevestigd → In productie → Gereed → Geleverd |
| `bevestigingsdatum` | date | |

### 3.12 Production (`Productie`)

Derived, not manually entered — the system explodes every Order's product list down to recipe-and-ingredient level, scaled to guest count.

| Field | Type | Notes |
|---|---|---|
| `order` | relation → Order | |
| `productie_regels` | generated: per recipe, scaled ingredient list | See §4.2 |
| `keukenlijst_notities` | rich text | Free-text kitchen instructions added on top of the generated list |

### 3.13 Purchasing (`Inkoop`)

Derived from Production — aggregates ingredient needs **across all events** in a date range, so purchasing isn't done per-event but per-shopping-trip.

| Field | Type | Notes |
|---|---|---|
| `periode` | date range | |
| `inkoop_regels` | generated: ingredient, total quantity needed, supplier | Aggregated across all Production records in the period, minus current stock if stock tracking is enabled |

### 3.14 Picking (`Picking`)

Combined picking/delivery list per the v1 scope decision (§ "moved to phase 2" splits this into two later).

| Field | Type | Notes |
|---|---|---|
| `order` | relation → Order | |
| `regels` | generated from Production + Materials | What needs to be packed: food items with quantities + materials |
| `afgevinkt_door`, `afgevinkt_op` | user, timestamp | Simple checklist completion tracking |

### 3.15 Delivery (`Levering`)

| Field | Type | Notes |
|---|---|---|
| `order` | relation → Order | |
| `leverdatum`, `levertijd` | date, time | |
| `adres` | inherited from Event, editable | |
| `chauffeur` / `verantwoordelijke` | string (optional) | |
| `status` | enum | Gepland / Onderweg / Geleverd |

### 3.16 Invoice (`Facturen`)

| Field | Type | Notes |
|---|---|---|
| `order` | relation → Order | |
| `factuurnummer` | string, sequential, legally required format | Must be gapless/sequential per Dutch invoicing law |
| `factuurdatum`, `vervaldatum` | date | |
| `regels` | snapshot from Order/Quotation | Frozen at invoice generation |
| `subtotaal`, `btw_regels` (per rate), `totaal` | decimal | VAT must be broken out per rate, not just totaled (legal requirement) |
| `status` | enum | Concept / Verzonden / Betaald / Te laat |
| `pdf_bestand` | Media (generated) | |

### 3.17 User (`Gebruikers`) & Roles

| Role | Can do |
|---|---|
| `Beheerder` (Admin) | Everything, incl. VAT rates, allergen list, user management |
| `Verkoop` (Sales) | Customers, events, quotations, orders |
| `Keuken` (Kitchen) | View production/kitchen lists, edit recipes/products |
| `Logistiek` (Logistics) | Picking, delivery |

Payload's built-in role/access-control system implements this directly against the collections above — this is not custom-built from scratch.

---

## 4. The calculation engine (core differentiator)

This is the part the client explicitly called "particularly important" — detailed on purpose.

### 4.1 The scaling rule

Every `RecipeLine` and every `Product.hoeveelheid_per_persoon` is defined **per one person** (or per the recipe's stated base portion count, normalized to per-person internally). The engine never stores a "total for this event" as a manually entered number — it is always *derived*.

```
benodigde_hoeveelheid(ingredient, event) =
    Σ over each EventLine in event:
        (EventLine.hoeveelheid_per_persoon_override ?? Product.hoeveelheid_per_persoon)
        × (EventLine.aantal_gasten_override ?? Event.aantal_gasten)
        × RecipeLine.hoeveelheid_ingredient_per_basisportie
        ÷ Recipe.basis_porties
```

### 4.2 What triggers recalculation

- Changing `Event.aantal_gasten` → recalculates every line for that event immediately (client's exact example: 180g → 160g, guest count change, everything downstream updates).
- Changing a `Product.hoeveelheid_per_persoon` (e.g. global recipe portion change) → recalculates every **future/unlocked** event using that product. Does **not** retroactively change already-sent Quotations or Invoices (those are frozen snapshots — see §3.10, §3.16). This distinction matters legally and operationally and must be explicit in the UI ("this change affects new/open events only").
- Changing `Ingredient.inkoopprijs` → recalculates cost/margin figures, not client-facing prices (client prices come from `Product.prijs_per_persoon`, set deliberately, not auto-derived from cost — catering margins are a business decision, not a formula).

### 4.3 Allergen propagation

Allergens are tagged at `Ingredient` level (source of truth). A `Recipe`'s allergen set = union of all its `RecipeLine.ingredient.allergenen`. A `Product`'s allergen set = union of its recipe's allergens plus any manually added direct tags (for cases with no formal recipe, e.g. bought-in items). This union is computed live, not manually maintained, so a forgotten manual allergen tag can't cause a legal/safety miss as long as the ingredient-level data is correct.

### 4.4 Rounding & purchasing practicality

Purchasing quantities round **up** to the ingredient's practical purchase unit (e.g. if 2.3kg of salmon is needed and it's sold by 1kg, purchasing list shows 3kg), while production/kitchen lists show the exact calculated amount (2.3kg) — these are two different rounding rules applied at two different stages, both derived from the same underlying scaled number.

---

## 5. Document generation engine

One shared rendering approach: every document type is a React template that can render to screen (preview), PDF (via Puppeteer/`@react-pdf/renderer`), and is wrapped by a common "generate → preview → print / download PDF / email" action bar.

| Document | Source data | Key content |
|---|---|---|
| Offerte (Quotation) | Quotation snapshot | Line items, prices, VAT, terms, valid-until date |
| Orderbevestiging (Confirmation) | Order | Confirmed items, event details, no prices needed necessarily (config option) |
| Voedsel-bestellijst / Productielijst | Production | Scaled ingredient list per recipe, grouped by kitchen station |
| Keukenlijst | Production | Kitchen-facing version with prep instructions, timing |
| Inkooplijst / Materialenlijst | Purchasing + Materials | Aggregated ingredients + non-food materials, grouped by supplier |
| Picking/Paklijst | Picking | Checklist format, grouped by event, food + materials |
| Leveringslijst | Delivery | Address, time, driver, contents summary |
| Allergenenlijst | Product/Recipe allergen union | **Per-dish allergen matrix**, clearly legible, legally defensible format |
| Factuur (Invoice) | Invoice snapshot | Sequential invoice number, VAT breakdown per rate, payment terms |

Each template: Dutch labels hard-coded via the i18n layer (not hardcoded strings, so future-language support is possible), company branding (logo/colors from a settings collection, editable by admin), consistent footer with legal info (KVK/BTW numbers).

**Email sending:** each document's action bar includes "Verstuur per e-mail" → pre-fills recipient from the Customer record, subject/body template (editable per send), attaches the generated PDF, and logs the send (timestamp, recipient, document version) against the Event for audit trail.

---

## 6. Application structure (repo layout)

```
foodbook/
  apps/
    web/                 # Next.js frontend (Foodbook presentation + shared UI)
    admin/                # Payload CMS admin (or Payload runs embedded in the same Next.js app — confirm during setup)
    desktop/              # Tauri wrapper config, targets apps/web build output
  packages/
    calculation-engine/   # Pure TS module: scaling, allergen propagation, rounding — unit-tested independently
    documents/             # React document templates + PDF render pipeline
    shared-types/          # TypeScript types shared across frontend/backend (entities, enums)
    i18n/                  # Dutch (and future) message catalogs
  infra/
    docker-compose.yml     # Postgres + object storage for local dev
    migrations/
  docs/
    ARCHITECTURE.md        # this file
```

Rationale for the monorepo split: `calculation-engine` and `documents` are the custom, high-value packages — keeping them isolated and independently testable protects the part of the system that must never silently produce a wrong number on an invoice.

---

## 7. Offline operation, local data & sync

Explicit client requirement: the desktop application must work with **no internet connection** — open the Foodbook, browse existing products/recipes, build/edit an event or order, run the calculation engine, and generate/print documents, all fully locally.

### 7.1 Why this changes the architecture

A thin desktop client that just calls a remote Node/PostgreSQL API cannot do this — no connection means no data and no calculation. The fix is **local-first**, not "cache some pages":

- Every Windows installation embeds a local **SQLite** database inside the Tauri app.
- The full dataset the user needs (products, recipes, ingredients, allergens, customers, and their own events/orders) is stored locally, not fetched on demand.
- The `calculation-engine` package (§4) runs **inside the desktop app itself**, against the local SQLite data — it never needs the network to compute a scaled quantity.
- The document engine (§5) renders PDFs locally too — printing/PDF/preview never depends on server round-trips.
- Emailing a document is the one action that genuinely requires connectivity (sending mail); if offline, the email is queued and sent automatically once the connection returns.

### 7.2 Central system & role

PostgreSQL + the Node backend remain the **central source of truth** — used for:

- Initial setup and onboarding of a new installation (pulls the current product/recipe/customer catalog down to local SQLite)
- Multi-device / multi-user consistency (if the client ever runs the app on more than one Windows machine)
- Backups (central database is backed up on a schedule, independent of any single desktop machine)
- Future platforms (macOS, iOS/iPad) reading/writing through the same central API

### 7.3 Sync model

- **Pull:** on every successful connection, the local app checks for changes to shared reference data (products, recipes, prices, allergens, photos) made centrally or on another device, and pulls them down.
- **Push:** locally created/edited records (new events, orders, quotations built while offline) are queued and pushed to the central database once connectivity returns.
- **Conflict handling (v1, kept deliberately simple):** last-write-wins on shared reference data (products/recipes), with a visible "gewijzigd sinds jouw laatste synchronisatie" notice if a conflict is detected — no complex merge UI in v1. Event/order records are normally only edited by one user/device at a time in this business, so real conflicts are expected to be rare.
- **Local backup:** the local SQLite file itself is backed up automatically (e.g. daily rolling copy) so a machine failure doesn't lose in-progress work between syncs.

### 7.4 What this adds to the build (transparency, not hidden in existing hours)

This is real additional scope beyond a purely server-dependent design, and is priced as such — see the updated hour breakdown in [PLAN.md](./PLAN.md). It is not a "nice to have" bolted on for free; it is a structural piece: a local database layer, a sync engine, and running the calculation + document engines client-side instead of assuming a server is always reachable.

## 8. Platform roadmap

| Phase | Platform | Approach |
|---|---|---|
| v1 (this build) | Windows desktop | Next.js app wrapped in Tauri |
| Phase 2 | macOS desktop | Same Tauri wrapper, macOS target build — near-zero frontend rework |
| Phase 2/3 | iOS / iPad | React Native (Expo), consuming the same backend API — separate app, shared business logic via `packages/shared-types` and API contracts, not a shared UI codebase |

The backend and calculation/document engines are platform-agnostic from day one specifically so this roadmap doesn't require re-architecture later — only new frontend shells consuming the same API.

---

## 9. What is explicitly NOT in v1

(Restated here from the client agreement, for build-time discipline.)

- Native iOS/iPad app
- macOS build
- Splitting Picking and Delivery into two independently configurable modules
- Per-document custom layout editor (branding is configurable; layout structure is not, in v1)
- Additional languages beyond Dutch
- Stock/inventory depth beyond a simple tracked/not-tracked flag on Materials
- Accounting software or payment provider integrations
- Complex multi-device conflict resolution beyond last-write-wins (§7.3) — real-time collaborative editing of the same event by two people at once is not in v1

---

## 10. v1 acceptance test (definition of done)

Agreed objective test before delivery is considered complete — one full run of the real workflow, not a checklist of isolated features:

**Scenario:** build one complete test event for **250 guests**, entirely inside the system.

**Steps, each of which must pass:**

1. Select a full menu (multiple products/dishes) for the event and set guest count to 250.
2. Verify the calculation engine correctly scales every ingredient quantity, gram/ml/piece-per-person figure, and material quantity for 250 guests — including at least one live change (e.g. adjust guests to 300 mid-test, confirm every number updates automatically).
3. Generate the Quotation — verify prices, VAT breakdown per rate, and totals are correct.
4. Generate the Food Order / Production / Purchasing List — verify scaled ingredient quantities and correct purchase-unit rounding (§4.4).
5. Generate the Materials List — verify it is a **separate, correct list** from the food list, containing the right operational materials/equipment (auto-pulled from product links plus any manually added), correctly scaled where applicable.
6. Generate the Allergen List — verify it correctly reflects the union of allergens from every selected dish, matching the underlying ingredient data.
7. Confirm every generated document can be: previewed, printed, exported as PDF, and sent by email.
8. Disconnect the test machine from the internet and repeat steps 1–7 fully offline (per §7) — confirm everything above still works with no connection, except the actual email send, which must queue and confirm it sends automatically once reconnected.

**v1 is considered finished and ready for delivery when all 8 steps pass without manual workarounds**, on the delivered Windows installation.
