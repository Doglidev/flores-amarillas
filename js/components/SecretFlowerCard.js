/**
 * SecretFlowerCard
 * ------------------------------------------------------------
 * Tarjeta de vidrio esmerilado que muestra la dedicatoria secreta
 * cuando se encuentra la flor especial.
 */
(function () {
  "use strict";

  function SecretFlowerCard(overlayEl, config) {
    this.overlay = overlayEl;
    this.titleEl = overlayEl.querySelector("#secret-card-title");
    this.dedicationEl = overlayEl.querySelector("#secret-card-dedication");
    this.closeBtn = overlayEl.querySelector("#secret-card-close");
    this.config = config;
    this.shown = false;

    this.titleEl.textContent = config.secretCardTitle;
    this.dedicationEl.textContent = config.secretDedication;

    var self = this;
    this.closeBtn.addEventListener("click", function () {
      self.hide();
    });
    this.overlay.addEventListener("click", function (e) {
      if (e.target === self.overlay) self.hide();
    });
  }

  SecretFlowerCard.prototype.show = function () {
    if (this.shown) return;
    this.shown = true;
    this.overlay.hidden = false;
    var self = this;
    requestAnimationFrame(function () {
      self.overlay.classList.add("visible");
    });
  };

  SecretFlowerCard.prototype.hide = function () {
    var self = this;
    this.overlay.classList.remove("visible");
    setTimeout(function () {
      self.overlay.hidden = true;
      self.shown = false;
    }, 400);
  };

  window.SecretFlowerCard = SecretFlowerCard;
})();
