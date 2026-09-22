# Deploy de applicatie naar de server.
#
#   .\deploy.ps1 -Server 123.45.67.89
#   .\deploy.ps1 -Server 123.45.67.89 -Migreer
#
# Wat het doet:
#   1. Een pakket maken van de huidige code (zonder node_modules, databases en build-uitvoer)
#   2. Dat uploaden naar de server
#   3. Uitpakken in de projectmap
#   4. De containers opnieuw bouwen en starten
#
# De eerste keer vraagt scp/ssh om het wachtwoord van de server. Zet je een SSH-sleutel op de
# server, dan gaat het daarna zonder tussenkomst — zie docs/DEPLOY.md stap 3.
#
# Wat het NIET doet:
#   - De omgevingsgegevens (infra/.env) aanmaken of aanpassen. Die staan alleen op de server en
#     worden nooit meegestuurd, want er staan geheimen in.
#   - De database aanpassen. Migraties draaien alleen met -Migreer, en nooit automatisch: een
#     uitrol mag nooit ongevraagd aan het schema komen.

param(
    [Parameter(Mandatory = $true)]
    [string]$Server,

    [string]$Doel = '/opt/foodbook',

    # Draai de databasemigraties na het uitrollen. Alleen nodig als het schema is gewijzigd.
    [switch]$Migreer
)

$ErrorActionPreference = 'Stop'
$projectmap = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectmap

$pakket = Join-Path $env:TEMP 'foodbook-deploy.tar.gz'
$compose = 'docker compose -f infra/docker-compose.prod.yml'

Write-Host ''
Write-Host "  Foodbook uitrollen naar $Server" -ForegroundColor Cyan
Write-Host ''

# ── 1. Pakket maken ──────────────────────────────────────────────────────────
Write-Host '  1/5  Pakket maken...' -ForegroundColor Gray
if (Test-Path $pakket) { Remove-Item $pakket -Force }

# Het pakket wordt buiten de projectmap gezet; anders archiveren we het bestand in zichzelf.
tar --exclude=node_modules --exclude=.next --exclude=voorbeelddocumenten `
    --exclude=.git --exclude='*.db' --exclude='*.db-wal' --exclude='*.db-shm' `
    --exclude='*.tsbuildinfo' --exclude=devserver.log -czf $pakket .

$grootte = [math]::Round((Get-Item $pakket).Length / 1MB, 2)
Write-Host "       $grootte MB" -ForegroundColor DarkGray

# ── 2. Controleren of de server klaar is ─────────────────────────────────────
Write-Host '  2/5  Verbinding controleren...' -ForegroundColor Gray
$klaar = ssh "root@$Server" "test -f $Doel/infra/.env && echo JA || echo NEE" 2>$null
$eersteKeer = $klaar -notmatch 'JA'

# ── 3. Uploaden ──────────────────────────────────────────────────────────────
Write-Host '  3/5  Uploaden...' -ForegroundColor Gray
scp -q $pakket "root@${Server}:/tmp/"
if ($LASTEXITCODE -ne 0) { throw 'Uploaden mislukt.' }

# ── 4. Uitpakken ─────────────────────────────────────────────────────────────
Write-Host '  4/5  Uitpakken...' -ForegroundColor Gray
ssh "root@$Server" "mkdir -p $Doel && cd $Doel && tar -xzf /tmp/foodbook-deploy.tar.gz && rm /tmp/foodbook-deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { throw 'Uitpakken mislukt.' }

if ($eersteKeer) {
    Write-Host ''
    Write-Host '  LET OP: dit lijkt de eerste uitrol.' -ForegroundColor Yellow
    Write-Host "  Er is nog geen $Doel/infra/.env op de server." -ForegroundColor Yellow
    Write-Host '  Maak die eerst aan volgens docs/DEPLOY.md stap 4, met DB_PUSH=true,' -ForegroundColor Yellow
    Write-Host '  anders start de applicatie tegen een database zonder tabellen.' -ForegroundColor Yellow
    Write-Host ''
}

# ── 5. Bouwen en starten ─────────────────────────────────────────────────────
Write-Host '  5/5  Bouwen en starten (dit duurt een paar minuten)...' -ForegroundColor Gray
ssh "root@$Server" "cd $Doel && $compose up -d --build"
if ($LASTEXITCODE -ne 0) { throw 'Bouwen of starten mislukt. Bekijk de uitvoer hierboven.' }

if ($Migreer) {
    Write-Host '       Migraties draaien...' -ForegroundColor Gray
    ssh "root@$Server" "cd $Doel && $compose run --rm migratie"
    if ($LASTEXITCODE -ne 0) { throw 'Migraties mislukt.' }
}

Write-Host ''
Write-Host '  Klaar.' -ForegroundColor Green
Write-Host ''
ssh "root@$Server" "cd $Doel && $compose ps"
Write-Host ''
