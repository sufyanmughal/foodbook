# Productie-image voor de Foodbook-applicatie.
#
# Bouwt de Next.js-app met Payload in drie fasen en levert een kleine runtime-image met
# Chromium erbij, zodat PDF's ook op de server gemaakt kunnen worden.
#
# Bouwen (vanaf de projectwortel):
#   docker build -t foodbook .
#
# Draaien: zie infra/docker-compose.prod.yml

# ─────────────────────────────────────────────────────────────────────────────
# Basis
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS basis
WORKDIR /app

# ─────────────────────────────────────────────────────────────────────────────
# Afhankelijkheden — alleen de pakketbestanden, zodat deze laag blijft cachen
# ─────────────────────────────────────────────────────────────────────────────
FROM basis AS deps
COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/desktop/package.json ./apps/desktop/
COPY packages/calculation-engine/package.json ./packages/calculation-engine/
COPY packages/documents/package.json ./packages/documents/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci --include=dev

# ─────────────────────────────────────────────────────────────────────────────
# Bouwen
# ─────────────────────────────────────────────────────────────────────────────
FROM basis AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Het geheugen van Node begrenzen. De bouw draait naast Postgres, Caddy en de draaiende app op
# een machine met twee GB. Zonder grens laat Node zijn heap oplopen tot de machine gaat wisselen
# en niets meer beantwoordt; met een grens ruimt de garbage collector eerder op. Dat is trager,
# maar de server blijft bereikbaar. Zie ook experimental.cpus in next.config.mjs.
ENV NODE_OPTIONS=--max-old-space-size=1024

RUN npm run build --workspace @foodbook/web

# ─────────────────────────────────────────────────────────────────────────────
# Migraties
#
# De draaiende image hieronder bevat alleen de gebouwde app: daar zit geen Payload-CLI en geen
# migratiemap in. Deze fase behoudt de volledige broncode en node_modules, zodat
# `payload migrate` wél uitgevoerd kan worden. Gebruikt door de `migratie`-service in
# infra/docker-compose.prod.yml; start niet mee met de gewone app.
#
# LET OP — deze fase staat bewust VÓÓR de draaifase. Docker bouwt zonder `--target` de laatste
# fase uit dit bestand. Stond deze achteraan, dan kreeg de app-container de migratie-image en
# draaide hij `payload migrate` in plaats van de server. De draaifase hoort dus altijd laatste
# te staan.
# ─────────────────────────────────────────────────────────────────────────────
FROM build AS migratie
ENV NODE_ENV=production
CMD ["npm", "run", "migrate", "--workspace", "@foodbook/web"]

# ─────────────────────────────────────────────────────────────────────────────
# Draaien — altijd de laatste fase
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Chromium voor de PDF-rendering (§5). De app zoekt de browser zelf; CHROME_PAD maakt het
# expliciet zodat een andere locatie ook werkt.
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*
ENV CHROME_PAD=/usr/bin/chromium

# De zelfstandige Next-output bevat alleen de app en de werkelijk gebruikte dependencies.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

# Uploads horen op een volume, niet in de image.
ENV MEDIA_DIR=/data/media
RUN mkdir -p /data/media

EXPOSE 3000

# tini zorgt dat Chromium-processen netjes worden opgeruimd.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/web/server.js"]
