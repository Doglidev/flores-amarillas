/**
 * BouquetCanvas — Ramo interactivo 2D con Canvas
 * Partículas formando ramo + flores clickeables + mensajes
 */
(function () {
  "use strict";

  function BouquetCanvas(containerEl, config) {
    this.container = containerEl;
    this.config = config || {};
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.flowers = [];
    this.particles = [];
    this.discovered = new Set();
    this.interactive = false;
    this.animating = false;

    this._raf = null;
    this._startTime = 0;
    this._callbacks = new Map();
  }

  BouquetCanvas.prototype.init = function () {
    var self = this;
    return new Promise(function (resolve) {
      self._setupCanvas();
      self._createFlowers();
      self._resizeCanvas();
      window.addEventListener("resize", self._resizeCanvas.bind(self));
      self.container.addEventListener("click", self._onClick.bind(self));
      resolve(self);
    });
  };

  BouquetCanvas.prototype._setupCanvas = function () {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "bouquet-canvas-2d";
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
  };

  BouquetCanvas.prototype._resizeCanvas = function () {
    var rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }.bind(this);

  BouquetCanvas.prototype._createFlowers = function () {
    var messages = this.config.bouquetMessages || [];
    var total = (this.config.flowerCount || 7) + (this.config.hasSecretFlower ? 1 : 0);

    // Posiciones en círculo con variación
    var centerX = this.width / 2;
    var centerY = this.height * 0.55;
    var radius = 45;

    for (var i = 0; i < total; i++) {
      var angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      var isSecret = this.config.hasSecretFlower && i === total - 1;
      var message = isSecret
        ? (this.config.secretFlowerMessage || "Encontraste la flor secreta 💛")
        : (messages[i] || "Esta flor floreció para vos.");

      this.flowers.push({
        id: i,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: 18,
        discovered: false,
        isSecret: isSecret,
        message: message,
        color: isSecret ? "#fff3a4" : ["#ffd83d", "#ffdb4d", "#ffcf33", "#ffe15c"][i % 4],
        glowIntensity: 0,
      });
    }
  };

  BouquetCanvas.prototype.startFormation = function () {
    var self = this;
    var duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 500 : 4000;

    return new Promise(function (resolve) {
      self.animating = true;
      self._startTime = performance.now();

      self._seedParticles(300);
      self._animate(performance.now());

      setTimeout(function () {
        self.animating = false;
        self.interactive = true;
        self._particles = [];
        resolve(self);
      }, duration);
    });
  };

  BouquetCanvas.prototype._seedParticles = function (count) {
    var centerX = this.width / 2;
    var centerY = this.height * 0.55;

    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var distance = 100 + Math.random() * 200;

      this.particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        tx: centerX + (Math.random() - 0.5) * 80,
        ty: centerY + (Math.random() - 0.5) * 80,
        size: 2 + Math.random() * 4,
        life: 1,
      });
    }
  };

  BouquetCanvas.prototype._animate = function (now) {
    var self = this;
    if (!this.animating && this.particles.length === 0) return;

    var elapsed = now - this._startTime;
    var progress = Math.min(1, elapsed / 4000);

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Animar partículas
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      var eased = 1 - Math.pow(1 - progress, 3);
      p.x += (p.tx - p.x) * 0.05;
      p.y += (p.ty - p.y) * 0.05;
      p.life = 1 - progress;

      this.ctx.fillStyle = "rgba(255, 216, 61, " + (p.life * 0.8) + ")";
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Dibujar flores
    var flowerAlpha = progress > 0.6 ? (progress - 0.6) / 0.4 : 0;
    this._drawFlowers(flowerAlpha);

    this._raf = requestAnimationFrame(function (t) { self._animate(t); });
  };

  BouquetCanvas.prototype._drawFlowers = function (alpha) {
    if (alpha <= 0) return;

    var centerX = this.width / 2;
    var centerY = this.height * 0.55;

    this.ctx.globalAlpha = alpha;

    // Tallo y hojas
    this.ctx.strokeStyle = "#426b35";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY + 80);
    this.ctx.quadraticCurveTo(centerX - 5, centerY + 40, centerX, centerY);
    this.ctx.stroke();

    // Hojas
    this.ctx.fillStyle = "rgba(82, 122, 63, 0.8)";
    this.ctx.beginPath();
    this.ctx.ellipse(centerX - 12, centerY + 20, 8, 18, -0.4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(centerX + 12, centerY + 25, 8, 18, 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    // Flores
    for (var i = 0; i < this.flowers.length; i++) {
      var flower = this.flowers[i];
      var glow = this.discovered.has(flower.id) ? 0.9 : 0.4;

      // Glow
      var gradient = this.ctx.createRadialGradient(flower.x, flower.y, 0, flower.x, flower.y, flower.radius * 2);
      gradient.addColorStop(0, "rgba(255, 216, 61, " + (glow * 0.3) + ")");
      gradient.addColorStop(1, "rgba(255, 216, 61, 0)");
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(flower.x, flower.y, flower.radius * 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Pétalo central
      this.ctx.fillStyle = flower.color;
      this.ctx.beginPath();
      this.ctx.arc(flower.x, flower.y, flower.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Centro
      this.ctx.fillStyle = "rgba(255, 248, 201, 0.9)";
      this.ctx.beginPath();
      this.ctx.arc(flower.x, flower.y, flower.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();

      // Indicador descubierto
      if (this.discovered.has(flower.id)) {
        this.ctx.strokeStyle = "rgba(240, 174, 42, 0.8)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(flower.x, flower.y, flower.radius * 1.2, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    this.ctx.globalAlpha = 1;
  };

  BouquetCanvas.prototype._onClick = function (event) {
    if (!this.interactive) return;

    var rect = this.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    for (var i = 0; i < this.flowers.length; i++) {
      var flower = this.flowers[i];
      var dx = x - flower.x;
      var dy = y - flower.y;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < flower.radius * 1.5) {
        this._discoverFlower(flower);
        break;
      }
    }
  }.bind(this);

  BouquetCanvas.prototype._discoverFlower = function (flower) {
    if (this.discovered.has(flower.id)) return;

    this.discovered.add(flower.id);
    var callback = this._callbacks.get(flower.id);
    if (callback) callback(flower);
  };

  BouquetCanvas.prototype.registerFlowerClick = function (flowerId, callback) {
    this._callbacks.set(flowerId, callback);
    return function () { this._callbacks.delete(flowerId); }.bind(this);
  };

  BouquetCanvas.prototype.setInteractive = function (enabled) {
    this.interactive = enabled;
  };

  BouquetCanvas.prototype.getDiscoveredCount = function () {
    return this.discovered.size;
  };

  BouquetCanvas.prototype.discoveredCount = 0;
  Object.defineProperty(BouquetCanvas.prototype, 'discoveredCount', {
    get: function () { return this.discovered.size; },
    enumerable: true
  });

  BouquetCanvas.prototype.cleanup = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.particles = [];
    this.flowers = [];
    this.discovered.clear();
    this._callbacks.clear();
  };

  BouquetCanvas.prototype.dispose = BouquetCanvas.prototype.cleanup;

  window.BouquetCanvas = BouquetCanvas;
})();
