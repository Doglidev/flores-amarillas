/** Orquestador principal de la experiencia del ramo 3D. */
(function () {
  "use strict";

  var DEFAULTS = {
    flowerCount: 7,
    hasSecretFlower: true,
    formationDuration: 5000,
    ambientParticles: 18,
    autoRotateSpeed: 0.015,
    cameraZoomLimits: { min: 60, max: 120 },
  };

  function mergeConfig(config) {
    var result = {};
    Object.keys(DEFAULTS).forEach(function (key) { result[key] = DEFAULTS[key]; });
    Object.keys(config || {}).forEach(function (key) { result[key] = config[key]; });
    result.flowerCount = Math.max(1, Math.min(8, result.flowerCount));
    result.formationDuration = Math.max(4000, Math.min(6000, result.formationDuration));
    return result;
  }

  function BouquetScene(containerEl, config) {
    if (!containerEl) throw new Error("BouquetScene necesita un elemento contenedor.");
    this.container = containerEl;
    this.config = mergeConfig(config);
    this.globalConfig = window.FLORES_CONFIG || {};
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.flowers = [];
    this.particleSystem = null;
    this.cameraController = null;
    this.uiController = null;
    this.discoveredCount = 0;
    this.progressTotal = this.config.flowerCount;
    this.raycaster = null;
    this.pointer = null;
    this.bouquetGroup = null;
    this._raf = null;
    this._lastFrame = 0;
    this._listeners = [];
    this._callbacks = new Map();
    this._hovered = null;
    this._fallback = false;
    this._finalizing = false;
    this._disposed = false;
    this._secretTimer = null;
    this._boundResize = this._resize.bind(this);
    this._boundPointerMove = this._onPointerMove.bind(this);
    this._boundClick = this._onClick.bind(this);
    this._pointerDown = null;
    this._dragged = false;
  }

  BouquetScene.prototype.init = function () {
    var self = this;
    return new Promise(function (resolve) {
      try {
        if (!window.THREE || !self._hasWebGL()) {
          self._initFallback();
          resolve(self);
          return;
        }
        var THREE = window.THREE;
        var width = self.container.clientWidth || window.innerWidth;
        var height = self.container.clientHeight || window.innerHeight;
        self.scene = new THREE.Scene();
        self.scene.fog = new THREE.Fog(0x05070d, 50, 500);
        self.camera = new THREE.PerspectiveCamera(75, width / Math.max(1, height), 0.1, 1000);
        self.camera.position.set(0, 0, 80);
        self.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        self.renderer.setClearColor(0x05070d, 0);
        self.renderer.setSize(width, height, false);
        self.renderer.setPixelRatio(self._isMobile() ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
        self.renderer.outputColorSpace = THREE.SRGBColorSpace;
        self.renderer.domElement.className = "bouquet-canvas";
        self.renderer.domElement.setAttribute("aria-label", "Ramo 3D interactivo de flores amarillas");
        self.renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;";
        self.container.appendChild(self.renderer.domElement);

        self.scene.add(new THREE.AmbientLight(0xffd700, 0.6));
        var directional = new THREE.DirectionalLight(0xffeecc, 1.2);
        directional.position.set(45, 45, 45);
        self.scene.add(directional);
        var point = new THREE.PointLight(0xffd83d, 0.8, 300);
        point.position.set(0, 5, 30);
        self.scene.add(point);

        self.raycaster = new THREE.Raycaster();
        self.pointer = new THREE.Vector2(2, 2);
        self.bouquetGroup = new THREE.Group();
        self.scene.add(self.bouquetGroup);
        self.loadFlowers();
        self.particleSystem = new window.ParticleSystem(self.scene, 1000);
        self.cameraController = new window.CameraController(self.camera, self.renderer, { zoomLimits: self.config.cameraZoomLimits });
        self.uiController = new window.BouquetUI(self.container, self.globalConfig);
        self.uiController.showProgressIndicators(self.progressTotal);
        self.uiController.onMessageHidden = function () { self.cameraController.resetCamera(600); };
        self.setInteractive(false);
        self.renderer.domElement.addEventListener("pointermove", self._boundPointerMove);
        self.renderer.domElement.addEventListener("click", self._boundClick);
        self.renderer.domElement.addEventListener("pointerdown", function (event) {
          self._pointerDown = { x: event.clientX, y: event.clientY };
          self._dragged = false;
        });
        self.renderer.domElement.addEventListener("pointermove", function (event) {
          if (!self._pointerDown) return;
          var dx = event.clientX - self._pointerDown.x;
          var dy = event.clientY - self._pointerDown.y;
          if (Math.sqrt(dx * dx + dy * dy) > 8) self._dragged = true;
        });
        self.renderer.domElement.addEventListener("pointerup", function () { self._pointerDown = null; });
        window.addEventListener("resize", self._boundResize);
        self._animate(performance.now());
        resolve(self);
      } catch (error) {
        console.warn("No se pudo iniciar WebGL; se usa el ramo 2D.", error);
        self._initFallback();
        resolve(self);
      }
    });
  };

  BouquetScene.prototype._hasWebGL = function () {
    try {
      var canvas = document.createElement("canvas");
      return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch (error) { return false; }
  };
  BouquetScene.prototype._isMobile = function () { return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches; };

  BouquetScene.prototype.loadFlowers = function () {
    var THREE = window.THREE;
    var messages = this.globalConfig.bouquetMessages || [];
    var layouts = [
      [-20, 4, -1, 0.82], [-12, 17, -3, 0.92], [0, 23, 1, 1.08], [13, 16, -2, 0.96],
      [21, 3, -4, 0.8], [-8, -1, 3, 1.03], [9, 1, 4, 1.0], [0, 10, -10, 0.78],
    ];
    var total = this.config.flowerCount + (this.config.hasSecretFlower ? 1 : 0);
    for (var i = 0; i < total; i++) {
      var secret = this.config.hasSecretFlower && i === total - 1;
      var layout = layouts[i % layouts.length];
      if (secret) layout = [0, 8, -10, 0.78];
      var geometry = window.BouquetGeometry.createFlower({ size: 0.72 + (i % 3) * 0.08, paletteIndex: secret ? 1 : i });
      var message = secret ? (this.globalConfig.secretFlowerMessage || "Encontraste la flor secreta 💛") : (messages[i] || "Esta flor floreció para vos.");
      var flower = new window.FlowerObject(geometry, new THREE.Vector3(layout[0], layout[1], layout[2]), layout[3], message, secret);
      flower.mesh.rotation.z = (i - total / 2) * 0.035;
      flower.mesh.visible = false;
      flower._burstHandler = this._burstFromFlower.bind(this);
      this.flowers.push(flower);
      this.bouquetGroup.add(flower.mesh);
    }
    return this.flowers;
  };

  BouquetScene.prototype.formBouquet = function () {
    var self = this;
    if (this._fallback) return this._formFallback();
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var duration = reduced ? 250 : this.config.formationDuration;
    var morph = this.particleSystem.morphFlowerBouquet(this, duration);
    this.flowers.forEach(function (flower, index) {
      var delay = reduced ? 0 : duration * 0.58 + index * (duration * 0.32 / self.flowers.length);
      setTimeout(function () {
        if (self._disposed) return;
        flower.mesh.visible = true;
        var target = flower.mesh.scale.clone();
        flower.mesh.scale.setScalar(0.01);
        self._tween(650, function (t) { flower.mesh.scale.copy(target).multiplyScalar(t); });
        flower.animatePetalOpen();
      }, delay);
    });
    return morph.then(function () {
      self.flowers.forEach(function (flower) { flower.mesh.visible = true; });
      self.particleSystem.ambient(self.config.ambientParticles);
      if (self.config.hasSecretFlower) self._startSecretEmission();
      return self;
    });
  };

  BouquetScene.prototype.registerFlowerClick = function (flowerObj, callback) {
    if (this.flowers.indexOf(flowerObj) === -1) throw new Error("La flor no pertenece a esta escena.");
    if (typeof callback === "function") this._callbacks.set(flowerObj, callback);
    return function () { this._callbacks.delete(flowerObj); }.bind(this);
  };

  /** API explícita para el orquestador de la experiencia. */
  BouquetScene.prototype.startFormation = function () { return this.formBouquet(); };
  BouquetScene.prototype.setInteractive = function (enabled) {
    enabled = Boolean(enabled);
    if (this.renderer) {
      this.renderer.domElement.style.pointerEvents = enabled ? "auto" : "none";
      this.renderer.domElement.setAttribute("aria-hidden", enabled ? "false" : "true");
    }
    if (this.cameraController) {
      if (enabled) this.cameraController.enableAutoRotate(this.config.autoRotateSpeed);
      else this.cameraController.disableAutoRotate();
    }
    this.interactive = enabled;
  };
  BouquetScene.prototype.reset = function () {
    var self = this;
    this.discoveredCount = 0;
    this._finalizing = false;
    this.flowers.forEach(function (flower) { if (flower.reset) flower.reset(); else flower.discovered = false; });
    if (this.cameraController) this.cameraController.resetCamera(450);
    if (this.uiController) {
      this.uiController.hideFlowerMessage();
      this.uiController.hideHint();
      this.uiController.showProgressIndicators(this.progressTotal);
    }
    this.setInteractive(false);
    return self;
  };
  BouquetScene.prototype.destroy = function () { this.cleanup(); };

  BouquetScene.prototype.onFlowerDiscovered = function (flowerObj) {
    if (this._finalizing || !flowerObj || !flowerObj.setDiscovered()) return false;
    this.discoveredCount++;
    this.uiController.hideHint();
    this.cameraController.zoomToFlower(flowerObj, 1000);
    flowerObj.animateStemBend(flowerObj.isSecret ? -0.18 : 0.14);
    flowerObj.bloom();
    flowerObj.emit();
    this.uiController.showFlowerMessage(flowerObj.message, flowerObj.mesh.getWorldPosition(new window.THREE.Vector3()), this.camera);
    this.uiController.updateProgress(Math.min(this.discoveredCount, this.progressTotal), this.progressTotal);
    var callback = this._callbacks.get(flowerObj);
    if (callback) callback(flowerObj);
    if (this.discoveredCount === this.flowers.length) {
      this._finalizing = true;
      this.setInteractive(false);
      this.playFinalAnimation().then(function () {
        if (typeof this.onComplete === "function") this.onComplete();
      }.bind(this));
    }
    return true;
  };

  BouquetScene.prototype.playFinalAnimation = function () {
    var self = this;
    if (this._fallback) {
      this.uiController.showFinalMessage(this.globalConfig.bouquetCompletionMessage || "Encontraste todo lo que este ramo guardaba para vos. 💛");
      return Promise.resolve();
    }
    this.uiController.hideHint();
    this.flowers.forEach(function (flower) {
      flower.animateStemBend(0);
      flower.bloom();
    });
    return Promise.all([
      this.particleSystem.rainPetals(2000),
      this.particleSystem.formHeart(new window.THREE.Vector3(0, 12, 10), 1500),
    ]).then(function () {
      self.uiController.showFinalMessage(self.globalConfig.bouquetCompletionMessage || "Encontraste todo lo que este ramo guardaba para vos.\n\nAhora estas flores también son un poquito tuyas 💛");
    });
  };

  BouquetScene.prototype._burstFromFlower = function (localPosition) {
    if (!this.particleSystem) return;
    var world = this.bouquetGroup.localToWorld(localPosition.clone());
    this.particleSystem.burst(world, 12);
  };
  BouquetScene.prototype._startSecretEmission = function () {
    var self = this;
    var secret = this.flowers.filter(function (flower) { return flower.isSecret; })[0];
    if (!secret) return;
    this._secretTimer = setInterval(function () {
      if (!self._disposed && !secret.discovered) self.particleSystem.burst(secret.mesh.getWorldPosition(new window.THREE.Vector3()), 4);
    }, 2000);
  };

  BouquetScene.prototype._pick = function () {
    if (!this.raycaster) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    var hits = this.raycaster.intersectObjects(this.bouquetGroup.children, true);
    for (var i = 0; i < hits.length; i++) if (hits[i].object.userData.flowerObject) return hits[i].object.userData.flowerObject;
    return null;
  };
  BouquetScene.prototype._onPointerMove = function (event) {
    var rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    var flower = this._pick();
    if (flower !== this._hovered) {
      if (this._hovered) this._hovered.setHovered(false);
      if (flower) flower.setHovered(true);
      this._hovered = flower;
      this.renderer.domElement.style.cursor = flower ? "pointer" : "grab";
    }
  };
  BouquetScene.prototype._onClick = function (event) {
    if (this.interactive === false || this._dragged) return;
    this._onPointerMove(event);
    var flower = this._pick();
    if (flower) this.onFlowerDiscovered(flower); else if (this.uiController) this.uiController.hideFlowerMessage();
  };

  BouquetScene.prototype._animate = function (now) {
    if (this._disposed || !this.renderer) return;
    var delta = Math.min(50, now - (this._lastFrame || now));
    this._lastFrame = now;
    this.cameraController.update(delta);
    this.particleSystem.update(delta);
    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(this._animate.bind(this));
  };
  BouquetScene.prototype._resize = function () {
    if (!this.renderer) return;
    var width = this.container.clientWidth || window.innerWidth;
    var height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };
  BouquetScene.prototype._tween = function (duration, step) {
    return new Promise(function (resolve) {
      var start = performance.now();
      function frame(now) { var t = Math.min(1, (now - start) / duration); step(t * t * (3 - 2 * t)); if (t < 1) requestAnimationFrame(frame); else resolve(); }
      requestAnimationFrame(frame);
    });
  };

  BouquetScene.prototype._initFallback = function () {
    if (this._fallback) return;
    this._fallback = true;
    this.container.style.position = this.container.style.position || "relative";
    this._fallbackEl = document.createElement("div");
    this._fallbackEl.className = "bouquet-fallback";
    this._fallbackEl.setAttribute("aria-label", "Ramo interactivo de flores amarillas");
    this._fallbackEl.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;padding:18vh 15vw;background:radial-gradient(circle,#252211 0,#05070d 68%);";
    this.container.appendChild(this._fallbackEl);
    this.uiController = new window.BouquetUI(this.container, this.globalConfig);
    var messages = this.globalConfig.bouquetMessages || [];
    var total = this.config.flowerCount + (this.config.hasSecretFlower ? 1 : 0);
    var self = this;
    for (var i = 0; i < total; i++) {
      (function (index) {
        var secret = self.config.hasSecretFlower && index === total - 1;
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = "🌻";
        button.setAttribute("aria-label", secret ? "Flor secreta" : "Descubrir mensaje de esta flor");
        button.style.cssText = "font-size:clamp(44px,9vw,88px);border:0;background:none;cursor:pointer;filter:drop-shadow(0 0 12px #d9a928);transform:rotate(" + ((index - total / 2) * 4) + "deg);";
        var flower = { message: secret ? (self.globalConfig.secretFlowerMessage || "Encontraste la flor secreta 💛") : (messages[index] || "Esta flor floreció para vos."), discovered: false, isSecret: secret, button: button };
        self.flowers.push(flower);
        button.addEventListener("click", function () {
          if (flower.discovered || self._finalizing) return;
          flower.discovered = true; self.discoveredCount++; button.style.opacity = ".62";
          self.uiController.showFlowerMessage(flower.message);
          self.uiController.updateProgress(Math.min(self.discoveredCount, self.progressTotal), self.progressTotal);
          var cb = self._callbacks.get(flower); if (cb) cb(flower);
          if (self.discoveredCount === total) {
            self._finalizing = true;
            self.setInteractive(false);
            self.playFinalAnimation().then(function () {
              if (typeof self.onComplete === "function") self.onComplete();
            });
          }
        });
        self._fallbackEl.appendChild(button);
      })(i);
    }
    this.uiController.showProgressIndicators(this.progressTotal);
  };
  BouquetScene.prototype._formFallback = function () {
    var self = this;
    this._fallbackEl.style.opacity = "0";
    this._fallbackEl.style.transition = "opacity .8s ease";
    return new Promise(function (resolve) { requestAnimationFrame(function () { self._fallbackEl.style.opacity = "1"; setTimeout(resolve, 800); }); });
  };

  BouquetScene.prototype.cleanup = function () {
    if (this._disposed) return;
    this._disposed = true;
    cancelAnimationFrame(this._raf);
    clearInterval(this._secretTimer);
    window.removeEventListener("resize", this._boundResize);
    if (this.renderer) {
      this.renderer.domElement.removeEventListener("pointermove", this._boundPointerMove);
      this.renderer.domElement.removeEventListener("click", this._boundClick);
    }
    if (this.cameraController) this.cameraController.dispose();
    if (this.particleSystem) this.particleSystem.dispose();
    this.flowers.forEach(function (flower) { if (flower.dispose) flower.dispose(); });
    this.flowers.length = 0;
    if (this.uiController) this.uiController.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }
    if (this._fallbackEl) this._fallbackEl.remove();
    this.scene = this.camera = this.renderer = null;
  };

  window.BouquetScene = BouquetScene;
})();
