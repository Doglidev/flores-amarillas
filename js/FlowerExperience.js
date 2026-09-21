/**
 * FlowerExperience
 * ------------------------------------------------------------
 * Orquesta toda la secuencia: cielo nocturno -> intro -> semilla
 * -> flor principal -> apertura en cascada del ramo -> narrativa
 * -> interaccion -> escena final.
 */
(function () {
  "use strict";

  function FlowerExperience(config) {
    this.config = config;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    this.isMobile = window.innerWidth <= 768;

    if (this.reducedMotion) {
      document.body.classList.add("reduced-motion");
    }

    this._cacheDom();
    this._setViewportHeight();
    this._buildStars();
    this._scheduleShootingStars();

    this.interactionCount = 0;
    this.finalShown = false;
    this.finalTimer = null;
    this.bouquetScene = null;
    this.bouquetStarted = false;
    this.bouquetFinalShown = false;

    this.intro = new window.IntroScene(this.introSceneEl, config, this._onDiscover.bind(this));
    this.musicControl = new window.MusicControl(this.musicButtonEl, this.audioEl, config);
    this.secretCard = new window.SecretFlowerCard(this.secretOverlayEl, config);

    this.storyCaption = new window.StoryCaption(this.storyCaptionEl, { reducedMotion: this.reducedMotion });
    this.tapCaption = new window.StoryCaption(this.tapCaptionEl, { reducedMotion: this.reducedMotion });

    this.particles = new window.GoldenParticles(this.particleLayerEl, { reducedMotion: this.reducedMotion, isMobile: this.isMobile });
    this.fireflies = this.isMobile ? null : new window.Fireflies(this.fireflyLayerEl, { reducedMotion: this.reducedMotion });
    this.butterflies = this.isMobile ? null : new window.Butterfly(this.butterflyLayerEl, { reducedMotion: this.reducedMotion });
    this.petalDrift = this.isMobile ? null : new window.PetalDrift(this.petalDriftLayerEl, { reducedMotion: this.reducedMotion, maxActive: 5 });

    this.garden = new window.FlowerGarden({
      gardenLayer: this.gardenLayerEl,
      particles: this.particles,
      tapCaption: this.tapCaption,
      config: config,
      reducedMotion: this.reducedMotion,
      isTouch: this.isTouch,
      isMobile: this.isMobile,
      onFlowerActivated: this._onFlowerActivated.bind(this),
      onSecretFound: this._onSecretFound.bind(this),
      onCascadeStart: this._onCascadeStart.bind(this),
    });

    this.finalMessageEl.textContent = config.finalMessage;
    if (config.finalSubMessage) {
      this.finalSubmessageEl.textContent = config.finalSubMessage;
      this.finalSubmessageEl.hidden = false;
    } else {
      this.finalSubmessageEl.hidden = true;
    }
    this.restartBtnEl.textContent = config.restartButtonText;

    this.shareButton = new window.ShareButton(this.shareBtnEl, this.toastEl, config);

    this.restartBtnEl.addEventListener("click", this.restart.bind(this));

    window.addEventListener("resize", this._setViewportHeight.bind(this));
  }

  FlowerExperience.prototype._cacheDom = function () {
    this.introSceneEl = document.getElementById("intro-scene");
    this.gardenSceneEl = document.getElementById("garden-scene");
    this.seedLayerEl = document.getElementById("seed-layer");
    this.groundGlowEl = document.getElementById("ground-glow");
    this.cascadeFlashEl = document.getElementById("cascade-flash");
    this.groundWaveEl = document.getElementById("ground-wave");
    this.gardenLayerEl = document.getElementById("garden-layer");
    this.fireflyLayerEl = document.getElementById("firefly-layer");
    this.butterflyLayerEl = document.getElementById("butterfly-layer");
    this.petalDriftLayerEl = document.getElementById("petal-drift-layer");
    this.particleLayerEl = document.getElementById("particle-layer");
    this.bouquet3DContainerEl = document.getElementById("bouquet-3d-container");
    this.storyCaptionEl = document.getElementById("story-caption");
    this.tapCaptionEl = document.getElementById("tap-caption");
    this.secretOverlayEl = document.getElementById("secret-card-overlay");
    this.finalSceneEl = document.getElementById("final-scene");
    this.finalMessageEl = document.getElementById("final-message");
    this.finalSubmessageEl = document.getElementById("final-submessage");
    this.restartBtnEl = document.getElementById("restart-btn");
    this.shareBtnEl = document.getElementById("share-btn");
    this.musicButtonEl = document.getElementById("music-control");
    this.audioEl = document.getElementById("bg-audio");
    this.toastEl = document.getElementById("toast");
    this.nightSkyEl = document.getElementById("night-sky");
  };

  FlowerExperience.prototype._setViewportHeight = function () {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
  };

  FlowerExperience.prototype._buildStars = function () {
    var total = this.reducedMotion ? 20 : 55;
    for (var i = 0; i < total; i++) {
      var star = document.createElement("div");
      star.className = "star";
      var size = 1 + Math.random() * 2;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 70 + "%";
      star.style.animationDuration = (2 + Math.random() * 4) + "s";
      star.style.animationDelay = (Math.random() * 4) + "s";
      this.nightSkyEl.appendChild(star);
    }
  };

  /** Una estrella fugaz ocasional, muy sutil, en el fondo. */
  FlowerExperience.prototype._scheduleShootingStars = function () {
    var self = this;
    if (this.reducedMotion) return;
    (function loop() {
      var delay = 14000 + Math.random() * 22000;
      self._shootingStarTimer = setTimeout(function () {
        self._spawnShootingStar();
        loop();
      }, delay);
    })();
  };

  FlowerExperience.prototype._spawnShootingStar = function () {
    var star = document.createElement("div");
    star.className = "shooting-star";
    star.style.top = 5 + Math.random() * 35 + "%";
    star.style.left = 10 + Math.random() * 60 + "%";
    this.nightSkyEl.appendChild(star);
    setTimeout(function () {
      if (star.parentNode) star.parentNode.removeChild(star);
    }, 1700);
  };

  FlowerExperience.prototype._onDiscover = function () {
    var self = this;
    this.intro.hide();

    setTimeout(function () {
      self.gardenSceneEl.hidden = false;
      self._plantSeed();
    }, this.reducedMotion ? 100 : 500);
  };

  FlowerExperience.prototype._plantSeed = function () {
    var self = this;

    if (this.reducedMotion) {
      this._growFirstFlower();
      return;
    }

    var seed = document.createElement("div");
    seed.className = "seed";
    this.seedLayerEl.appendChild(seed);

    setTimeout(function () {
      self.groundGlowEl.classList.add("show");
      seed.remove();
      setTimeout(function () {
        self._growFirstFlower();
      }, 500);
    }, 1100);
  };

  FlowerExperience.prototype._growFirstFlower = function () {
    var self = this;
    this.storyCaption.showSequence([this.config.growingMessage], {
      holdMs: this.reducedMotion ? 400 : 3400,
    });
    this.garden.buildFirstFlower(function () {
      setTimeout(function () {
        self._bloomFullGarden();
      }, self.reducedMotion ? 250 : 900);
    });
  };

  FlowerExperience.prototype._bloomFullGarden = function () {
    var self = this;
    this.removeFirstFlowerAfterDelay();

    this.garden.bloomGarden(function () {
      self._playGardenNarrative();
    });
  };

  FlowerExperience.prototype.removeFirstFlowerAfterDelay = function () {
    this.garden.removeFirstFlower();
    this.groundGlowEl.classList.remove("show");
  };

  /** Flash dorado + onda de luz + fondo mas calido, justo al iniciar la cascada. */
  FlowerExperience.prototype._onCascadeStart = function () {
    var self = this;

    this.nightSkyEl.classList.add("warm");

    if (this.fireflies) this.fireflies.spawn(this.config.fireflyCount);
    if (this.butterflies) this.butterflies.spawn(this.config.butterflyCount);
    this.particles.startAmbient(this.isMobile ? 6 : (this.reducedMotion ? 8 : 20));
    this.particles.startPollen(this.reducedMotion ? 0 : 16);
    if (this.petalDrift) this.petalDrift.start();

    if (this.reducedMotion) return;

    this.cascadeFlashEl.classList.add("flash");
    setTimeout(function () {
      self.cascadeFlashEl.classList.remove("flash");
    }, 900);

    this.groundWaveEl.classList.remove("wave");
    void this.groundWaveEl.offsetWidth;
    this.groundWaveEl.classList.add("wave");
  };

  FlowerExperience.prototype._playGardenNarrative = function () {
    var self = this;
    var holdMs = this.reducedMotion ? 400 : 2500;

    this.storyCaption.showSequence(this.config.gardenLines, {
      holdMs: holdMs,
      onDone: function () {
        self.storyCaption.showSequence(
          [
            { text: self.config.mainMessage, big: true, holdMs: self.reducedMotion ? 500 : 4400 },
            { text: self.config.mainMessageSub, big: true, holdMs: self.reducedMotion ? 400 : 3000 },
          ],
          {
            onDone: function () {
              self._startBouquetPhase();
            },
          }
        );
      },
    });
  };

  /** Inicia el ramo una sola vez, justo después del texto previo al regalo. */
  FlowerExperience.prototype._startBouquetPhase = function () {
    var self = this;
    var bouquetConfig = this.config.bouquet3D || {};
    if (!bouquetConfig.enabled || !this.bouquet3DContainerEl || !window.BouquetScene) {
      this._scheduleFinalScene();
      return;
    }
    if (this.bouquetStarted) return;
    this.bouquetStarted = true;
    this.bouquet3DContainerEl.hidden = false;
    this.bouquet3DContainerEl.setAttribute("aria-hidden", "false");
    this.gardenSceneEl.classList.add("bouquet-mode");
    this.storyCaption.clear();
    this.tapCaption.clear();

    try {
      this.bouquetScene = new window.BouquetScene(this.bouquet3DContainerEl, bouquetConfig);
      this.bouquetScene.onComplete = function () { self._showBouquetFinal(); };
      this.bouquetScene.init().then(function () {
        if (self.bouquetScene && self.bouquetScene._fallback) {
          self._disableBouquetAndContinue2D();
          return null;
        }
        return self.bouquetScene.startFormation();
      }).then(function () {
        if (!self.bouquetScene || self.bouquetScene._disposed || self.bouquetScene._fallback) return;
        self.bouquetScene.flowers.forEach(function (flower) {
          self.bouquetScene.registerFlowerClick(flower, self._onBouquetFlowerDiscovered.bind(self));
        });
        self.bouquetScene.setInteractive(true);
        self.bouquetScene.uiController.showInitialHint();
        if (self.bouquetScene.flowers[3]) {
          self.bouquetScene.uiController.demoFlower(self.bouquetScene.flowers[3], self.bouquetScene.camera);
        }
      }).catch(function (error) {
        console.error("Falló la escena 3D; se conserva la experiencia 2D.", error);
        self._disableBouquetAndContinue2D();
      });
    } catch (error) {
      console.error("Falló la inicialización 3D; se conserva la experiencia 2D.", error);
      this._disableBouquetAndContinue2D();
    }
  };

  FlowerExperience.prototype._onBouquetFlowerDiscovered = function () {
    if (!this.bouquetScene) return;
    this.interactionCount = this.bouquetScene.discoveredCount;
    if (this.interactionCount === 1 && this.bouquetScene.uiController) {
      this.bouquetScene.uiController.hideHint();
      if (this.bouquetScene.uiController._demoEl) {
        this.bouquetScene.uiController._demoEl.remove();
        this.bouquetScene.uiController._demoEl = null;
      }
    }
  };

  FlowerExperience.prototype._showBouquetFinal = function () {
    if (this.bouquetFinalShown) return;
    this.bouquetFinalShown = true;
    this.finalMessageEl.textContent = this.config.bouquetCompletionMessage || this.config.finalMessage;
    this.finalSubmessageEl.hidden = true;
    this.finalSceneEl.hidden = false;
  };

  FlowerExperience.prototype._disableBouquetAndContinue2D = function () {
    if (this.bouquetScene) {
      this.bouquetScene.cleanup();
      this.bouquetScene = null;
    }
    this.bouquetStarted = false;
    if (this.bouquet3DContainerEl) {
      this.bouquet3DContainerEl.hidden = true;
      this.bouquet3DContainerEl.setAttribute("aria-hidden", "true");
    }
    this.gardenSceneEl.classList.remove("bouquet-mode");
    this._scheduleFinalScene();
  };

  FlowerExperience.prototype._scheduleFinalScene = function () {
    var self = this;
    var timeout = this.config.finalSceneTimeoutMs || 32000;
    this.finalTimer = setTimeout(function () {
      self._showFinalScene();
    }, this.reducedMotion ? Math.min(timeout, 6000) : timeout);
  };

  FlowerExperience.prototype._onFlowerActivated = function () {
    this.interactionCount++;
    var needed = this.config.interactionsForFinal || 5;
    if (this.interactionCount >= needed) {
      this._showFinalScene();
    }
  };

  FlowerExperience.prototype._onSecretFound = function () {
    this.secretCard.show();
  };

  FlowerExperience.prototype._showFinalScene = function () {
    if (this.finalShown) return;
    this.finalShown = true;
    if (this.finalTimer) {
      clearTimeout(this.finalTimer);
      this.finalTimer = null;
    }
    this.finalSceneEl.hidden = false;
  };

  /** Reinicia toda la experiencia desde el principio. */
  FlowerExperience.prototype.restart = function () {
    var self = this;

    if (this.finalTimer) {
      clearTimeout(this.finalTimer);
      this.finalTimer = null;
    }

    this.finalSceneEl.hidden = true;
    this.finalShown = false;
    this.bouquetFinalShown = false;
    this.interactionCount = 0;

    if (this.bouquetScene) {
      this.bouquetScene.cleanup();
      this.bouquetScene = null;
    }
    this.bouquetStarted = false;
    if (this.bouquet3DContainerEl) {
      this.bouquet3DContainerEl.hidden = true;
      this.bouquet3DContainerEl.setAttribute("aria-hidden", "true");
      this.bouquet3DContainerEl.style.opacity = "";
    }

    this.garden.clear();
    if (this.fireflies) this.fireflies.clear();
    if (this.butterflies) this.butterflies.clear();
    this.particles.clear();
    if (this.petalDrift) this.petalDrift.clear();
    this.storyCaption.clear();
    this.tapCaption.clear();
    this.groundGlowEl.classList.remove("show");
    this.cascadeFlashEl.classList.remove("flash");
    this.groundWaveEl.classList.remove("wave");
    this.nightSkyEl.classList.remove("warm");
    this.gardenSceneEl.hidden = true;
    this.gardenSceneEl.classList.remove("bouquet-mode");
    this.gardenLayerEl.style.opacity = "";
    this.fireflyLayerEl.style.opacity = "";
    this.butterflyLayerEl.style.opacity = "";
    this.petalDriftLayerEl.style.opacity = "";
    this.particleLayerEl.style.opacity = "";
    this.secretCard.hide();

    this.intro.show();

    setTimeout(function () {
      self.intro.scene.style.opacity = "1";
    }, 30);
  };

  window.FlowerExperience = FlowerExperience;
})();
