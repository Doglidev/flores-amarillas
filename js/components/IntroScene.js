/**
 * IntroScene
 * ------------------------------------------------------------
 * Escena inicial: una o mas lineas de texto que aparecen en
 * secuencia y, al terminar, un boton luminoso con efecto
 * magnetico hacia el cursor.
 */
(function () {
  "use strict";

  function IntroScene(sceneEl, config, onDiscover) {
    this.scene = sceneEl;
    this.textEl = sceneEl.querySelector("#intro-text");
    this.button = sceneEl.querySelector("#discover-btn");
    this.buttonLabel = sceneEl.querySelector("#discover-btn-label");
    this.onDiscover = onDiscover;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.lines = config.introLines && config.introLines.length
      ? config.introLines
      : [config.introMessage || ""];
    this.buttonLabel.textContent = config.discoverButtonText;

    this.button.style.opacity = "0";
    this.button.style.pointerEvents = "none";

    this._bindMagnetic();
    this._bindDiscover();
    this._playLines();
  }

  IntroScene.prototype._playLines = function () {
    var self = this;
    var token = (this._token = (this._token || 0) + 1);
    var holdMs = this.reducedMotion ? 350 : 2200;
    var gapMs = this.reducedMotion ? 80 : 500;

    function step(index) {
      if (token !== self._token) return;
      if (index >= self.lines.length) {
        self._revealButton();
        return;
      }
      self.textEl.textContent = self.lines[index];
      self.textEl.classList.remove("intro-text--out");
      self.textEl.classList.add("intro-text--in");
      setTimeout(function () {
        if (token !== self._token) return;
        if (index === self.lines.length - 1) {
          step(index + 1);
          return;
        }
        self.textEl.classList.remove("intro-text--in");
        self.textEl.classList.add("intro-text--out");
        setTimeout(function () {
          step(index + 1);
        }, gapMs);
      }, holdMs);
    }

    step(0);
  };

  IntroScene.prototype._revealButton = function () {
    this.button.style.transition = "opacity 1.1s ease, transform 0.25s ease";
    this.button.style.opacity = "1";
    this.button.style.pointerEvents = "auto";
  };

  IntroScene.prototype._bindMagnetic = function () {
    var btn = this.button;
    var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    var strength = 18;
    btn.addEventListener("mousemove", function (e) {
      var rect = btn.getBoundingClientRect();
      var relX = e.clientX - (rect.left + rect.width / 2);
      var relY = e.clientY - (rect.top + rect.height / 2);
      var moveX = Math.max(-strength, Math.min(strength, relX * 0.25));
      var moveY = Math.max(-strength, Math.min(strength, relY * 0.35));
      btn.style.transform = "translate(" + moveX + "px," + moveY + "px)";
    });

    btn.addEventListener("mouseleave", function () {
      btn.style.transform = "";
    });
  };

  IntroScene.prototype._bindDiscover = function () {
    var self = this;
    this.button.addEventListener("click", function () {
      self.onDiscover();
    });
  };

  IntroScene.prototype.hide = function () {
    var self = this;
    this.scene.style.transition = "opacity 0.7s ease";
    this.scene.style.opacity = "0";
    setTimeout(function () {
      self.scene.hidden = true;
    }, 700);
  };

  IntroScene.prototype.show = function () {
    this.scene.hidden = false;
    this.scene.style.opacity = "";
    this.button.style.opacity = "0";
    this.button.style.pointerEvents = "none";
    this.textEl.classList.remove("intro-text--in", "intro-text--out");
    this._playLines();
  };

  window.IntroScene = IntroScene;
})();
