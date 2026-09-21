/**
 * FlowerGarden
 * ------------------------------------------------------------
 * Crea y gestiona el ramo de flores: posiciones y capas de
 * profundidad (fondo / medio / frente), apertura en cascada
 * desde el centro hacia los costados, interaccion (hover/touch
 * con inclinacion, mensajes y ondas de luz), la flor secreta y
 * el conteo de interacciones.
 */
(function () {
  "use strict";

  function FlowerGarden(options) {
    this.gardenLayer = options.gardenLayer;
    this.gardenScene = options.gardenScene;
    this.tapCaption = options.tapCaption;
    this.particles = options.particles;
    this.config = options.config;
    this.reducedMotion = options.reducedMotion;
    this.isTouch = options.isTouch;
    this.isMobile = options.isMobile;
    this.onFlowerActivated = options.onFlowerActivated || function () {};
    this.onSecretFound = options.onSecretFound || function () {};
    this.onCascadeStart = options.onCascadeStart || function () {};

    this.flowers = [];
    this.secretIndex = -1;
    this.wordIndex = 0;
    this.layers = null;

    this._bindParallax();
  }

  FlowerGarden.prototype.buildFirstFlower = function (onDone) {
    var flower = new window.GrowingFlower({
      leftPercent: 50,
      heightPx: this._heightForViewport() * (0.46 + Math.random() * 0.06),
      scale: 1,
      petalCount: 12,
      curve: 0,
      isProtagonist: true,
      depthLayer: "midground",
      reducedMotion: this.reducedMotion,
      isMobile: this.isMobile,
    });
    this.gardenLayer.appendChild(flower.el);
    flower.grow(onDone, 120);
    flower.enableSway();
    this.firstFlower = flower;
  };

  FlowerGarden.prototype._heightForViewport = function () {
    return Math.min(window.innerHeight, 980);
  };

  FlowerGarden.prototype.removeFirstFlower = function () {
    if (this.firstFlower && this.firstFlower.el.parentNode) {
      this.firstFlower.el.parentNode.removeChild(this.firstFlower.el);
    }
    this.firstFlower = null;
  };

  /**
   * Genera el resto del ramo (12-20 flores) en tres capas de
   * profundidad, con apertura en cascada desde el centro.
   */
  FlowerGarden.prototype.bloomGarden = function (onAllDone) {
    var self = this;
    var count = Math.max(12, Math.min(20, this.config.flowerCount || 16));
    this.secretIndex = Math.floor(count * 0.4) + Math.floor(Math.random() * Math.floor(count * 0.3));
    if (this.secretIndex >= count) this.secretIndex = count - 2;

    this.layers = this._buildDepthLayers();

    var positions = this._distributePositions(count);
    var remaining = count;
    var maxHeight = this._heightForViewport();
    var cascadeSpread = this.reducedMotion ? 0 : (this.isMobile ? Math.min(2800, 800 + count * 80) : Math.min(1500, 420 + count * 45));

    // Dispara el flash dorado + onda de luz apenas empieza la cascada.
    this.onCascadeStart();

    var built = [];
    var i = 0;

    // Crear flores con delay para no bloquear el thread principal (especialmente en mobile)
    var batchSize = this.isMobile ? 2 : 4;
    var batchDelay = this.isMobile ? 50 : 30;

    (function createBatch() {
      for (var j = 0; j < batchSize && i < positions.length; j++, i++) {
        var leftPercent = positions[i];
        var isSecret = i === self.secretIndex;
        var depthRoll = Math.random();
        var depthLayer = depthRoll < 0.22 ? "background" : depthRoll > 0.82 ? "foreground" : "midground";

        var scale;
        if (depthLayer === "background") scale = 0.42 + Math.random() * 0.18;
        else if (depthLayer === "foreground") scale = 0.85 + Math.random() * 0.35;
        else scale = 0.6 + Math.random() * 0.32;

        var petalCount = 7 + Math.floor(Math.random() * 4);

        var flower = new window.GrowingFlower({
          leftPercent: leftPercent,
          heightPx: maxHeight * (0.3 + Math.random() * 0.22) * (depthLayer === "foreground" ? 1.15 : 1),
          scale: scale,
          petalCount: petalCount,
          curve: Math.random() * 2 - 1,
          isSecret: isSecret,
          depthLayer: depthLayer,
          reducedMotion: self.reducedMotion,
          isMobile: self.isMobile,
        });

        var container = self.layers[depthLayer];
        container.appendChild(flower.el);
        self._attachInteraction(flower, isSecret);
        self.flowers.push(flower);

        // Cascada desde el centro (50%) hacia los costados.
        var distanceFromCenter = Math.abs(leftPercent - 50) / 50; // 0..1
        var delay = self.reducedMotion
          ? i * 35
          : distanceFromCenter * cascadeSpread + Math.random() * 140;

        built.push({ flower: flower, delay: delay });
      }

      if (i < positions.length) {
        setTimeout(createBatch, batchDelay);
      } else {
        built.forEach(function (item) {
          item.flower.grow(function () {
            item.flower.enableSway();
            if (!self.reducedMotion) {
              var c = item.flower.getBloomCenter();
              self.particles.burst(c.x, c.y, 5);
            }
            remaining--;
            if (remaining === 0 && onAllDone) onAllDone();
          }, item.delay);
        });
      }
    })();
  };

  /** Crea (o reutiliza) los tres contenedores de profundidad. */
  FlowerGarden.prototype._buildDepthLayers = function () {
    var names = ["background", "midground", "foreground"];
    var layers = {};
    names.forEach((name) => {
      var div = document.createElement("div");
      div.className = "depth-layer depth-layer-" + name;
      this.gardenLayer.appendChild(div);
      layers[name] = div;
    });
    return layers;
  };

  /** Distribuye posiciones horizontales evitando amontonamientos. */
  FlowerGarden.prototype._distributePositions = function (count) {
    var positions = [];
    var slice = 108 / count;
    for (var i = 0; i < count; i++) {
      var base = -4 + slice * i + slice / 2;
      var jitter = (Math.random() - 0.5) * slice * 0.7;
      positions.push(Math.max(-6, Math.min(106, base + jitter)));
    }
    return positions;
  };

  /** Parallax sutil: las capas se desplazan levemente segun el cursor. */
  FlowerGarden.prototype._bindParallax = function () {
    var self = this;
    if (this.isTouch || this.reducedMotion) return;

    var ticking = false;
    var lastX = 0.5;
    var lastY = 0.5;

    function apply() {
      ticking = false;
      if (!self.layers) return;
      var bx = (lastX - 0.5) * 2;
      var by = (lastY - 0.5) * 2;
      self.layers.background.style.transform = "translate(" + bx * 6 + "px," + by * 4 + "px)";
      self.layers.midground.style.transform = "translate(" + bx * 12 + "px," + by * 7 + "px)";
      self.layers.foreground.style.transform = "translate(" + bx * 22 + "px," + by * 12 + "px)";
    }

    document.addEventListener("mousemove", function (e) {
      lastX = e.clientX / window.innerWidth;
      lastY = e.clientY / window.innerHeight;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    });
  };

  FlowerGarden.prototype._attachInteraction = function (flower, isSecret) {
    var self = this;
    var svg = flower.el;

    if (!this.isTouch) {
      svg.addEventListener("mousemove", function (e) {
        flower.tiltToward(e.clientX);
      });
      svg.addEventListener("mouseleave", function () {
        flower.resetTilt();
      });
    }

    svg.addEventListener(this.isTouch ? "touchstart" : "click", function (e) {
      self._activateFlower(flower, isSecret);
    }, { passive: true });
  };

  FlowerGarden.prototype._activateFlower = function (flower, isSecret) {
    var center = flower.getBloomCenter();
    this.particles.burst(center.x, center.y, this.reducedMotion ? 6 : 14);
    this.particles.ripple(center.x, center.y);
    this._showMessage();

    if (isSecret) {
      this.onSecretFound();
    }
    this.onFlowerActivated();
  };

  FlowerGarden.prototype._showMessage = function () {
    var words = this.config.words || ["Gracias"];
    var word = words[this.wordIndex % words.length];
    this.wordIndex++;
    this.tapCaption.flash(word, 2600);
  };

  FlowerGarden.prototype.clear = function () {
    this.gardenLayer.innerHTML = "";
    this.flowers = [];
    this.secretIndex = -1;
    this.wordIndex = 0;
    this.layers = null;
  };

  window.FlowerGarden = FlowerGarden;
})();
