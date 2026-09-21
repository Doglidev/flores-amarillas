/**
 * PetalDrift
 * ------------------------------------------------------------
 * Petalos amarillos sueltos que atraviesan lentamente la
 * pantalla en diagonal, como si el viento los arrastrara.
 */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function PetalDrift(layerEl, options) {
    this.layer = layerEl;
    this.reducedMotion = (options && options.reducedMotion) || false;
    this.timer = null;
    this.active = 0;
    this.maxActive = (options && options.maxActive) || 5;
  }

  PetalDrift.prototype.start = function () {
    if (this.reducedMotion) return;
    var self = this;
    this._scheduleNext();
    this._running = true;
  };

  PetalDrift.prototype._scheduleNext = function () {
    var self = this;
    var delay = 2200 + Math.random() * 3200;
    this.timer = setTimeout(function () {
      if (self.active < self.maxActive) self._spawn();
      self._scheduleNext();
    }, delay);
  };

  PetalDrift.prototype._spawn = function () {
    var self = this;
    var petal = document.createElementNS(SVG_NS, "svg");
    petal.setAttribute("class", "drift-petal");
    petal.setAttribute("viewBox", "0 0 20 26");

    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M10,1 C15,4 18,10 15,17 C13,22 10,25 10,25 C10,25 7,22 5,17 C2,10 5,4 10,1 Z"
    );
    path.setAttribute("fill", "#FFD83D");
    petal.appendChild(path);

    var startEdge = Math.random() < 0.5 ? "left" : "right";
    var startY = 10 + Math.random() * 60;
    var travelX = (startEdge === "left" ? 1 : -1) * (110 + Math.random() * 20);
    var travelY = 20 + Math.random() * 40;
    var size = 14 + Math.random() * 12;

    petal.style.left = startEdge === "left" ? "-4%" : "104%";
    petal.style.top = startY + "%";
    petal.style.width = size + "px";
    petal.style.height = size * 1.3 + "px";
    petal.style.setProperty("--travel-x", travelX + "vw");
    petal.style.setProperty("--travel-y", travelY + "vh");
    petal.style.setProperty("--spin", (Math.random() < 0.5 ? "" : "-") + (200 + Math.random() * 300) + "deg");

    var duration = 9 + Math.random() * 7;
    petal.style.animationDuration = duration + "s";

    this.layer.appendChild(petal);
    this.active++;

    petal.addEventListener("animationend", function () {
      if (petal.parentNode) petal.parentNode.removeChild(petal);
      self.active--;
    });
    setTimeout(function () {
      if (petal.parentNode) petal.parentNode.removeChild(petal);
      self.active = Math.max(0, self.active - 1);
    }, duration * 1000 + 500);
  };

  PetalDrift.prototype.stop = function () {
    this._running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  };

  PetalDrift.prototype.clear = function () {
    this.stop();
    this.layer.innerHTML = "";
    this.active = 0;
  };

  window.PetalDrift = PetalDrift;
})();
