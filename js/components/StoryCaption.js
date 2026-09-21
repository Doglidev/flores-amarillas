/**
 * StoryCaption
 * ------------------------------------------------------------
 * Muestra una linea de texto (o una secuencia de lineas, una
 * despues de la otra) centrada en pantalla, con una transicion
 * suave de aparicion/desaparicion. Se usa para la narrativa que
 * acompaña el nacimiento de las flores y para los mensajes
 * breves al tocar cada flor.
 */
(function () {
  "use strict";

  function StoryCaption(containerEl, options) {
    this.container = containerEl;
    this.reducedMotion = (options && options.reducedMotion) || false;
    this._queueToken = 0;
  }

  /**
   * Muestra una secuencia de lineas, una tras otra.
   * lines: string[] o { text, big, holdMs }[]
   * opts: { holdMs, gapMs, big, onDone }
   */
  StoryCaption.prototype.showSequence = function (lines, opts) {
    var self = this;
    opts = opts || {};
    var token = ++this._queueToken;
    var holdMs = opts.holdMs || 2600;
    var gapMs = opts.gapMs || 260;
    var items = lines.map(function (line) {
      return typeof line === "string" ? { text: line } : line;
    });

    function step(index) {
      if (token !== self._queueToken) return; // se cancelo (nueva secuencia o clear)
      if (index >= items.length) {
        self._fadeOut(function () {
          if (token === self._queueToken && opts.onDone) opts.onDone();
        });
        return;
      }
      var item = items[index];
      self._setText(item.text, opts.big || item.big);
      var duration = item.holdMs || holdMs;
      setTimeout(function () {
        if (token !== self._queueToken) return;
        if (index === items.length - 1) {
          step(index + 1);
        } else {
          self._fadeOut(function () {
            if (token !== self._queueToken) return;
            setTimeout(function () {
              step(index + 1);
            }, gapMs);
          });
        }
      }, duration);
    }

    step(0);
  };

  /** Muestra un unico mensaje breve (usado al tocar una flor). */
  StoryCaption.prototype.flash = function (text, holdMs) {
    var self = this;
    var token = ++this._queueToken;
    this._setText(text, false);
    setTimeout(function () {
      if (token !== self._queueToken) return;
      self._fadeOut();
    }, holdMs || 2400);
  };

  StoryCaption.prototype._setText = function (text, big) {
    this.container.textContent = text;
    this.container.classList.toggle("story-caption--big", !!big);
    this.container.classList.add("visible");
    this.container.hidden = false;
  };

  StoryCaption.prototype._fadeOut = function (onDone) {
    this.container.classList.remove("visible");
    if (this.reducedMotion) {
      this.container.hidden = true;
      if (onDone) onDone();
      return;
    }
    setTimeout(() => {
      this.container.hidden = true;
      if (onDone) onDone();
    }, 550);
  };

  StoryCaption.prototype.clear = function () {
    this._queueToken++;
    this.container.classList.remove("visible");
    this.container.hidden = true;
  };

  window.StoryCaption = StoryCaption;
})();
