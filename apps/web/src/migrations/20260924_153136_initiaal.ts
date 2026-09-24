import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_producten_eenheid" AS ENUM('gram', 'ml', 'stuk', 'kg', 'liter');
  CREATE TYPE "public"."enum_recepten_ingredienten_eenheid" AS ENUM('gram', 'ml', 'stuk', 'kg', 'liter');
  CREATE TYPE "public"."enum_recepten_eenheid" AS ENUM('gram', 'ml', 'stuk', 'kg', 'liter');
  CREATE TYPE "public"."enum_ingredienten_inkoopeenheid" AS ENUM('gram', 'ml', 'stuk', 'kg', 'liter');
  CREATE TYPE "public"."enum_evenementen_status" AS ENUM('concept', 'offerte_verzonden', 'bevestigd', 'in_productie', 'geleverd', 'gefactureerd', 'afgerond');
  CREATE TYPE "public"."enum_materialen_eenheid" AS ENUM('gram', 'ml', 'stuk', 'kg', 'liter');
  CREATE TYPE "public"."enum_offertes_status" AS ENUM('concept', 'verzonden', 'geaccepteerd', 'verlopen', 'geweigerd');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('bevestigd', 'in_productie', 'gereed', 'geleverd');
  CREATE TYPE "public"."enum_facturen_status" AS ENUM('concept', 'verzonden', 'betaald', 'te_laat');
  CREATE TYPE "public"."enum_pickings_regels_soort" AS ENUM('voedsel', 'materiaal');
  CREATE TYPE "public"."enum_pickings_status" AS ENUM('open', 'afgevinkt');
  CREATE TYPE "public"."enum_leveringen_status" AS ENUM('gepland', 'onderweg', 'geleverd');
  CREATE TYPE "public"."enum_gebruikers_rol" AS ENUM('beheerder', 'verkoop', 'keuken', 'logistiek');
  CREATE TYPE "public"."enum_verzendlog_document_type" AS ENUM('offerte', 'orderbevestiging', 'productielijst', 'keukenlijst', 'inkooplijst', 'materialenlijst', 'paklijst', 'leveringslijst', 'allergenenlijst', 'factuur');
  CREATE TABLE "producten_materialen" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"materiaal_id" integer NOT NULL,
  	"hoeveelheid" numeric DEFAULT 1 NOT NULL,
  	"per_aantal_gasten" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "producten" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"beschrijving" jsonb,
  	"categorie_id" integer NOT NULL,
  	"hoofdfoto_id" integer,
  	"porties_basis" numeric DEFAULT 1 NOT NULL,
  	"eenheid" "enum_producten_eenheid" NOT NULL,
  	"hoeveelheid_per_persoon" numeric NOT NULL,
  	"recept_id" integer,
  	"prijs_per_persoon" numeric NOT NULL,
  	"btw_tarief_id" integer NOT NULL,
  	"actief" boolean DEFAULT true,
  	"seizoen_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "producten_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"allergenen_id" integer
  );
  
  CREATE TABLE "recepten_ingredienten" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ingredient_id" integer NOT NULL,
  	"hoeveelheid" numeric NOT NULL,
  	"eenheid" "enum_recepten_ingredienten_eenheid" NOT NULL
  );
  
  CREATE TABLE "recepten" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"basis_porties" numeric NOT NULL,
  	"hoeveelheid_per_persoon" numeric NOT NULL,
  	"eenheid" "enum_recepten_eenheid" NOT NULL,
  	"bereidingswijze" varchar,
  	"kooktijd_minuten" numeric,
  	"keukenstation" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ingredienten" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"inkoopeenheid" "enum_ingredienten_inkoopeenheid" NOT NULL,
  	"inkoopprijs" numeric NOT NULL,
  	"leverancier_id" integer,
  	"houdbaarheid_dagen" numeric,
  	"voorraad" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ingredienten_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"allergenen_id" integer
  );
  
  CREATE TABLE "allergenen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"wettelijke_code" varchar NOT NULL,
  	"icoon_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "btw_tarieven" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"percentage" numeric NOT NULL,
  	"standaard" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categorieen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"volgorde" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "seizoenen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "leveranciers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"contactpersoon" varchar,
  	"email" varchar,
  	"telefoon" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt_tekst" varchar NOT NULL,
  	"volgorde" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_foodbook_card_url" varchar,
  	"sizes_foodbook_card_width" numeric,
  	"sizes_foodbook_card_height" numeric,
  	"sizes_foodbook_card_mime_type" varchar,
  	"sizes_foodbook_card_filesize" numeric,
  	"sizes_foodbook_card_filename" varchar,
  	"sizes_foodbook_hero_url" varchar,
  	"sizes_foodbook_hero_width" numeric,
  	"sizes_foodbook_hero_height" numeric,
  	"sizes_foodbook_hero_mime_type" varchar,
  	"sizes_foodbook_hero_filesize" numeric,
  	"sizes_foodbook_hero_filename" varchar,
  	"sizes_print_url" varchar,
  	"sizes_print_width" numeric,
  	"sizes_print_height" numeric,
  	"sizes_print_mime_type" varchar,
  	"sizes_print_filesize" numeric,
  	"sizes_print_filename" varchar
  );
  
  CREATE TABLE "klanten" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"contactpersoon" varchar,
  	"email" varchar,
  	"telefoon" varchar,
  	"adres_straat" varchar,
  	"adres_huisnummer" varchar,
  	"adres_postcode" varchar,
  	"adres_plaats" varchar,
  	"adres_land" varchar DEFAULT 'Nederland',
  	"factuuradres_straat" varchar,
  	"factuuradres_huisnummer" varchar,
  	"factuuradres_postcode" varchar,
  	"factuuradres_plaats" varchar,
  	"factuuradres_land" varchar DEFAULT 'Nederland',
  	"btw_nummer" varchar,
  	"notities" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "evenementen_producten" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"aantal_gasten_override" numeric,
  	"hoeveelheid_per_persoon_override" numeric
  );
  
  CREATE TABLE "evenementen_materialen" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"materiaal_id" integer NOT NULL,
  	"aantal" numeric NOT NULL
  );
  
  CREATE TABLE "evenementen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"klant_id" integer NOT NULL,
  	"titel" varchar NOT NULL,
  	"datum" timestamp(3) with time zone NOT NULL,
  	"locatie" varchar,
  	"aantal_gasten" numeric NOT NULL,
  	"status" "enum_evenementen_status" DEFAULT 'concept' NOT NULL,
  	"notities" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "materialen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"eenheid" "enum_materialen_eenheid" NOT NULL,
  	"voorraad_beheerd" boolean DEFAULT false,
  	"voorraad" numeric,
  	"huurprijs" numeric,
  	"kostprijs" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "offertes_regels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product" varchar,
  	"product_naam" varchar,
  	"aantal_gasten" numeric,
  	"hoeveelheid_per_persoon" numeric,
  	"eenheid" varchar,
  	"prijs_per_persoon" numeric,
  	"btw_tarief" varchar,
  	"btw_percentage" numeric,
  	"regel_totaal_excl" numeric,
  	"btw_bedrag" numeric,
  	"regel_totaal_incl" numeric
  );
  
  CREATE TABLE "offertes_btw_uitsplitsing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"btw_tarief" varchar,
  	"naam" varchar,
  	"percentage" numeric,
  	"grondslag" numeric,
  	"btw_bedrag" numeric
  );
  
  CREATE TABLE "offertes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"versie" numeric DEFAULT 1 NOT NULL,
  	"subtotaal" numeric,
  	"btw_totaal" numeric,
  	"totaal" numeric,
  	"status" "enum_offertes_status" DEFAULT 'concept' NOT NULL,
  	"geldig_tot" timestamp(3) with time zone NOT NULL,
  	"notities" varchar,
  	"pdf_bestand_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"offerte_id" integer NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'bevestigd' NOT NULL,
  	"bevestigingsdatum" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "facturen_regels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"omschrijving" varchar,
  	"aantal" numeric,
  	"eenheidsprijs" numeric,
  	"btw_tarief" varchar,
  	"btw_percentage" numeric,
  	"regel_totaal_excl" numeric,
  	"btw_bedrag" numeric,
  	"regel_totaal_incl" numeric
  );
  
  CREATE TABLE "facturen_btw_uitsplitsing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"btw_tarief" varchar,
  	"naam" varchar,
  	"percentage" numeric,
  	"grondslag" numeric,
  	"btw_bedrag" numeric
  );
  
  CREATE TABLE "facturen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"factuurnummer" varchar NOT NULL,
  	"factuurdatum" timestamp(3) with time zone NOT NULL,
  	"vervaldatum" timestamp(3) with time zone NOT NULL,
  	"subtotaal" numeric,
  	"btw_totaal" numeric,
  	"totaal" numeric,
  	"status" "enum_facturen_status" DEFAULT 'concept' NOT NULL,
  	"credit_van_id" integer,
  	"pdf_bestand_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "producties_regels_ingredienten" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ingredient" varchar,
  	"naam" varchar,
  	"hoeveelheid" numeric,
  	"basis_eenheid" varchar,
  	"kostprijs" numeric
  );
  
  CREATE TABLE "producties_regels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product" varchar,
  	"product_naam" varchar,
  	"recept" varchar,
  	"recept_naam" varchar,
  	"keukenstation" varchar,
  	"aantal_gasten" numeric,
  	"hoeveelheid_per_persoon" numeric,
  	"eenheid" varchar,
  	"product_hoeveelheid" numeric,
  	"kostprijs" numeric
  );
  
  CREATE TABLE "producties" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"keukenlijst_notities" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inkopen_regels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ingredient" varchar,
  	"naam" varchar,
  	"hoeveelheid" numeric,
  	"inkoop_eenheid" varchar,
  	"eenheidsprijs" numeric,
  	"kostprijs" numeric,
  	"leverancier" varchar,
  	"leverancier_naam" varchar
  );
  
  CREATE TABLE "inkopen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"periode_van" timestamp(3) with time zone NOT NULL,
  	"periode_tot" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inkopen_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pickings_regels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"soort" "enum_pickings_regels_soort" NOT NULL,
  	"referentie" varchar,
  	"omschrijving" varchar,
  	"hoeveelheid" numeric,
  	"eenheid" varchar,
  	"afgevinkt" boolean DEFAULT false
  );
  
  CREATE TABLE "pickings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"status" "enum_pickings_status" DEFAULT 'open' NOT NULL,
  	"afgevinkt_door_id" integer,
  	"afgevinkt_op" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "leveringen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"leverdatum" timestamp(3) with time zone NOT NULL,
  	"levertijd" varchar NOT NULL,
  	"adres_straat" varchar,
  	"adres_huisnummer" varchar,
  	"adres_postcode" varchar,
  	"adres_plaats" varchar,
  	"adres_land" varchar DEFAULT 'Nederland',
  	"verantwoordelijke" varchar,
  	"status" "enum_leveringen_status" DEFAULT 'gepland' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "gebruikers_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "gebruikers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"rol" "enum_gebruikers_rol" DEFAULT 'verkoop' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "verzendlog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"document_type" "enum_verzendlog_document_type" NOT NULL,
  	"ontvanger" varchar NOT NULL,
  	"onderwerp" varchar NOT NULL,
  	"verzonden_op" timestamp(3) with time zone NOT NULL,
  	"verzonden_door_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"producten_id" integer,
  	"recepten_id" integer,
  	"ingredienten_id" integer,
  	"allergenen_id" integer,
  	"btw_tarieven_id" integer,
  	"categorieen_id" integer,
  	"seizoenen_id" integer,
  	"leveranciers_id" integer,
  	"media_id" integer,
  	"klanten_id" integer,
  	"evenementen_id" integer,
  	"materialen_id" integer,
  	"offertes_id" integer,
  	"orders_id" integer,
  	"facturen_id" integer,
  	"producties_id" integer,
  	"inkopen_id" integer,
  	"pickings_id" integer,
  	"leveringen_id" integer,
  	"gebruikers_id" integer,
  	"verzendlog_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"gebruikers_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bedrijfsinstellingen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"naam" varchar NOT NULL,
  	"logo_id" integer,
  	"kvk_nummer" varchar NOT NULL,
  	"btw_nummer" varchar NOT NULL,
  	"iban" varchar NOT NULL,
  	"adres_straat" varchar,
  	"adres_huisnummer" varchar,
  	"adres_postcode" varchar,
  	"adres_plaats" varchar,
  	"adres_land" varchar DEFAULT 'Nederland',
  	"email" varchar NOT NULL,
  	"telefoon" varchar,
  	"primaire_kleur" varchar DEFAULT '#2f6564' NOT NULL,
  	"secundaire_kleur" varchar DEFAULT '#c5a55a' NOT NULL,
  	"standaard_voettekst" varchar NOT NULL,
  	"betalingstermijn_dagen" numeric DEFAULT 30 NOT NULL,
  	"offerte_geldigheid_dagen" numeric DEFAULT 30 NOT NULL,
  	"factuur_prefix" varchar DEFAULT 'F' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "producten_materialen" ADD CONSTRAINT "producten_materialen_materiaal_id_materialen_id_fk" FOREIGN KEY ("materiaal_id") REFERENCES "public"."materialen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "producten_materialen" ADD CONSTRAINT "producten_materialen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."producten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "producten" ADD CONSTRAINT "producten_categorie_id_categorieen_id_fk" FOREIGN KEY ("categorie_id") REFERENCES "public"."categorieen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "producten" ADD CONSTRAINT "producten_hoofdfoto_id_media_id_fk" FOREIGN KEY ("hoofdfoto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "producten" ADD CONSTRAINT "producten_recept_id_recepten_id_fk" FOREIGN KEY ("recept_id") REFERENCES "public"."recepten"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "producten" ADD CONSTRAINT "producten_btw_tarief_id_btw_tarieven_id_fk" FOREIGN KEY ("btw_tarief_id") REFERENCES "public"."btw_tarieven"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "producten" ADD CONSTRAINT "producten_seizoen_id_seizoenen_id_fk" FOREIGN KEY ("seizoen_id") REFERENCES "public"."seizoenen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "producten_rels" ADD CONSTRAINT "producten_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."producten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "producten_rels" ADD CONSTRAINT "producten_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "producten_rels" ADD CONSTRAINT "producten_rels_allergenen_fk" FOREIGN KEY ("allergenen_id") REFERENCES "public"."allergenen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recepten_ingredienten" ADD CONSTRAINT "recepten_ingredienten_ingredient_id_ingredienten_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredienten"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recepten_ingredienten" ADD CONSTRAINT "recepten_ingredienten_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recepten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ingredienten" ADD CONSTRAINT "ingredienten_leverancier_id_leveranciers_id_fk" FOREIGN KEY ("leverancier_id") REFERENCES "public"."leveranciers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ingredienten_rels" ADD CONSTRAINT "ingredienten_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ingredienten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ingredienten_rels" ADD CONSTRAINT "ingredienten_rels_allergenen_fk" FOREIGN KEY ("allergenen_id") REFERENCES "public"."allergenen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "allergenen" ADD CONSTRAINT "allergenen_icoon_id_media_id_fk" FOREIGN KEY ("icoon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evenementen_producten" ADD CONSTRAINT "evenementen_producten_product_id_producten_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."producten"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evenementen_producten" ADD CONSTRAINT "evenementen_producten_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."evenementen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "evenementen_materialen" ADD CONSTRAINT "evenementen_materialen_materiaal_id_materialen_id_fk" FOREIGN KEY ("materiaal_id") REFERENCES "public"."materialen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evenementen_materialen" ADD CONSTRAINT "evenementen_materialen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."evenementen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "evenementen" ADD CONSTRAINT "evenementen_klant_id_klanten_id_fk" FOREIGN KEY ("klant_id") REFERENCES "public"."klanten"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offertes_regels" ADD CONSTRAINT "offertes_regels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offertes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offertes_btw_uitsplitsing" ADD CONSTRAINT "offertes_btw_uitsplitsing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offertes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offertes" ADD CONSTRAINT "offertes_event_id_evenementen_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."evenementen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offertes" ADD CONSTRAINT "offertes_pdf_bestand_id_media_id_fk" FOREIGN KEY ("pdf_bestand_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_evenementen_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."evenementen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_offerte_id_offertes_id_fk" FOREIGN KEY ("offerte_id") REFERENCES "public"."offertes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "facturen_regels" ADD CONSTRAINT "facturen_regels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."facturen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "facturen_btw_uitsplitsing" ADD CONSTRAINT "facturen_btw_uitsplitsing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."facturen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "facturen" ADD CONSTRAINT "facturen_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "facturen" ADD CONSTRAINT "facturen_credit_van_id_facturen_id_fk" FOREIGN KEY ("credit_van_id") REFERENCES "public"."facturen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "facturen" ADD CONSTRAINT "facturen_pdf_bestand_id_media_id_fk" FOREIGN KEY ("pdf_bestand_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "producties_regels_ingredienten" ADD CONSTRAINT "producties_regels_ingredienten_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."producties_regels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "producties_regels" ADD CONSTRAINT "producties_regels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."producties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "producties" ADD CONSTRAINT "producties_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inkopen_regels" ADD CONSTRAINT "inkopen_regels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inkopen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inkopen_texts" ADD CONSTRAINT "inkopen_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."inkopen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pickings_regels" ADD CONSTRAINT "pickings_regels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pickings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pickings" ADD CONSTRAINT "pickings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pickings" ADD CONSTRAINT "pickings_afgevinkt_door_id_gebruikers_id_fk" FOREIGN KEY ("afgevinkt_door_id") REFERENCES "public"."gebruikers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leveringen" ADD CONSTRAINT "leveringen_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gebruikers_sessions" ADD CONSTRAINT "gebruikers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gebruikers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verzendlog" ADD CONSTRAINT "verzendlog_event_id_evenementen_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."evenementen"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verzendlog" ADD CONSTRAINT "verzendlog_verzonden_door_id_gebruikers_id_fk" FOREIGN KEY ("verzonden_door_id") REFERENCES "public"."gebruikers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_producten_fk" FOREIGN KEY ("producten_id") REFERENCES "public"."producten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_recepten_fk" FOREIGN KEY ("recepten_id") REFERENCES "public"."recepten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ingredienten_fk" FOREIGN KEY ("ingredienten_id") REFERENCES "public"."ingredienten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_allergenen_fk" FOREIGN KEY ("allergenen_id") REFERENCES "public"."allergenen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_btw_tarieven_fk" FOREIGN KEY ("btw_tarieven_id") REFERENCES "public"."btw_tarieven"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categorieen_fk" FOREIGN KEY ("categorieen_id") REFERENCES "public"."categorieen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seizoenen_fk" FOREIGN KEY ("seizoenen_id") REFERENCES "public"."seizoenen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leveranciers_fk" FOREIGN KEY ("leveranciers_id") REFERENCES "public"."leveranciers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_klanten_fk" FOREIGN KEY ("klanten_id") REFERENCES "public"."klanten"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_evenementen_fk" FOREIGN KEY ("evenementen_id") REFERENCES "public"."evenementen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materialen_fk" FOREIGN KEY ("materialen_id") REFERENCES "public"."materialen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offertes_fk" FOREIGN KEY ("offertes_id") REFERENCES "public"."offertes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_facturen_fk" FOREIGN KEY ("facturen_id") REFERENCES "public"."facturen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_producties_fk" FOREIGN KEY ("producties_id") REFERENCES "public"."producties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inkopen_fk" FOREIGN KEY ("inkopen_id") REFERENCES "public"."inkopen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pickings_fk" FOREIGN KEY ("pickings_id") REFERENCES "public"."pickings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leveringen_fk" FOREIGN KEY ("leveringen_id") REFERENCES "public"."leveringen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gebruikers_fk" FOREIGN KEY ("gebruikers_id") REFERENCES "public"."gebruikers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_verzendlog_fk" FOREIGN KEY ("verzendlog_id") REFERENCES "public"."verzendlog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_gebruikers_fk" FOREIGN KEY ("gebruikers_id") REFERENCES "public"."gebruikers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bedrijfsinstellingen" ADD CONSTRAINT "bedrijfsinstellingen_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "producten_materialen_order_idx" ON "producten_materialen" USING btree ("_order");
  CREATE INDEX "producten_materialen_parent_id_idx" ON "producten_materialen" USING btree ("_parent_id");
  CREATE INDEX "producten_materialen_materiaal_idx" ON "producten_materialen" USING btree ("materiaal_id");
  CREATE INDEX "producten_naam_idx" ON "producten" USING btree ("naam");
  CREATE INDEX "producten_categorie_idx" ON "producten" USING btree ("categorie_id");
  CREATE INDEX "producten_hoofdfoto_idx" ON "producten" USING btree ("hoofdfoto_id");
  CREATE INDEX "producten_recept_idx" ON "producten" USING btree ("recept_id");
  CREATE INDEX "producten_btw_tarief_idx" ON "producten" USING btree ("btw_tarief_id");
  CREATE INDEX "producten_seizoen_idx" ON "producten" USING btree ("seizoen_id");
  CREATE INDEX "producten_updated_at_idx" ON "producten" USING btree ("updated_at");
  CREATE INDEX "producten_created_at_idx" ON "producten" USING btree ("created_at");
  CREATE INDEX "producten_rels_order_idx" ON "producten_rels" USING btree ("order");
  CREATE INDEX "producten_rels_parent_idx" ON "producten_rels" USING btree ("parent_id");
  CREATE INDEX "producten_rels_path_idx" ON "producten_rels" USING btree ("path");
  CREATE INDEX "producten_rels_media_id_idx" ON "producten_rels" USING btree ("media_id");
  CREATE INDEX "producten_rels_allergenen_id_idx" ON "producten_rels" USING btree ("allergenen_id");
  CREATE INDEX "recepten_ingredienten_order_idx" ON "recepten_ingredienten" USING btree ("_order");
  CREATE INDEX "recepten_ingredienten_parent_id_idx" ON "recepten_ingredienten" USING btree ("_parent_id");
  CREATE INDEX "recepten_ingredienten_ingredient_idx" ON "recepten_ingredienten" USING btree ("ingredient_id");
  CREATE INDEX "recepten_updated_at_idx" ON "recepten" USING btree ("updated_at");
  CREATE INDEX "recepten_created_at_idx" ON "recepten" USING btree ("created_at");
  CREATE INDEX "ingredienten_naam_idx" ON "ingredienten" USING btree ("naam");
  CREATE INDEX "ingredienten_leverancier_idx" ON "ingredienten" USING btree ("leverancier_id");
  CREATE INDEX "ingredienten_updated_at_idx" ON "ingredienten" USING btree ("updated_at");
  CREATE INDEX "ingredienten_created_at_idx" ON "ingredienten" USING btree ("created_at");
  CREATE INDEX "ingredienten_rels_order_idx" ON "ingredienten_rels" USING btree ("order");
  CREATE INDEX "ingredienten_rels_parent_idx" ON "ingredienten_rels" USING btree ("parent_id");
  CREATE INDEX "ingredienten_rels_path_idx" ON "ingredienten_rels" USING btree ("path");
  CREATE INDEX "ingredienten_rels_allergenen_id_idx" ON "ingredienten_rels" USING btree ("allergenen_id");
  CREATE UNIQUE INDEX "allergenen_wettelijke_code_idx" ON "allergenen" USING btree ("wettelijke_code");
  CREATE INDEX "allergenen_icoon_idx" ON "allergenen" USING btree ("icoon_id");
  CREATE INDEX "allergenen_updated_at_idx" ON "allergenen" USING btree ("updated_at");
  CREATE INDEX "allergenen_created_at_idx" ON "allergenen" USING btree ("created_at");
  CREATE INDEX "btw_tarieven_updated_at_idx" ON "btw_tarieven" USING btree ("updated_at");
  CREATE INDEX "btw_tarieven_created_at_idx" ON "btw_tarieven" USING btree ("created_at");
  CREATE INDEX "categorieen_updated_at_idx" ON "categorieen" USING btree ("updated_at");
  CREATE INDEX "categorieen_created_at_idx" ON "categorieen" USING btree ("created_at");
  CREATE INDEX "seizoenen_updated_at_idx" ON "seizoenen" USING btree ("updated_at");
  CREATE INDEX "seizoenen_created_at_idx" ON "seizoenen" USING btree ("created_at");
  CREATE INDEX "leveranciers_updated_at_idx" ON "leveranciers" USING btree ("updated_at");
  CREATE INDEX "leveranciers_created_at_idx" ON "leveranciers" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_foodbook_card_sizes_foodbook_card_filename_idx" ON "media" USING btree ("sizes_foodbook_card_filename");
  CREATE INDEX "media_sizes_foodbook_hero_sizes_foodbook_hero_filename_idx" ON "media" USING btree ("sizes_foodbook_hero_filename");
  CREATE INDEX "media_sizes_print_sizes_print_filename_idx" ON "media" USING btree ("sizes_print_filename");
  CREATE INDEX "klanten_naam_idx" ON "klanten" USING btree ("naam");
  CREATE INDEX "klanten_updated_at_idx" ON "klanten" USING btree ("updated_at");
  CREATE INDEX "klanten_created_at_idx" ON "klanten" USING btree ("created_at");
  CREATE INDEX "evenementen_producten_order_idx" ON "evenementen_producten" USING btree ("_order");
  CREATE INDEX "evenementen_producten_parent_id_idx" ON "evenementen_producten" USING btree ("_parent_id");
  CREATE INDEX "evenementen_producten_product_idx" ON "evenementen_producten" USING btree ("product_id");
  CREATE INDEX "evenementen_materialen_order_idx" ON "evenementen_materialen" USING btree ("_order");
  CREATE INDEX "evenementen_materialen_parent_id_idx" ON "evenementen_materialen" USING btree ("_parent_id");
  CREATE INDEX "evenementen_materialen_materiaal_idx" ON "evenementen_materialen" USING btree ("materiaal_id");
  CREATE INDEX "evenementen_klant_idx" ON "evenementen" USING btree ("klant_id");
  CREATE INDEX "evenementen_datum_idx" ON "evenementen" USING btree ("datum");
  CREATE INDEX "evenementen_status_idx" ON "evenementen" USING btree ("status");
  CREATE INDEX "evenementen_updated_at_idx" ON "evenementen" USING btree ("updated_at");
  CREATE INDEX "evenementen_created_at_idx" ON "evenementen" USING btree ("created_at");
  CREATE INDEX "materialen_updated_at_idx" ON "materialen" USING btree ("updated_at");
  CREATE INDEX "materialen_created_at_idx" ON "materialen" USING btree ("created_at");
  CREATE INDEX "offertes_regels_order_idx" ON "offertes_regels" USING btree ("_order");
  CREATE INDEX "offertes_regels_parent_id_idx" ON "offertes_regels" USING btree ("_parent_id");
  CREATE INDEX "offertes_btw_uitsplitsing_order_idx" ON "offertes_btw_uitsplitsing" USING btree ("_order");
  CREATE INDEX "offertes_btw_uitsplitsing_parent_id_idx" ON "offertes_btw_uitsplitsing" USING btree ("_parent_id");
  CREATE INDEX "offertes_event_idx" ON "offertes" USING btree ("event_id");
  CREATE INDEX "offertes_status_idx" ON "offertes" USING btree ("status");
  CREATE INDEX "offertes_pdf_bestand_idx" ON "offertes" USING btree ("pdf_bestand_id");
  CREATE INDEX "offertes_updated_at_idx" ON "offertes" USING btree ("updated_at");
  CREATE INDEX "offertes_created_at_idx" ON "offertes" USING btree ("created_at");
  CREATE INDEX "orders_event_idx" ON "orders" USING btree ("event_id");
  CREATE INDEX "orders_offerte_idx" ON "orders" USING btree ("offerte_id");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "facturen_regels_order_idx" ON "facturen_regels" USING btree ("_order");
  CREATE INDEX "facturen_regels_parent_id_idx" ON "facturen_regels" USING btree ("_parent_id");
  CREATE INDEX "facturen_btw_uitsplitsing_order_idx" ON "facturen_btw_uitsplitsing" USING btree ("_order");
  CREATE INDEX "facturen_btw_uitsplitsing_parent_id_idx" ON "facturen_btw_uitsplitsing" USING btree ("_parent_id");
  CREATE INDEX "facturen_order_idx" ON "facturen" USING btree ("order_id");
  CREATE UNIQUE INDEX "facturen_factuurnummer_idx" ON "facturen" USING btree ("factuurnummer");
  CREATE INDEX "facturen_status_idx" ON "facturen" USING btree ("status");
  CREATE INDEX "facturen_credit_van_idx" ON "facturen" USING btree ("credit_van_id");
  CREATE INDEX "facturen_pdf_bestand_idx" ON "facturen" USING btree ("pdf_bestand_id");
  CREATE INDEX "facturen_updated_at_idx" ON "facturen" USING btree ("updated_at");
  CREATE INDEX "facturen_created_at_idx" ON "facturen" USING btree ("created_at");
  CREATE INDEX "producties_regels_ingredienten_order_idx" ON "producties_regels_ingredienten" USING btree ("_order");
  CREATE INDEX "producties_regels_ingredienten_parent_id_idx" ON "producties_regels_ingredienten" USING btree ("_parent_id");
  CREATE INDEX "producties_regels_order_idx" ON "producties_regels" USING btree ("_order");
  CREATE INDEX "producties_regels_parent_id_idx" ON "producties_regels" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "producties_order_idx" ON "producties" USING btree ("order_id");
  CREATE INDEX "producties_updated_at_idx" ON "producties" USING btree ("updated_at");
  CREATE INDEX "producties_created_at_idx" ON "producties" USING btree ("created_at");
  CREATE INDEX "inkopen_regels_order_idx" ON "inkopen_regels" USING btree ("_order");
  CREATE INDEX "inkopen_regels_parent_id_idx" ON "inkopen_regels" USING btree ("_parent_id");
  CREATE INDEX "inkopen_periode_tot_idx" ON "inkopen" USING btree ("periode_tot");
  CREATE INDEX "inkopen_updated_at_idx" ON "inkopen" USING btree ("updated_at");
  CREATE INDEX "inkopen_created_at_idx" ON "inkopen" USING btree ("created_at");
  CREATE INDEX "inkopen_texts_order_parent" ON "inkopen_texts" USING btree ("order","parent_id");
  CREATE INDEX "pickings_regels_order_idx" ON "pickings_regels" USING btree ("_order");
  CREATE INDEX "pickings_regels_parent_id_idx" ON "pickings_regels" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pickings_order_idx" ON "pickings" USING btree ("order_id");
  CREATE INDEX "pickings_afgevinkt_door_idx" ON "pickings" USING btree ("afgevinkt_door_id");
  CREATE INDEX "pickings_updated_at_idx" ON "pickings" USING btree ("updated_at");
  CREATE INDEX "pickings_created_at_idx" ON "pickings" USING btree ("created_at");
  CREATE UNIQUE INDEX "leveringen_order_idx" ON "leveringen" USING btree ("order_id");
  CREATE INDEX "leveringen_status_idx" ON "leveringen" USING btree ("status");
  CREATE INDEX "leveringen_updated_at_idx" ON "leveringen" USING btree ("updated_at");
  CREATE INDEX "leveringen_created_at_idx" ON "leveringen" USING btree ("created_at");
  CREATE INDEX "gebruikers_sessions_order_idx" ON "gebruikers_sessions" USING btree ("_order");
  CREATE INDEX "gebruikers_sessions_parent_id_idx" ON "gebruikers_sessions" USING btree ("_parent_id");
  CREATE INDEX "gebruikers_updated_at_idx" ON "gebruikers" USING btree ("updated_at");
  CREATE INDEX "gebruikers_created_at_idx" ON "gebruikers" USING btree ("created_at");
  CREATE UNIQUE INDEX "gebruikers_email_idx" ON "gebruikers" USING btree ("email");
  CREATE INDEX "verzendlog_event_idx" ON "verzendlog" USING btree ("event_id");
  CREATE INDEX "verzendlog_verzonden_door_idx" ON "verzendlog" USING btree ("verzonden_door_id");
  CREATE INDEX "verzendlog_updated_at_idx" ON "verzendlog" USING btree ("updated_at");
  CREATE INDEX "verzendlog_created_at_idx" ON "verzendlog" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_producten_id_idx" ON "payload_locked_documents_rels" USING btree ("producten_id");
  CREATE INDEX "payload_locked_documents_rels_recepten_id_idx" ON "payload_locked_documents_rels" USING btree ("recepten_id");
  CREATE INDEX "payload_locked_documents_rels_ingredienten_id_idx" ON "payload_locked_documents_rels" USING btree ("ingredienten_id");
  CREATE INDEX "payload_locked_documents_rels_allergenen_id_idx" ON "payload_locked_documents_rels" USING btree ("allergenen_id");
  CREATE INDEX "payload_locked_documents_rels_btw_tarieven_id_idx" ON "payload_locked_documents_rels" USING btree ("btw_tarieven_id");
  CREATE INDEX "payload_locked_documents_rels_categorieen_id_idx" ON "payload_locked_documents_rels" USING btree ("categorieen_id");
  CREATE INDEX "payload_locked_documents_rels_seizoenen_id_idx" ON "payload_locked_documents_rels" USING btree ("seizoenen_id");
  CREATE INDEX "payload_locked_documents_rels_leveranciers_id_idx" ON "payload_locked_documents_rels" USING btree ("leveranciers_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_klanten_id_idx" ON "payload_locked_documents_rels" USING btree ("klanten_id");
  CREATE INDEX "payload_locked_documents_rels_evenementen_id_idx" ON "payload_locked_documents_rels" USING btree ("evenementen_id");
  CREATE INDEX "payload_locked_documents_rels_materialen_id_idx" ON "payload_locked_documents_rels" USING btree ("materialen_id");
  CREATE INDEX "payload_locked_documents_rels_offertes_id_idx" ON "payload_locked_documents_rels" USING btree ("offertes_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_facturen_id_idx" ON "payload_locked_documents_rels" USING btree ("facturen_id");
  CREATE INDEX "payload_locked_documents_rels_producties_id_idx" ON "payload_locked_documents_rels" USING btree ("producties_id");
  CREATE INDEX "payload_locked_documents_rels_inkopen_id_idx" ON "payload_locked_documents_rels" USING btree ("inkopen_id");
  CREATE INDEX "payload_locked_documents_rels_pickings_id_idx" ON "payload_locked_documents_rels" USING btree ("pickings_id");
  CREATE INDEX "payload_locked_documents_rels_leveringen_id_idx" ON "payload_locked_documents_rels" USING btree ("leveringen_id");
  CREATE INDEX "payload_locked_documents_rels_gebruikers_id_idx" ON "payload_locked_documents_rels" USING btree ("gebruikers_id");
  CREATE INDEX "payload_locked_documents_rels_verzendlog_id_idx" ON "payload_locked_documents_rels" USING btree ("verzendlog_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_gebruikers_id_idx" ON "payload_preferences_rels" USING btree ("gebruikers_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "bedrijfsinstellingen_logo_idx" ON "bedrijfsinstellingen" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "producten_materialen" CASCADE;
  DROP TABLE "producten" CASCADE;
  DROP TABLE "producten_rels" CASCADE;
  DROP TABLE "recepten_ingredienten" CASCADE;
  DROP TABLE "recepten" CASCADE;
  DROP TABLE "ingredienten" CASCADE;
  DROP TABLE "ingredienten_rels" CASCADE;
  DROP TABLE "allergenen" CASCADE;
  DROP TABLE "btw_tarieven" CASCADE;
  DROP TABLE "categorieen" CASCADE;
  DROP TABLE "seizoenen" CASCADE;
  DROP TABLE "leveranciers" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "klanten" CASCADE;
  DROP TABLE "evenementen_producten" CASCADE;
  DROP TABLE "evenementen_materialen" CASCADE;
  DROP TABLE "evenementen" CASCADE;
  DROP TABLE "materialen" CASCADE;
  DROP TABLE "offertes_regels" CASCADE;
  DROP TABLE "offertes_btw_uitsplitsing" CASCADE;
  DROP TABLE "offertes" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "facturen_regels" CASCADE;
  DROP TABLE "facturen_btw_uitsplitsing" CASCADE;
  DROP TABLE "facturen" CASCADE;
  DROP TABLE "producties_regels_ingredienten" CASCADE;
  DROP TABLE "producties_regels" CASCADE;
  DROP TABLE "producties" CASCADE;
  DROP TABLE "inkopen_regels" CASCADE;
  DROP TABLE "inkopen" CASCADE;
  DROP TABLE "inkopen_texts" CASCADE;
  DROP TABLE "pickings_regels" CASCADE;
  DROP TABLE "pickings" CASCADE;
  DROP TABLE "leveringen" CASCADE;
  DROP TABLE "gebruikers_sessions" CASCADE;
  DROP TABLE "gebruikers" CASCADE;
  DROP TABLE "verzendlog" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "bedrijfsinstellingen" CASCADE;
  DROP TYPE "public"."enum_producten_eenheid";
  DROP TYPE "public"."enum_recepten_ingredienten_eenheid";
  DROP TYPE "public"."enum_recepten_eenheid";
  DROP TYPE "public"."enum_ingredienten_inkoopeenheid";
  DROP TYPE "public"."enum_evenementen_status";
  DROP TYPE "public"."enum_materialen_eenheid";
  DROP TYPE "public"."enum_offertes_status";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_facturen_status";
  DROP TYPE "public"."enum_pickings_regels_soort";
  DROP TYPE "public"."enum_pickings_status";
  DROP TYPE "public"."enum_leveringen_status";
  DROP TYPE "public"."enum_gebruikers_rol";
  DROP TYPE "public"."enum_verzendlog_document_type";`)
}
