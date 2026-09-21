/** HUD accesible del ramo: ayuda, mensajes, progreso y cierre. */
(function () {
  "use strict";

  function BouquetUI(containerEl, config) {
    this.container = containerEl;
    this.config = config || window.FLORES_CONFIG || {};
    this._timer = null;
    this._demoEl = null;
    this.root = document.createElement("div");
    this.root.className = "bouquet-ui";
    this.root.setAttribute("aria-live", "polite");
    this.root.innerHTML =
      '<div class="bouquet-ui__hint" hidden></div>' +
      '<div class="bouquet-ui__card" role="dialog" aria-label="Mensaje de la flor" hidden><p></p><button type="button" aria-label="Cerrar mensaje">×</button></div>' +
      '<div class="bouquet-ui__progress" aria-label="Progreso"><div class="bouquet-ui__indicators"></div><span></span></div>' +
      '<div class="bouquet-ui__final" hidden></div>';
    this.container.appendChild(this.root);
    this.hintEl = this.root.querySelector(".bouquet-ui__hint");
    this.cardEl = this.root.querySelector(".bouquet-ui__card");
    this.cardTextEl = this.cardEl.querySelector("p");
    this.progressEl = this.root.querySelector(".bouquet-ui__progress");
    this.progressTextEl = this.progressEl.querySelector("span");
    this.indicatorsEl = this.root.querySelector(".bouquet-ui__indicators");
    this.finalEl = this.root.querySelector(".bouquet-ui__final");
    this._close = this.hideFlowerMessage.bind(this);
    this.cardEl.querySelector("button").addEventListener("click", this._close);
    this._injectStyles();
  }

  BouquetUI.prototype._injectStyles = function () {
    if (document.getElementById("bouquet-ui-styles")) return;
    var style = document.createElement("style");
    style.id = "bouquet-ui-styles";
    style.textContent =
      ".bouquet-ui{position:absolute;inset:0;z-index:5;pointer-events:none;color:#fff8e7;font-family:Georgia,serif}" +
      ".bouquet-ui__hint,.bouquet-ui__final{position:absolute;left:50%;top:8%;transform:translateX(-50%);max-width:min(88vw,520px);white-space:pre-line;text-align:center;line-height:1.55;text-shadow:0 2px 16px #000;padding:16px}" +
      ".bouquet-ui__card{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:min(82vw,420px);box-sizing:border-box;padding:24px 42px 24px 24px;border:1px solid rgba(255,248,231,.25);border-radius:20px;background:rgba(255,248,231,.08);backdrop-filter:blur(14px);box-shadow:0 18px 55px rgba(0,0,0,.35);pointer-events:auto}" +
      ".bouquet-ui__card p{margin:0;white-space:pre-line;font-size:18px;font-style:italic;line-height:1.55}" +
      ".bouquet-ui__card button{position:absolute;right:12px;top:9px;border:0;background:none;color:#fff8e7;font-size:25px;cursor:pointer}" +
      ".bouquet-ui__progress{position:absolute;left:50%;bottom:5%;transform:translateX(-50%);text-align:center;font:13px sans-serif;letter-spacing:.04em}" +
      ".bouquet-ui__indicators{display:flex;justify-content:center;gap:7px;margin-bottom:8px}" +
      ".bouquet-ui__indicator{width:9px;height:15px;border-radius:70% 30% 70% 30%;background:#756229;transform:rotate(35deg);transition:.35s}" +
      ".bouquet-ui__indicator.is-active{background:#ffdc4d;box-shadow:0 0 12px #ffd83d}" +
      ".bouquet-ui__demo{position:absolute;width:22px;height:22px;border:2px solid #ffe478;border-radius:50%;transform:translate(-50%,-50%);animation:bouquetPulse 1.4s infinite;pointer-events:none}" +
      "@keyframes bouquetPulse{0%{opacity:1;scale:.65}100%{opacity:0;scale:1.8}}" +
      "@media(prefers-reduced-motion:reduce){.bouquet-ui__demo{animation:none}}";
    document.head.appendChild(style);
  };

  BouquetUI.prototype.showInitialHint = function () { this.hintEl.textContent = this.config.bouquetInitialHint || "Entre estas flores escondí algo para vos.\n\nTocá los pétalos para descubrirlo."; this.hintEl.hidden = false; };
  BouquetUI.prototype.hideHint = function () { this.hintEl.hidden = true; };
  BouquetUI.prototype.demoFlower = function (flowerObj, camera) {
    if (!flowerObj || !camera || !window.THREE) return;
    if (this._demoEl) this._demoEl.remove();
    var projected = flowerObj.mesh.getWorldPosition(new window.THREE.Vector3()).project(camera);
    this._demoEl = document.createElement("div");
    this._demoEl.className = "bouquet-ui__demo";
    this._demoEl.style.left = ((projected.x + 1) * 50) + "%";
    this._demoEl.style.top = ((1 - projected.y) * 50) + "%";
    this.root.appendChild(this._demoEl);
  };
  BouquetUI.prototype.showFlowerMessage = function (text, position3D, camera) {
    clearTimeout(this._timer);
    this.cardTextEl.textContent = text;
    if (position3D && camera) {
      var p = position3D.clone().project(camera);
      this.cardEl.style.left = Math.max(18, Math.min(82, (p.x + 1) * 50)) + "%";
      this.cardEl.style.top = Math.max(25, Math.min(72, (1 - p.y) * 50 - 8)) + "%";
    }
    this.cardEl.hidden = false;
    this._timer = setTimeout(this._close, 5000);
  };
  BouquetUI.prototype.hideFlowerMessage = function () { clearTimeout(this._timer); this.cardEl.hidden = true; if (typeof this.onMessageHidden === "function") this.onMessageHidden(); };
  BouquetUI.prototype.updateProgress = function (discovered, total) {
    var format = this.config.progressFormat || "({discovered}/{total}) mensajes encontrados";
    this.progressTextEl.textContent = format.replace("{discovered}", discovered).replace("{total}", total);
    for (var i = 0; i < discovered; i++) this.highlightIndicator(i);
  };
  BouquetUI.prototype.showProgressIndicators = function (total) {
    this.indicatorsEl.innerHTML = "";
    for (var i = 0; i < total; i++) { var el = document.createElement("i"); el.className = "bouquet-ui__indicator"; el.setAttribute("aria-hidden", "true"); this.indicatorsEl.appendChild(el); }
    this.updateProgress(0, total);
  };
  BouquetUI.prototype.highlightIndicator = function (index) { var items = this.indicatorsEl.children; if (items[index]) items[index].classList.add("is-active"); };
  BouquetUI.prototype.showFinalMessage = function (text) { this.finalEl.textContent = text; this.finalEl.hidden = false; };
  BouquetUI.prototype.dispose = function () { clearTimeout(this._timer); if (this.root) this.root.remove(); this.root = null; };

  window.BouquetUI = BouquetUI;
})();
