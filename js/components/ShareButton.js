/**
 * ShareButton
 * ------------------------------------------------------------
 * Usa la Web Share API nativa cuando esta disponible. Si no,
 * copia la URL al portapapeles y muestra un mensaje de exito.
 */
(function () {
  "use strict";

  function ShareButton(buttonEl, toastEl, config) {
    this.button = buttonEl;
    this.toast = toastEl;
    this.config = config;
    this.button.textContent = config.shareButtonText;

    var self = this;
    this.button.addEventListener("click", function () {
      self.share();
    });
  }

  ShareButton.prototype.share = function () {
    var self = this;
    var shareData = {
      title: this.config.shareTitle,
      text: this.config.shareText,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(function () {
        /* El usuario cancelo el dialogo de compartir: no hacemos nada mas. */
      });
      return;
    }

    this._copyToClipboard(window.location.href)
      .then(function () {
        self._showToast(self.config.shareCopiedMessage);
      })
      .catch(function () {
        self._showToast(self.config.shareCopiedMessage);
      });
  };

  ShareButton.prototype._copyToClipboard = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  ShareButton.prototype._showToast = function (message) {
    var self = this;
    this.toast.textContent = message;
    this.toast.hidden = false;
    requestAnimationFrame(function () {
      self.toast.classList.add("show");
    });
    setTimeout(function () {
      self.toast.classList.remove("show");
      setTimeout(function () {
        self.toast.hidden = true;
      }, 400);
    }, 2200);
  };

  window.ShareButton = ShareButton;
})();
