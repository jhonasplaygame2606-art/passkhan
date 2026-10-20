// ==UserScript==
// @name        KhanBypass
// @namespace   mzzvxm
// @match       *://*.khanacademy.org/*
// @grant       none
// @version     3.0
// @author      mzzvxm (editado por você)
// @description Bypass de UI + Auto-complete de exercícios
// @run-at      document-start
// ==/UserScript==

(function () {
  "use strict";

  // ---------- Console seguro ----------
  const _warn = console.warn.bind(console);
  const _error = console.error.bind(console);
  console.warn = (...a) => _warn("[KB]", ...a);
  console.error = (...a) => _error("[KB]", ...a);

  // ---------- 1. Lógica de marcar como feito (O "Código Central") ----------
  // Isso intercepta o envio de respostas de exercícios para o servidor do Khan
  const og_stringify = JSON.stringify;
  JSON.stringify = (obj) => {
    try {
      if (obj && obj.operationName == "attemptProblem") {
        // Força o Khan a achar que você acertou a questão
        if (obj.variables && obj.variables.input) {
          obj.variables.input.completed = true;
        }
      }
    } catch (e) {
      // Se der erro, apenas ignora para não quebrar o site
    }
    return og_stringify(obj);
  };

  // ---------- 2. EventEmitter ----------
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
  }
  const eventBus = new EventEmitter();

  // ---------- 3. Notificações (Toastify) ----------
  function notify(msg, time = 4000) {
    if (typeof Toastify === "function") {
      try {
        Toastify({
          text: msg,
          duration: time,
          gravity: "bottom",
          position: "center",
          style: { background: "linear-gradient(135deg, #72ff72, #00ff88)", color: "#000", fontWeight: "600", borderRadius: "8px" },
        }).showToast();
        return;
      } catch (_) {}
    }
    // Fallback caso o Toastify não carregue
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, { position: "fixed", left: "50%", bottom: "24px", transform: "translateX(-50%)", background: "#00ff88", color: "#000", padding: "10px 16px", borderRadius: "8px", fontWeight: "600", zIndex: 999999 });
    document.body?.appendChild(el);
    setTimeout(() => el.remove(), time);
  }

  function ensureToastify() {
    if (typeof Toastify === "function" || document.getElementById("kb-toastify")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
    document.head?.appendChild(link);

    const s = document.createElement("script");
    s.id = "kb-toastify";
    s.src = "https://cdn.jsdelivr.net/npm/toastify-js";
    document.head?.appendChild(s);
  }

  // ---------- 4. Logo Spoof (Trocar Logo) ----------
  function applyLogoSpoof() {
    if (!document.head) return;
    const svg = document.querySelector("header svg[aria-label]") || document.querySelector("svg._1rt6g9t");
    if (!svg || svg.dataset.mzzSpoofed) return;

    let originalColor = "#444";
    const fillPath = svg.querySelector("path[fill]");
    if (fillPath) originalColor = fillPath.getAttribute("fill") || originalColor;

    svg.querySelectorAll("path").forEach((p) => { p.style.visibility = "hidden"; });

    const newText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    newText.textContent = "@MZZVXM";
    newText.setAttribute("x", "33");
    newText.setAttribute("y", "20");
    newText.setAttribute("font-family", "sans-serif");
    newText.setAttribute("font-size", "20px");
    newText.setAttribute("fill", originalColor);

    svg.appendChild(newText);
    svg.dataset.mzzSpoofed = "true";
  }

  // ---------- 5. Observer ----------
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

})();
