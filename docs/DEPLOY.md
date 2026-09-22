# Uitrollen op een server (Digital Ocean)

Dit beschrijft het uitrollen van de applicatie op één server, zodat de klant via een gewoon
webadres kan meekijken en rekenen — zonder iets te installeren.

De opstelling is bewust dezelfde als waarin het systeem uiteindelijk bij de klant komt te draaien:
**PostgreSQL** als database, een **echte schijf** voor de foto's, en **Chromium** in de image zodat
PDF's ook op de server gemaakt worden. Wat je hier test, is dus geen wegwerpomgeving.

> **Let op — waarom niet Vercel of een andere serverless host.** Die draaien je app in containers
> zonder eigen schijf. Daardoor verdwijnen de database en de foto's bij elke uitrol, en is er geen
> browser aanwezig om PDF's te maken. Voor deze applicatie is een server met een eigen schijf nodig.

---

## 1. Server aanmaken

Maak in Digital Ocean een **Droplet** aan met:

| Instelling | Keuze |
|---|---|
| Image | **Ubuntu 24.04 LTS** |
| Grootte | **Basic, 2 GB RAM / 1 vCPU** is genoeg om te beginnen (PDF maken gebruikt geheugen) |
| Regio | Amsterdam (dichtst bij de klant) |
| Authenticatie | SSH-sleutel (aanbevolen) |

Wijs daarna een **domeinnaam** naar het IP-adres van de server (een A-record). Doe dit vóór stap 5,
anders kan er geen HTTPS-certificaat worden aangevraagd.

## 2. Inloggen en Docker installeren

```bash
ssh root@JOUW_SERVER_IP

apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
```

Controleer met `docker --version`.

## 3. De code op de server krijgen

De webconsole van Digital Ocean is een terminal **op** de server. Daarmee kun je alles doen, maar
je kunt er geen bestanden naartoe slepen. De code moet dus op een van twee manieren komen:

### Manier A — met git (aanbevolen, herhaalbaar)

Zet de code in een repository (GitHub, GitLab) en kloon die op de server:

```bash
mkdir -p /opt/foodbook && cd /opt/foodbook
git clone JOUW_REPOSITORY_URL .
```

Bij een volgende uitrol is het dan `git pull` in plaats van opnieuw uploaden.

### Manier B — één keer een pakket overzetten

Op **je eigen machine**, in de projectmap:

```bash
tar --exclude=node_modules --exclude=.next --exclude=voorbeelddocumenten \
    --exclude='*.db' --exclude=.git -czf foodbook-deploy.tar.gz .
scp foodbook-deploy.tar.gz root@JOUW_SERVER_IP:/opt/
```

Op de **server**:

```bash
mkdir -p /opt/foodbook && cd /opt/foodbook
tar -xzf /opt/foodbook-deploy.tar.gz
rm /opt/foodbook-deploy.tar.gz
```

### Daarna: omgevingsgegevens

```bash
cd /opt/foodbook
cp infra/.env.example infra/.env
nano infra/.env
```

Vul `infra/.env` in. Genereer een echt geheim voor `PAYLOAD_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Gebruik **nooit** de voorbeeldwaarde uit het voorbeeldbestand op een server die van buitenaf
> bereikbaar is. Met dat geheim kan iemand anders zich voordoen als ingelogde gebruiker.

## 4. Eerste keer starten

Bij een **lege** database bestaan er nog geen tabellen. Zet daarom eenmalig in `infra/.env`:

```
DB_PUSH=true
```

Start dan:

```bash
cd /opt/foodbook
docker compose -f infra/docker-compose.prod.yml up -d --build
```

De eerste keer duurt dit enkele minuten (de image wordt gebouwd). Daarna:

```bash
docker compose -f infra/docker-compose.prod.yml ps             # status
docker compose -f infra/docker-compose.prod.yml logs -f app    # meelopen met de app
```

Caddy vraagt automatisch een HTTPS-certificaat aan. Open `https://JOUW_DOMEIN/admin`.

**Zet `DB_PUSH` daarna weer op `false`** en start opnieuw:

```bash
sed -i 's/^DB_PUSH=true/DB_PUSH=false/' infra/.env
docker compose -f infra/docker-compose.prod.yml up -d
```

Vanaf dat moment gaat het databaseschema uitsluitend via migraties. Dat is het punt waarop een
uitrol nooit meer gegevens kan wegvagen.

## 5. Direct je account aanmaken

Zolang er geen gebruiker bestaat, is het scherm **"Welkom"** voor iedereen bereikbaar die het adres
kent. Maak dus **meteen** na de eerste start je account aan en kies de rol **Beheerder**. Daarna is
de beheeromgeving alleen na inloggen te bereiken.

## 6. De referentielijsten vullen

Allergenen en btw-tarieven zet je er met het seed-script in:

```bash
cd /opt/foodbook
docker compose -f infra/docker-compose.prod.yml run --rm \
  -e NODE_ENV=development migratie npm run seed --workspace @foodbook/web
```

Opnieuw draaien is veilig: het maakt geen dubbele rijen aan.

## 7. Migraties (vanaf de tweede uitrol)

Zodra `DB_PUSH` uit staat, verlopen schemawijzigingen via migraties.

**Eenmalig, op je eigen machine:** maak de migratiebestanden aan. Ze komen in
`apps/web/src/migrations` te staan en horen in versiebeheer.

```bash
npm run migrate:create -w @foodbook/web
```

**Op de server**, bij de eerste installatie en na elke uitrol met nieuwe migraties:

```bash
docker compose -f infra/docker-compose.prod.yml run --rm migratie
```

Die service gebruikt een aparte bouwfase van de Dockerfile met de volledige broncode erin, want
de draaiende image bevat alleen de gebouwde app en geen migratiegereedschap. Draaien met
`--rm migratie` is veilig om te herhalen: al toegepaste migraties worden overgeslagen.

---

## Back-up

Twee dingen moeten bewaard blijven: de **database** en de **foto's**.

```bash
# database
docker compose -f infra/docker-compose.prod.yml exec db \
  pg_dump -U foodbook foodbook > back-up-$(date +%F).sql

# foto's
docker run --rm -v foodbook_media-data:/data -v "$PWD:/backup" alpine \
  tar czf /backup/media-$(date +%F).tar.gz -C /data .
```

Zet dit in een cronjob en kopieer de bestanden van de server af. Een back-up die op dezelfde
server staat als de gegevens is geen back-up.

## Bijwerken naar een nieuwe versie

```bash
cd /opt/foodbook
# nieuwe bestanden erheen kopiëren of git pull
docker compose -f infra/docker-compose.prod.yml run --rm app npm run migrate -w @foodbook/web
docker compose -f infra/docker-compose.prod.yml up -d --build
```

De database en de foto's staan op volumes en blijven bij een nieuwe uitrol bewaard.

---

## Wat er nog niet is

- **E-mailverzending.** Documenten per e-mail versturen is nog niet gebouwd; er is nog geen
  e-mailprovider aangesloten. Payload schrijft e-mails voorlopig naar de logregels.
- **Een knop om een evenement door te rekenen.** De rekenmotor werkt en de documenten worden
  correct opgebouwd, maar de schermen die dit vanuit de beheeromgeving aanroepen moeten nog
  gebouwd worden. Op deze server kun je nu gegevens beheren en bekijken, nog niet rekenen.
- **Automatische back-up.** De commando's hierboven staan klaar, maar er is nog geen planning
  ingericht.
