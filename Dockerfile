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
RUN npm run build --workspace @foodbook/web

# ─────────────────────────────────────────────────────────────────────────────
# Draaien
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

# ─────────────────────────────────────────────────────────────────────────────
# Migraties
#
# De draaiende image hierboven bevat alleen de gebouwde app: daar zit geen Payload-CLI en
# geen migratiemap in. Deze fase behoudt de volledige broncode en node_modules, zodat
# `payload migrate` wél uitgevoerd kan worden. Gebruikt door de `migrate`-service in
# infra/docker-compose.prod.yml; start niet mee met de gewone app.
# ─────────────────────────────────────────────────────────────────────────────
FROM build AS migratie
ENV NODE_ENV=production
CMD ["npm", "run", "migrate", "--workspace", "@foodbook/web"]
