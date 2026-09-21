/**
 * Butterfly
 * ------------------------------------------------------------
 * Mariposas amarillas que se mueven lentamente en un recorrido
 * en bucle (4 puntos) por una zona del jardin.
 */
(function () {
  "use strict";

  function Butterfly(layerEl, options) {
    this.layer = layerEl;
    this.reducedMotion = (options && options.reducedMotion) || false;
    this.els = [];
  }

  Butterfly.prototype.spawn = function (count) {
    var total = count || 3;
    for (var i = 0; i < total; i++) {
      this._spawnOne(i);
    }
  };

  Butterfly.prototype._spawnOne = function (index) {
    var el = document.createElement("div");
    el.className = "butterfly";

    var baseTop = 15 + Math.random() * 45; // % de altura
    var baseLeft = 8 + Math.random() * 80; // % de ancho

    el.style.top = baseTop + "%";
    el.style.left = baseLeft + "%";

    function rnd(min, max) {
      return Math.round(min + Math.random() * (max - min));
    }

    // 4 puntos de un recorrido suave, relativos a la posicion base (px)
    var p0x = 0, p0y = 0;
    var p1x = rnd(40, 90), p1y = rnd(-30, 20);
    var p2x = rnd(-10, 40), p2y = rnd(20, 60);
    var p3x = rnd(-70, -30), p3y = rnd(-20, 30);

    el.style.setProperty("--p0x", p0x + "px");
    el.style.setProperty("--p0y", p0y + "px");
    el.style.setProperty("--p1x", p1x + "px");
    el.style.setProperty("--p1y", p1y + "px");
    el.style.setProperty("--p2x", p2x + "px");
    el.style.setProperty("--p2y", p2y + "px");
    el.style.setProperty("--p3x", p3x + "px");
    el.style.setProperty("--p3y", p3y + "px");

    var duration = 14 + Math.random() * 10;
    el.style.animationDuration = duration + "s";
    el.style.animationDelay = (index * 1.4) + "s";

    if (this.reducedMotion) {
      el.style.animation = "none";
    }

    var wingLeft = document.createElement("div");
    wingLeft.className = "wing wing-left";
    var wingRight = document.createElement("div");
    wingRight.className = "wing wing-right";
    if (this.reducedMotion) {
      wingLeft.style.animation = "none";
      wingRight.style.animation = "none";
    }
    el.appendChild(wingLeft);
    el.appendChild(wingRight);

    this.layer.appendChild(el);
    this.els.push(el);
  };

  Butterfly.prototype.clear = function () {
    this.layer.innerHTML = "";
    this.els = [];
  };

  window.Butterfly = Butterfly;
})();
