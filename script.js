// ==UserScript==
// @name        KhanBypass
// @namespace   mzzvxm
// @match       *://*.khanacademy.org/*
// @grant       none
// @version     2.8
// @author      mzzvxm
// @icon        https://cdn.kastatic.org/images/favicon.ico
// @description Bypass de UI do Khan Academy (logo spoof + auto-click)
// @run-at      document-start
// ==/UserScript==

(function () {
  "use strict";

  // ---------- Console seguro ----------
  const _warn = console.warn.bind(console);
  const _error = console.error.bind(console);
  const _log = console.log.bind(console);
  console.warn = (...a) => _warn("[KB]", ...a);
  console.error = (...a) => _error("[KB]", ...a);
  window.debug = () => {};

  // ---------- EventEmitter ----------
  class EventEmitter {
    constructor() { this.events = {}; }
    on(event, listener) {
      (Array.isArray(event) ? event : [event]).forEach((ev) => {
        (this.events[ev] = this.events[ev] || []).push(listener);
      });
    }
    off(event, listener) {
      (Array.isArray(event) ? event : [event]).forEach((ev) => {
        if (this.events[ev]) this.events[ev] = this.events[ev].filter((l) => l !== listener);
      });
    }
    emit(event, ...args) {
      this.events[event]?.forEach((fn) => {
        try { fn(...args); } catch (e) { _error("listener erro:", e); }
      });
    }
    once(event, listener) {
      const wrapper = (...args) => {
        try { listener(...args); } finally { this.off(event, wrapper); }
      };
      this.on(event, wrapper);
    }
  }
  const eventBus = new EventEmitter();

  // ---------- Helpers ----------
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // ---------- Toast (com fallback) ----------
  function notify(msg, time = 4000, gravity = "bottom") {
    if (typeof Toastify === "function") {
      try {
        Toastify({
          text: msg,
          duration: time,
          gravity,
          position: "center",
          stopOnFocus: true,
          style: {
            background: "linear-gradient(135deg, #72ff72, #00ff88)",
            color: "#000",
            fontWeight: "600",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(114, 255, 114, 0.3)",
          },
        }).showToast();
        return;
      } catch (_) { /* cai no fallback */ }
    }
    // Fallback sem Toastify
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      background: "#00ff88",
      color: "#000",
      padding: "10px 16px",
      borderRadius: "8px",
      fontWeight: "600",
      fontFamily: "system-ui, sans-serif",
      zIndex: 999999,
      boxShadow: "0 4px 20px rgba(0,0,0,.2)",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), time);
  }

  // ---------- Carregar Toastify uma vez ----------
  function ensureToastify() {
    if (typeof Toastify === "function" || document.getElementById("kb-toastify")) return;
    const link = document.createElement("link");
    link.id = "kb-toastify-css";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
    document.head?.appendChild(link);

    const s = document.createElement("script");
    s.id = "kb-toastify";
    s.src = "https://cdn.jsdelivr.net/npm/toastify-js";
    s.async = true;
    document.head?.appendChild(s);
  }

  // ---------- Logo spoof ----------
  const FONT_URL =
    "https://cdn.jsdelivr.net/gh/mzzvxm/KhanBypass@main/fonts/BrandonText-Bold.otf";

  function applyLogoSpoof() {
    if (!document.head) return;

    if (!document.getElementById("mzz-font-style")) {
      const fontStyle = document.createElement("style");
      fontStyle.id = "mzz-font-style";
      fontStyle.textContent = `
        @font-face {
          font-family: 'BrandonTextOfficeBold';
          src: url('${FONT_URL}') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(fontStyle);
    }

    // Seletor mais robusto: procura o logo dentro do header
    const svg =
      document.querySelector("header svg[aria-label]") ||
      document.querySelector("svg._1rt6g9t");
    if (!svg || svg.dataset.mzzSpoofed) return;

    let originalColor = "#444";
    const fillPath = svg.querySelector("path[fill]");
    if (fillPath) originalColor = fillPath.getAttribute("fill") || originalColor;

    // Esconde os paths originais sem apagar o SVG
    svg.querySelectorAll("path").forEach((p) => {
      p.style.visibility = "hidden";
    });

    const newText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    newText.textContent = "@MZZVXM";
    newText.setAttribute("x", "33");
    newText.setAttribute("y", "20");
    newText.setAttribute("font-family", '"BrandonTextOfficeBold", sans-serif');
    newText.setAttribute("font-weight", "normal");
    newText.setAttribute("font-size", "20px");
    newText.setAttribute("fill", originalColor);

    svg.appendChild(newText);
    svg.dataset.mzzSpoofed = "true";
  }

  // ---------- Auto-click ----------
  function clickButtonWithText(text) {
    const allButtons = document.querySelectorAll("button");
    for (const button of allButtons) {
      const direct = button.textContent?.trim();
      if (direct === text) {
        button.click();
        notify(`🚀 Botão "${text}" clicado!`, 1500);
        return true;
      }
      for (const span of button.querySelectorAll("span")) {
        if (span.textContent?.trim() === text) {
          button.click();
          notify(`🚀 Botão "${text}" clicado!`, 1500);
          return true;
        }
      }
    }
    return false;
  }

  // ---------- Observer com debounce ----------
  function startObserver() {
    if (!document.body) return setTimeout(startObserver, 50);

    let timer;
    new MutationObserver((changes) => {
      if (!changes.some((c) => c.type === "childList")) return;
      clearTimeout(timer);
      timer = setTimeout(() => eventBus.emit("domChanged"), 80);
    }).observe(document.body, { childList: true, subtree: true });

    eventBus.emit("domChanged");
  }

  eventBus.on("domChanged", () => {
    ensureToastify();
    applyLogoSpoof();
  });

  // ---------- Boot ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }

  // Expõe API global (opcional, útil pra debug manual)
  window.KhanBypass = { notify, clickButtonWithText, eventBus };
})();
