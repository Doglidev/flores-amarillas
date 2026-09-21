/**
 * Fireflies
 * ------------------------------------------------------------
 * Pequenas luces amarillas que parpadean y se desplazan
 * suavemente por el jardin.
 */
(function () {
  "use strict";

  function Fireflies(layerEl, options) {
    this.layer = layerEl;
    this.reducedMotion = (options && options.reducedMotion) || false;
    this.els = [];
  }

  Fireflies.prototype.spawn = function (count) {
    var total = count || 8;
    for (var i = 0; i < total; i++) {
      var el = document.createElement("div");
      el.className = "firefly";
      el.style.left = 5 + Math.random() * 90 + "%";
      el.style.top = 30 + Math.random() * 55 + "%";

      if (!this.reducedMotion) {
        el.style.setProperty("--fx1", (Math.random() * 50 - 25) + "px");
        el.style.setProperty("--fy1", (Math.random() * -40 - 5) + "px");
        el.style.setProperty("--fx2", (Math.random() * 50 - 25) + "px");
        el.style.setProperty("--fy2", (Math.random() * -50 - 10) + "px");
        el.style.setProperty("--fx3", (Math.random() * 50 - 25) + "px");
        el.style.setProperty("--fy3", (Math.random() * -30 - 5) + "px");
        var driftDuration = 7 + Math.random() * 6;
        var blinkDuration = 1.6 + Math.random() * 1.8;
        el.style.animationDuration = driftDuration + "s, " + blinkDuration + "s";
        el.style.animationDelay = (Math.random() * 4) + "s, " + (Math.random() * 2) + "s";
      } else {
        el.style.opacity = (0.4 + Math.random() * 0.4).toFixed(2);
      }

      this.layer.appendChild(el);
      this.els.push(el);
    }
  };

  Fireflies.prototype.clear = function () {
    this.layer.innerHTML = "";
    this.els = [];
  };

  window.Fireflies = Fireflies;
})();
