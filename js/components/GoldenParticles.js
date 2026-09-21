/**
 * GoldenParticles
 * ------------------------------------------------------------
 * Particulas doradas ambientales (flotan hacia arriba todo el
 * tiempo) y particulas de "burst" (se disparan al tocar una flor).
 */
(function () {
  "use strict";

  function GoldenParticles(layerEl, options) {
    this.layer = layerEl;
    this.reducedMotion = (options && options.reducedMotion) || false;
    this.isMobile = (options && options.isMobile) || false;
    this.ambientEls = [];
    this.ambientTimer = null;
  }

  GoldenParticles.prototype.startAmbient = function (count) {
    if (this.reducedMotion) {
      // Version simplificada: unas pocas particulas estaticas, sin animacion.
      for (var i = 0; i < Math.min(6, count); i++) {
        this._spawnAmbient(true);
      }
      return;
    }
    var total = count || 18;
    if (this.isMobile) total = Math.ceil(total * 0.6);
    for (var j = 0; j < total; j++) {
      this._spawnAmbient(false);
    }
  };

  GoldenParticles.prototype._spawnAmbient = function (isStatic) {
    var el = document.createElement("div");
    el.className = "gold-particle ambient";
    var size = 2 + Math.random() * 3;
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.left = Math.random() * 100 + "%";
    el.style.bottom = Math.random() * 55 + "%";
    if (isStatic) {
      el.style.opacity = (0.3 + Math.random() * 0.4).toFixed(2);
    } else {
      var duration = 6 + Math.random() * 8;
      var delay = Math.random() * 8;
      el.style.setProperty("--drift", (Math.random() * 60 - 30) + "px");
      el.style.animationDuration = duration + "s";
      el.style.animationDelay = delay + "s";
    }
    this.layer.appendChild(el);
    this.ambientEls.push(el);
  };

  /**
   * Dispara un estallido de particulas doradas desde un punto (x, y)
   * en coordenadas relativas al layer (px).
   */
  GoldenParticles.prototype.burst = function (x, y, count) {
    var total = count || 10;
    for (var i = 0; i < total; i++) {
      var el = document.createElement("div");
      el.className = "gold-particle burst";
      var size = 3 + Math.random() * 4;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = x + "px";
      el.style.top = y + "px";
      var angle = Math.random() * Math.PI * 2;
      var distance = 30 + Math.random() * 55;
      var bx = Math.cos(angle) * distance;
      var by = Math.sin(angle) * distance - 10;
      el.style.setProperty("--bx", bx + "px");
      el.style.setProperty("--by", by + "px");
      if (this.reducedMotion) {
        el.style.animationDuration = "0.4s";
      }
      this.layer.appendChild(el);
      (function (node) {
        node.addEventListener("animationend", function () {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        // Fallback por si animationend no dispara (reduced motion / navegadores raros)
        setTimeout(function () {
          if (node.parentNode) node.parentNode.removeChild(node);
        }, 1400);
      })(el);
    }
  };

  /** Polen dorado: particulas mas chicas, lentas y difusas que las ambientales. */
  GoldenParticles.prototype.startPollen = function (count) {
    if (this.reducedMotion) return;
    var total = count || 14;
    for (var i = 0; i < total; i++) {
      var el = document.createElement("div");
      el.className = "gold-particle pollen";
      var size = 1.5 + Math.random() * 2;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = Math.random() * 100 + "%";
      el.style.bottom = Math.random() * 70 + "%";
      el.style.setProperty("--drift", (Math.random() * 90 - 45) + "px");
      var duration = 12 + Math.random() * 14;
      el.style.animationDuration = duration + "s";
      el.style.animationDelay = (Math.random() * 10) + "s";
      this.layer.appendChild(el);
      this.ambientEls.push(el);
    }
  };

  /** Onda de luz al tocar una flor (anillo que se expande y se desvanece). */
  GoldenParticles.prototype.ripple = function (x, y) {
    var ring = document.createElement("div");
    ring.className = "light-ripple";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    if (this.reducedMotion) ring.style.animationDuration = "0.4s";
    this.layer.appendChild(ring);
    setTimeout(function () {
      if (ring.parentNode) ring.parentNode.removeChild(ring);
    }, 1000);
  };

  GoldenParticles.prototype.clear = function () {
    this.ambientEls.forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    this.ambientEls = [];
    this.layer.innerHTML = "";
  };

  window.GoldenParticles = GoldenParticles;
})();
