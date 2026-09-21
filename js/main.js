/**
 * Punto de entrada de "Flores Amarillas".
 * Espera a que el DOM este listo y arranca la experiencia usando
 * la configuracion editable de js/config.js.
 */
(function () {
  "use strict";

  function start() {
    var config = window.FLORES_CONFIG || {};
    window.floresExperience = new window.FlowerExperience(config);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
