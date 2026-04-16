/**
 * WRGSMK — Webflow Inline Backup: HOME PAGE (Head Custom Code)
 * Captured: 2026-04-16 from https://www.wuergsamkeiten.com/
 *
 * NOTE: This file contains all inline scripts from the <head> of the home page.
 * Some are site-wide (analytics, fonts), some are home-only (CircleType, contextmenu).
 */

// === SITE-WIDE: WebFont Loader ===
WebFont.load({  google: {    families: ["Inconsolata:400,700","Amarante:300,400,500,600,700","Anton:300,400,500,600,700","Funnel Display:300,400,500,600,700","Major Mono Display:300,400,500,600,700"]  }});

// === SITE-WIDE: Webflow mod detection ===
!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);

// === SITE-WIDE: GA4 ===
window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('set', 'developer_id.dZGVlNj', true);gtag('js', new Date());gtag('config', 'G-HFC20SQHTW');

// === HOME-ONLY: CircleType Init ===
function initCircle() {
  const el = document.getElementById("circletext");
  if (el && window.CircleType) {
    new CircleType(el);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCircle);
} else {
  initCircle();
}
window.addEventListener("pageshow", initCircle);

// === HOME-ONLY: Rechtsklick-Blocker ===
document.addEventListener("contextmenu", function(e){
  e.preventDefault();
}, false);

// === SITE-WIDE: Webflow Currency Settings ===
window.__WEBFLOW_CURRENCY_SETTINGS = {"currencyCode":"EUR","symbol":"€","decimal":",","fractionDigits":2,"group":".","template":"{{wf {\"path\":\"symbol\",\"type\":\"PlainText\"} }} {{wf {\"path\":\"amount\",\"type\":\"CommercePrice\"} }} {{wf {\"path\":\"currencyCode\",\"type\":\"PlainText\"} }}","hideDecimalForWholeNumbers":false};
