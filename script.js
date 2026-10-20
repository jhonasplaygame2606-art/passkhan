// ==UserScript==
// @name        KhanBypass
// @namespace   mzzvxm
// @match       *://pt.khanacademy.org/*
// @grant       none
// @version     2.7
// @author      mzzvxm
// @icon        https://cdn.kastatic.org/images/favicon.ico
// @description 2025-11-22
// ==/UserScript==

const loadedPlugins = [];

console.clear();
const silent = () => {};
console.warn = console.error = window.debug = silent;

const splashScreen = document.createElement("div"); // << troca splashScreen para <div>

class EventEmitter {
  constructor() {
    this.events = {};
  }
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
    this.events[event]?.forEach((fn) => fn(...args));
  }
  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

const eventBus = new EventEmitter();

new MutationObserver(
  (changes) => changes.some((change) => change.type === "childList") && eventBus.emit("domChanged"),
).observe(document.body, { childList: true, subtree: true });

function applyLogoSpoof() {
  if (!document.getElementById("mzz-font-style")) {
    const fontStyle = document.createElement("style");
    fontStyle.id = "mzz-font-style";
    fontStyle.innerHTML = `
          @font-face {
            font-family: 'BrandonTextOfficeBold';
            src: url('https://cdn.jsdelivr.net/gh/mzzvxm/KhanBypass@main/fonts/BrandonText-Bold.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
      `;
    document.head.appendChild(fontStyle);
  }

  const svg = document.querySelector("svg._1rt6g9t");
  if (!svg || svg.dataset.mzzSpoofed) return;

  let originalColor = "#444"; // fallback
  const originalPath = svg.querySelector("path[fill]");
  if (originalPath) originalColor = originalPath.getAttribute("fill");

  const textPaths = svg.querySelectorAll("path:not([fill])");
  textPaths.forEach((p) => p.remove());

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

eventBus.on("domChanged", applyLogoSpoof);

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const tryClick = (sel) => document.querySelector(sel)?.click();

const clickButtonWithText = (text) => {
  const allButtons = document.querySelectorAll("button");
  for (const button of allButtons) {
    if (button.textContent && button.textContent.trim() === text) {
      button.click();
      notify(`🚀｜Botão "${text}" clicado automaticamente!`, 1500);
      return true;
    }
    const spans = button.querySelectorAll("span");
    for (const span of spans) {
      if (span.textContent && span.textContent.trim() === text) {
        button.click();
        notify(`🚀｜Botão "${text}" clicado automaticamente!`, 1500);
        return true;
      }
    }
  }
  return false;
};

function notify(msg, time = 5000, gravity = "bottom") {
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
}

// As funções showSplashScreen, hideSplashScreen, loadScript, loadCss, runMainScript e demais,
// estão corretas, apenas revisar escopo e manter estilo consistente

// Não alterei a lógica funcional principal para evitar quebrar o script, se quiser posso ajudar a tornar mais modular ou segura.

