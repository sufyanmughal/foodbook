/*
 * Inlogscherm — overgenomen uit foodbook-design/login.html.
 *
 * De opmaak staat hier als tekenreeks in plaats van in een css-bestand, zodat de klasse­namen
 * gegarandeerd niet botsen met het designsysteem in app.css. Alles is met `lg-` geprefixt.
 *
 * De waarden zijn één op één uit het ontwerp overgenomen: dezelfde verhoudingen, dezelfde
 * fotostrook, dezelfde duotoon-laag.
 */

export const INLOG_STIJL = `
.lg-screen {
  display: grid;
  grid-template-columns: 1fr 480px;
  min-height: 100vh;
}

/* ===== BEELDZIJDE ===== */
.lg-visual {
  position: relative;
  overflow: hidden;
  background: var(--kt-teal-900);
  display: flex;
  flex-direction: column;
}

.lg-photo-strip {
  position: absolute; inset: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
  z-index: 0;
}
.lg-strip-col { position: relative; overflow: hidden; display: flex; flex-direction: column; }
.lg-strip-col img {
  width: 100%; height: 112%; object-fit: cover; display: block;
  filter: saturate(0.82) contrast(1.03) brightness(0.78);
}
.lg-strip-col.lg-up img { object-position: center 18%; transform: translateY(-6%); }
.lg-strip-col.lg-down img { object-position: center 60%; transform: translateY(2%); }
.lg-strip-col.lg-mid img { object-position: center 40%; }

.lg-strip-duotone {
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(31,61,52,0.55) 0%, rgba(21,48,42,0.72) 100%);
  mix-blend-mode: multiply;
}
.lg-strip-grain {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.4;
}
.lg-visual-scrim {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(15,25,20,0.72) 0%, rgba(15,25,20,0.22) 22%, rgba(15,25,20,0.28) 55%, rgba(12,22,18,0.88) 100%);
  z-index: 1;
}
.lg-visual-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 60% at 30% 40%, transparent 40%, rgba(10,18,15,0.55) 100%);
  z-index: 1;
}

.lg-lighthouse {
  position: absolute; left: 9%; bottom: 22%;
  width: 22px; height: 128px; z-index: 2;
  opacity: 0.92;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.45));
}

.lg-visual-topbar {
  position: relative; z-index: 3;
  display: flex; align-items: center; gap: 10px;
  padding: 44px 48px 0;
}
.lg-visual-topbar svg { width: 30px; height: 19px; opacity: 0.95; }
.lg-visual-brand {
  font-family: var(--kt-serif);
  font-size: 21px; letter-spacing: 2.5px; font-weight: 600; color: #fff;
}
.lg-visual-brand span {
  display: block; font-size: 9.5px; letter-spacing: 4px;
  font-family: var(--kt-sans); font-weight: 600; color: #f0e9d8; margin-top: 3px;
}

.lg-visual-copy {
  position: relative; z-index: 3;
  padding: 0 48px;
  margin-top: auto;
  margin-bottom: 64px;
}
.lg-eyebrow {
  font-size: 11px; letter-spacing: 4px; font-weight: 600; color: #f3ead9; margin-bottom: 18px;
  display: flex; gap: 16px;
}
.lg-eyebrow span { position: relative; padding-left: 16px; }
.lg-eyebrow span::before {
  content: ""; position: absolute; left: 0; top: 50%;
  width: 8px; height: 1px; background: rgba(255,255,255,0.5);
}
.lg-eyebrow span:first-child { padding-left: 0; }
.lg-eyebrow span:first-child::before { display: none; }

.lg-visual-title {
  font-family: var(--kt-serif);
  font-size: 44px; font-weight: 600; color: #fff; line-height: 1.15;
  text-shadow: 0 2px 24px rgba(0,0,0,0.4);
  max-width: 460px;
  margin: 0;
}
.lg-visual-script {
  font-family: var(--kt-serif); font-style: italic;
  font-size: 17px; color: #f3ead9; margin-top: 16px; line-height: 1.5;
  text-shadow: 0 1px 10px rgba(0,0,0,0.4);
}

.lg-visual-foot {
  position: relative; z-index: 3;
  display: flex; align-items: center; justify-content: space-between;
  margin: 0 48px;
  padding: 22px 0 40px;
  border-top: 1px solid rgba(255,255,255,0.2);
}
.lg-foot-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; letter-spacing: 1.5px; font-weight: 600; color: #f0e9d8;
}
.lg-foot-item svg { width: 15px; height: 15px; opacity: 0.85; }

/* ===== FORMULIERZIJDE ===== */
.lg-form-side {
  background: var(--kt-papier);
  display: flex; flex-direction: column;
  padding: 48px 56px;
  position: relative;
}
.lg-form-wrap { margin: auto 0; width: 100%; max-width: 360px; }

.lg-form-eyebrow {
  font-size: 11px; letter-spacing: 3px; font-weight: 700;
  color: var(--kt-teal-700); margin-bottom: 10px;
}
.lg-form-title {
  font-family: var(--kt-serif);
  font-size: 30px; font-weight: 600; color: var(--kt-tekst); line-height: 1.2;
  margin: 0 0 8px;
}
.lg-form-sub {
  font-size: 14px; color: var(--kt-tekst-gedempt); line-height: 1.5; margin: 0 0 32px;
}

.lg-field { margin-bottom: 18px; }
.lg-field label {
  display: block; font-size: 12.5px; font-weight: 600; color: var(--kt-tekst);
  margin-bottom: 7px; letter-spacing: 0.2px;
}
.lg-input-shell { position: relative; display: flex; align-items: center; }
.lg-input-shell > svg:first-child {
  position: absolute; left: 14px; width: 17px; height: 17px;
  color: var(--kt-tekst-gedempt); pointer-events: none;
}
.lg-input-shell input {
  width: 100%;
  padding: 13px 44px 13px 42px;
  border: 1px solid var(--kt-rand);
  border-radius: 10px;
  background: var(--kt-oppervlak);
  font-size: 14px; color: var(--kt-tekst);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.lg-input-shell input::placeholder { color: #a8a99c; }
.lg-input-shell input:focus {
  outline: none;
  border-color: var(--kt-teal-500);
  box-shadow: 0 0 0 3px rgba(124,154,142,0.18);
}
.lg-toggle {
  position: absolute; right: 8px;
  width: 30px; height: 30px; border: none; background: transparent;
  display: flex; align-items: center; justify-content: center;
  color: var(--kt-tekst-gedempt); border-radius: 6px; cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.lg-toggle:hover { background: var(--kt-oppervlak-2); color: var(--kt-tekst); }
.lg-toggle svg { width: 17px; height: 17px; }

.lg-field-error {
  display: flex; align-items: center; gap: 6px;
  margin-top: 7px; font-size: 12px; color: var(--kt-gevaar); font-weight: 500;
}
.lg-field-error svg { width: 13px; height: 13px; flex-shrink: 0; }

.lg-row-between {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 26px; margin-top: -2px;
}
.lg-checkbox-row { display: flex; align-items: center; gap: 8px; }
.lg-checkbox-row input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: var(--kt-teal-800); cursor: pointer;
}
.lg-checkbox-row label { font-size: 13px; color: var(--kt-tekst-gedempt); cursor: pointer; }
.lg-link-muted { font-size: 13px; font-weight: 600; color: var(--kt-teal-700); }
.lg-link-muted:hover { text-decoration: underline; }

.lg-melding {
  display: flex; align-items: flex-start; gap: 8px;
  background: var(--kt-gevaar-100);
  border: 1px solid rgba(168, 50, 44, 0.25);
  border-radius: 10px;
  color: var(--kt-gevaar);
  font-size: 13px; font-weight: 500; line-height: 1.45;
  padding: 11px 13px;
  margin-bottom: 20px;
}
.lg-melding svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 2px; }

.lg-btn-primary {
  width: 100%;
  background: var(--kt-teal-900);
  color: #fff;
  border: none; border-radius: 10px;
  padding: 14px;
  font-family: inherit;
  font-size: 14px; font-weight: 700; letter-spacing: 0.3px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 8px 20px rgba(21,48,42,0.25);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.lg-btn-primary svg { width: 14px; height: 14px; transition: transform 0.15s ease; }
.lg-btn-primary:hover:not(:disabled) {
  background: var(--kt-teal-800);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(21,48,42,0.3);
}
.lg-btn-primary:hover:not(:disabled) svg { transform: translateX(3px); }
.lg-btn-primary:active:not(:disabled) { transform: translateY(0); }
.lg-btn-primary:disabled { cursor: progress; opacity: 0.75; }

.lg-divider {
  display: flex; align-items: center; gap: 14px;
  margin: 26px 0;
  font-size: 11.5px; color: var(--kt-tekst-gedempt); letter-spacing: 0.5px;
}
.lg-divider::before, .lg-divider::after { content: ""; flex: 1; height: 1px; background: var(--kt-rand); }

.lg-btn-secondary {
  width: 100%;
  background: var(--kt-oppervlak);
  color: var(--kt-tekst);
  border: 1px solid var(--kt-rand);
  border-radius: 10px;
  padding: 12.5px;
  font-family: inherit;
  font-size: 13.5px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.lg-btn-secondary:hover:not(:disabled) { border-color: var(--kt-teal-500); background: #fff; }
.lg-btn-secondary:disabled { cursor: progress; opacity: 0.75; }
.lg-btn-secondary svg { width: 17px; height: 17px; }

.lg-form-legal {
  margin-top: 36px;
  font-size: 11px; color: #9aa198; line-height: 1.6; text-align: center;
}

@media (max-width: 920px) {
  .lg-screen { grid-template-columns: 1fr; }
  .lg-visual { min-height: 340px; }
  .lg-visual-copy { margin-bottom: 32px; }
  .lg-visual-title { font-size: 30px; }
  .lg-visual-foot { flex-wrap: wrap; gap: 10px; }
  .lg-form-side { padding: 40px 28px; }
  .lg-lighthouse { display: none; }
}
`;
