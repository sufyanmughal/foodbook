//! Tauri-shell rond de Foodbook-webapplicatie.
//!
//! De desktopversie is bewust een dunne schil: de volledige applicatie — Beheer (Payload) én
//! de Foodbook-presentatie — draait in de Next.js-server, en Tauri toont die in de
//! OS-webview. Daardoor is er één codebase voor web en desktop, en is een macOS-build later
//! een kwestie van hetzelfde project op een andere target bouwen (ARCHITECTURE.md §7).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("fout bij het starten van de Foodbook-applicatie");
}
