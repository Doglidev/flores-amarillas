/**
 * MusicControl
 * ------------------------------------------------------------
 * Boton discreto que activa/silencia la musica ambiental.
 * No reproduce nada automaticamente. Si el archivo de audio no
 * existe, el boton se deshabilita visualmente sin generar
 * errores visibles para el usuario (ver /audio/README.md).
 */
(function () {
  "use strict";

  function MusicControl(buttonEl, audioEl, config) {
    this.button = buttonEl;
    this.audio = audioEl;
    this.config = config.music || {};
    this.iconOn = buttonEl.querySelector(".icon-sound-on");
    this.iconOff = buttonEl.querySelector(".icon-sound-off");
    this.playing = false;
    this.available = true;

    if (!this.config.enabled) {
      this.button.style.display = "none";
      return;
    }

    this.audio.src = this.config.src || "audio/ambient.mp3";
    this.audio.loop = this.config.loop !== false;
    this.audio.volume = typeof this.config.volume === "number" ? this.config.volume : 0.35;

    var self = this;

    // Si el archivo no existe o no se puede decodificar, deshabilitamos
    // el control sin lanzar errores visibles.
    this.audio.addEventListener("error", function () {
      self._disable();
    });

    this.button.addEventListener("click", function () {
      self.toggle();
    });

    this._updateIcon();
  }

  MusicControl.prototype._disable = function () {
    this.available = false;
    this.button.classList.add("disabled");
    this.button.title = "Agrega un archivo de audio en /audio (ver README)";
    this.button.setAttribute("aria-label", "Musica no disponible");
  };

  MusicControl.prototype.toggle = function () {
    if (!this.available) return;
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  };

  MusicControl.prototype.play = function () {
    var self = this;
    var playPromise = this.audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise
        .then(function () {
          self.playing = true;
          self._updateIcon();
        })
        .catch(function () {
          // Reproduccion bloqueada o archivo ausente: no rompemos la experiencia.
          self._disable();
        });
    } else {
      this.playing = true;
      this._updateIcon();
    }
  };

  MusicControl.prototype.pause = function () {
    this.audio.pause();
    this.playing = false;
    this._updateIcon();
  };

  MusicControl.prototype._updateIcon = function () {
    if (this.playing) {
      this.iconOn.hidden = false;
      this.iconOff.hidden = true;
      this.button.setAttribute("aria-label", "Silenciar musica ambiental");
    } else {
      this.iconOn.hidden = true;
      this.iconOff.hidden = false;
      this.button.setAttribute("aria-label", "Activar musica ambiental");
    }
  };

  window.MusicControl = MusicControl;
})();
