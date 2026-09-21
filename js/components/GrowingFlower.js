/**
 * GrowingFlower
 * ------------------------------------------------------------
 * Construye una flor amarilla grande, detallada y organica en
 * SVG (tallo -> hojas -> centro -> petalos en dos capas, con
 * degradados, variaciones y una animacion de "respiracion"), y
 * anima su crecimiento paso a paso.
 *
 * Cada flor tiene variaciones aleatorias (tamano, curva del
 * tallo, tono de amarillo, forma de cada petalo) para que el
 * ramo se vea natural y no repetitivo.
 */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var uidCounter = 0;

  function el(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    return node;
  }

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  var YELLOW_VARIANTS = [
    { bright: "#FFF6BE", mid: "#FFD83D", edge: "#F0AE2A" },
    { bright: "#FFF18A", mid: "#FFDB4D", edge: "#E89F27" },
    { bright: "#FFF6BE", mid: "#FFCF2E", edge: "#D98F1F" },
    { bright: "#FFFBE0", mid: "#FFE066", edge: "#F0B93A" },
  ];

  /**
   * options:
   *   leftPercent    - posicion horizontal (0-100)
   *   heightPx       - alto total del tallo+flor
   *   scale          - escala general
   *   petalCount     - petalos de la capa trasera (la capa delantera usa la mitad)
   *   curve          - curvatura del tallo (-1 a 1)
   *   isSecret       - marca esta flor como la flor secreta
   *   isProtagonist  - flor principal, mas grande y detallada
   *   depthLayer     - "background" | "midground" | "foreground"
   *   reducedMotion  - version simplificada
   */
  function GrowingFlower(options) {
    this.opts = Object.assign(
      {
        leftPercent: 50,
        heightPx: 220,
        scale: 1,
        petalCount: 8,
        curve: 0,
        isSecret: false,
        isProtagonist: false,
        depthLayer: "midground",
        reducedMotion: false,
        isMobile: false,
      },
      options || {}
    );
    this.uid = "f" + ++uidCounter;
    this.el = this._build();
  }

  GrowingFlower.prototype._build = function () {
    var o = this.opts;
    var uid = this.uid;
    var width = 200;
    var height = o.heightPx;
    var classes = ["flower", "depth-" + o.depthLayer];
    if (o.isSecret) classes.push("secret");
    if (o.isProtagonist) classes.push("protagonist");

    var svg = el("svg", {
      class: classes.join(" "),
      viewBox: "0 0 " + width + " " + height,
      width: (width / 2.2) * o.scale,
      height: height * o.scale,
    });
    svg.style.left = "calc(" + o.leftPercent + "% - " + ((width / 4.4) * o.scale) + "px)";

    var palette = YELLOW_VARIANTS[Math.floor(Math.random() * YELLOW_VARIANTS.length)];
    this._buildDefs(svg, palette);

    var groundY = height - 2;
    var topY = height * (o.isProtagonist ? 0.34 : 0.4);
    var curveOffset = o.curve * 22;
    var stemD =
      "M" + width / 2 + "," + groundY +
      " C" + (width / 2 + curveOffset) + "," + (groundY - (groundY - topY) * 0.6) +
      " " + (width / 2 - curveOffset * 0.6) + "," + (topY + (groundY - topY) * 0.35) +
      " " + width / 2 + "," + topY;

    var stem = el("path", { class: "stem", d: stemD, stroke: "url(#stemGrad-" + uid + ")" });
    svg.appendChild(stem);

    // Hojas (2 o 3, segun el tamano), con vena central para dar detalle.
    var leafCount = o.isProtagonist ? 3 : 2;
    var leafPositions = [0.36, 0.6, 0.78];
    var leafGroup = el("g", { class: "leaves" });
    for (var li = 0; li < leafCount; li++) {
      var t = leafPositions[li];
      var lx = width / 2 + curveOffset * (1 - t * 1.2);
      var ly = groundY - (groundY - topY) * t;
      var dir = li % 2 === 0 ? 1 : -1;
      leafGroup.appendChild(this._buildLeaf(lx, ly, dir, uid));
    }
    svg.appendChild(leafGroup);

    // Flor: ancla de posicion (solo atributo SVG) -> grupo de inclinacion
    // (tilt, CSS) -> grupo de respiracion (breathe, CSS) -> contenido.
    // Separar estos tres niveles evita que distintas animaciones CSS
    // (todas usan la propiedad "transform") se pisen entre si.
    var bloomAnchor = el("g", { class: "bloom-anchor" });
    bloomAnchor.setAttribute("transform", "translate(" + width / 2 + "," + topY + ")");

    var bloomTilt = el("g", { class: "bloom" });
    var bloomBreathe = el("g", { class: "bloom-breathe" });
    bloomTilt.appendChild(bloomBreathe);
    bloomAnchor.appendChild(bloomTilt);

    var petalCountBack = o.petalCount;
    var petalCountFront = Math.max(5, Math.round(o.petalCount * 0.68));
    var lenBack = (o.isProtagonist ? rnd(46, 54) : rnd(21, 26));
    var lenFront = lenBack * rnd(0.68, 0.78);

    var backLayer = this._buildPetalLayer(petalCountBack, lenBack, uid, "back", 0);
    var frontLayer = this._buildPetalLayer(
      petalCountFront,
      lenFront,
      uid,
      "front",
      360 / petalCountFront / 2
    );
    bloomBreathe.appendChild(backLayer);
    bloomBreathe.appendChild(frontLayer);

    // Halo calido de brillo (aparece al terminar de florecer)
    var halo = el("circle", {
      class: "flower-halo",
      r: lenBack * 1.15,
      fill: "url(#haloGrad-" + uid + ")",
    });
    bloomBreathe.appendChild(halo);

    // Centro: disco con textura de estambres detallados
    var centerGroup = el("g", { class: "flower-center-group" });

    // Sombra sutil detras del centro
    var centerShadow = el("circle", {
      class: "flower-center-shadow",
      r: lenBack * 0.27,
      fill: "url(#centerGrad-" + uid + ")",
      opacity: 0.4,
    });
    centerGroup.appendChild(centerShadow);

    var centerDisc = el("circle", {
      class: "flower-center",
      r: lenBack * 0.26,
      fill: "url(#centerGrad-" + uid + ")",
    });
    centerGroup.appendChild(centerDisc);

    var stamens = el("g", { class: "stamens" });
    var stamenCount = Math.round(lenBack * 0.7); // mas estambres para mas detalle
    for (var si = 0; si < stamenCount; si++) {
      var sAngle = (360 / stamenCount) * si + rnd(-5, 5);
      var sLen = lenBack * 0.18 * rnd(0.8, 1.15);
      var rad = (sAngle * Math.PI) / 180;
      var sx = Math.cos(rad) * sLen;
      var sy = Math.sin(rad) * sLen;
      var stamenLine = el("line", {
        class: "stamen",
        x1: 0,
        y1: 0,
        x2: sx,
        y2: sy,
        stroke: "rgba(197, 138, 36, 0.7)",
        "stroke-width": 0.7,
      });
      stamens.appendChild(stamenLine);
      var tipRadius = lenBack * 0.025 + rnd(0.2, 0.6);
      var tip = el("circle", {
        class: "stamen-tip",
        cx: sx,
        cy: sy,
        r: tipRadius,
        fill: "#D4A044",
      });
      stamens.appendChild(tip);
    }
    centerGroup.appendChild(stamens);
    bloomBreathe.appendChild(centerGroup);

    svg.appendChild(bloomAnchor);

    this.lenBack = lenBack;
    return svg;
  };

  GrowingFlower.prototype._buildDefs = function (svg, palette) {
    var uid = this.uid;
    var defs = el("defs");

    // Gradiente trasero: mas sombrio, mas profundidad
    var petalGradBack = el("radialGradient", { id: "petalGradBack-" + uid, cx: "45%", cy: "15%", r: "80%" });
    petalGradBack.appendChild(el("stop", { offset: "0%", "stop-color": palette.bright }));
    petalGradBack.appendChild(el("stop", { offset: "45%", "stop-color": palette.mid }));
    petalGradBack.appendChild(el("stop", { offset: "75%", "stop-color": palette.edge }));
    petalGradBack.appendChild(el("stop", { offset: "100%", "stop-color": palette.edge, "stop-opacity": 0.7 }));
    defs.appendChild(petalGradBack);

    // Gradiente frontal: mas luminoso, mas vibrante
    var petalGradFront = el("radialGradient", { id: "petalGradFront-" + uid, cx: "48%", cy: "8%", r: "92%" });
    petalGradFront.appendChild(el("stop", { offset: "0%", "stop-color": "#FFFDEB" }));
    petalGradFront.appendChild(el("stop", { offset: "30%", "stop-color": palette.bright }));
    petalGradFront.appendChild(el("stop", { offset: "60%", "stop-color": palette.mid }));
    petalGradFront.appendChild(el("stop", { offset: "100%", "stop-color": palette.edge }));
    defs.appendChild(petalGradFront);

    var centerGrad = el("radialGradient", { id: "centerGrad-" + uid, cx: "40%", cy: "35%", r: "70%" });
    centerGrad.appendChild(el("stop", { offset: "0%", "stop-color": "#FFE9A6" }));
    centerGrad.appendChild(el("stop", { offset: "55%", "stop-color": "#F5C451" }));
    centerGrad.appendChild(el("stop", { offset: "100%", "stop-color": "#C98A24" }));
    defs.appendChild(centerGrad);

    var haloGrad = el("radialGradient", { id: "haloGrad-" + uid, cx: "50%", cy: "50%", r: "50%" });
    haloGrad.appendChild(el("stop", { offset: "0%", "stop-color": "#FFF6BE", "stop-opacity": 0.55 }));
    haloGrad.appendChild(el("stop", { offset: "100%", "stop-color": "#FFF6BE", "stop-opacity": 0 }));
    defs.appendChild(haloGrad);

    var stemGrad = el("linearGradient", { id: "stemGrad-" + uid, x1: "0%", y1: "100%", x2: "0%", y2: "0%" });
    stemGrad.appendChild(el("stop", { offset: "0%", "stop-color": "#2F6438" }));
    stemGrad.appendChild(el("stop", { offset: "100%", "stop-color": "#4C8E52" }));
    defs.appendChild(stemGrad);

    var leafGrad = el("linearGradient", { id: "leafGrad-" + uid, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    leafGrad.appendChild(el("stop", { offset: "0%", "stop-color": "#4C8E52" }));
    leafGrad.appendChild(el("stop", { offset: "100%", "stop-color": "#2C5A34" }));
    defs.appendChild(leafGrad);

    svg.appendChild(defs);
  };

  GrowingFlower.prototype._buildPetalLayer = function (count, len, uid, kind, angleOffset) {
    var layer = el("g", { class: "petal-layer petal-layer-" + kind });
    var gradId = kind === "front" ? "petalGradFront-" + uid : "petalGradBack-" + uid;

    for (var i = 0; i < count; i++) {
      var angle = (360 / count) * i + angleOffset + rnd(-3, 3);
      var petalGroup = el("g", { transform: "rotate(" + angle + ")" });

      // Petalo mas organico con forma mas realista (tipo gota)
      var petalWidth = len * rnd(0.36, 0.46);
      var lenJitter = len * rnd(0.92, 1.08);
      var asym = rnd(-0.15, 0.15);

      // Forma de petalo mejorada: mas curvas organicas, puntiagudo arriba, ancho abajo
      var p1_x = petalWidth * (0.8 + asym * 0.5);
      var p1_y = -lenJitter * 0.25;
      var p2_x = petalWidth * (0.95 + asym * 0.3);
      var p2_y = -lenJitter * 0.65;
      var p3_x = petalWidth * (0.7 + asym * 0.2);
      var p3_y = -lenJitter * 0.95;

      var d =
        "M0,0" +
        " C" + p1_x + "," + p1_y +
        " " + p2_x + "," + p2_y +
        " " + p3_x + "," + p3_y +
        " C" + (p3_x * 0.5) + "," + (-lenJitter * 0.98) +
        " " + (petalWidth * 0.3) + "," + (-lenJitter * 1.02) +
        " 0," + (-lenJitter * 0.95) +
        " C-" + (petalWidth * 0.3) + "," + (-lenJitter * 1.02) +
        " -" + (p3_x * 0.5) + "," + (-lenJitter * 0.98) +
        " -" + p3_x + "," + p3_y +
        " C-" + p2_x + "," + p2_y +
        " -" + p1_x + "," + p1_y +
        " 0,0 Z";

      var petal = el("path", {
        class: "petal petal-" + kind,
        d: d,
        fill: "url(#" + gradId + ")",
      });
      petal.style.setProperty("--petal-i", i);
      petal.style.setProperty("--petal-delay-scale", kind === "front" ? "1" : "0.7");

      // Linea central (nervadura) + sombra sutil en bordes para profundidad
      var vein = el("line", {
        class: "petal-vein",
        x1: 0,
        y1: "-2",
        x2: 0,
        y2: -lenJitter * 0.92,
        stroke: "rgba(0,0,0,0.08)",
        "stroke-width": "0.5",
      });

      petalGroup.appendChild(petal);
      petalGroup.appendChild(vein);
      layer.appendChild(petalGroup);
    }
    return layer;
  };

  GrowingFlower.prototype._buildLeaf = function (x, y, dir, uid) {
    var w = rnd(20, 30) * dir;
    var len = rnd(16, 24);
    var d =
      "M" + x + "," + y +
      " C" + (x + w * 0.25) + "," + (y - len * 0.5) +
      " " + (x + w) + "," + (y - len * 0.35) +
      " " + (x + w * 0.95) + "," + y +
      " C" + (x + w) + "," + (y + len * 0.4) +
      " " + (x + w * 0.25) + "," + (y + len * 0.55) +
      " " + x + "," + y + " Z";

    var group = el("g", { class: "leaf" });
    group.style.transformBox = "view-box";
    group.style.transformOrigin = x + "px " + y + "px";
    group.style.setProperty("--leaf-closed", "rotate(" + (-dir * 46) + "deg) scale(0.2)");

    var shape = el("path", { class: "leaf-shape", d: d, fill: "url(#leafGrad-" + uid + ")" });
    var vein = el("path", {
      class: "leaf-vein-line",
      d: "M" + x + "," + y + " Q" + (x + w * 0.5) + "," + y + " " + (x + w * 0.92) + "," + y,
    });
    group.appendChild(shape);
    group.appendChild(vein);
    return group;
  };

  /**
   * Ejecuta la secuencia de crecimiento: tallo -> hojas -> centro ->
   * petalos (capa trasera, luego delantera) -> halo de brillo.
   * onDone se llama cuando termina toda la animacion.
   */
  GrowingFlower.prototype.grow = function (onDone, delayMs) {
    var self = this;
    var svg = this.el;
    var stem = svg.querySelector(".stem");
    var reduced = this.opts.reducedMotion;
    delayMs = delayMs || 0;

    if (reduced) {
      svg.style.opacity = "0";
      svg.style.transition = "opacity 0.5s ease";
      setTimeout(function () {
        svg.style.opacity = "1";
        svg.classList.add("leaves-visible", "center-visible", "bloom-visible", "halo-visible");
        if (onDone) onDone();
      }, delayMs);
      return;
    }

    try {
      var len = stem.getTotalLength();
      stem.style.strokeDasharray = len;
      stem.style.strokeDashoffset = len;
    } catch (e) {
      /* getTotalLength puede fallar si el SVG aun no esta medible */
    }

    var stemDuration = this.opts.isProtagonist ? 1500 : 1000;
    if (this.opts.isMobile) stemDuration = Math.round(stemDuration * 1.6);

    setTimeout(function () {
      stem.style.transition = "stroke-dashoffset " + stemDuration + "ms cubic-bezier(.4,.7,.3,1)";
      requestAnimationFrame(function () {
        stem.style.strokeDashoffset = "0";
      });

      var tLeaves = stemDuration * 0.45;
      var tCenter = stemDuration * 0.92;
      var tBloom = stemDuration * 1.02;
      var tHalo = stemDuration * 1.02 + 650;
      var tDone = tHalo + 500;

      setTimeout(function () { svg.classList.add("leaves-visible"); }, tLeaves);
      setTimeout(function () { svg.classList.add("center-visible"); }, tCenter);
      setTimeout(function () { svg.classList.add("bloom-visible"); }, tBloom);
      setTimeout(function () { svg.classList.add("halo-visible"); }, tHalo);
      setTimeout(function () { if (onDone) onDone(); }, tDone);
    }, delayMs);
  };

  /** Activa el balanceo continuo por brisa + respiracion. */
  GrowingFlower.prototype.enableSway = function () {
    if (this.opts.reducedMotion) return;
    var a = (Math.random() * 3 + 1.5).toFixed(2);
    var b = (Math.random() * 3 + 1.5).toFixed(2);
    var duration = (3.5 + Math.random() * 2.5).toFixed(2);
    if (this.opts.isMobile) duration = (parseFloat(duration) * 1.5).toFixed(2);
    var delay = (Math.random() * 2).toFixed(2);
    this.el.style.setProperty("--sway-a", "-" + a + "deg");
    this.el.style.setProperty("--sway-b", b + "deg");
    this.el.style.animationDuration = duration + "s";
    this.el.style.animationDelay = "-" + delay + "s";
    this.el.classList.add("flower-sway");

    var breathe = this.el.querySelector(".bloom-breathe");
    if (breathe) {
      var breatheDuration = (4 + Math.random() * 2.5).toFixed(2);
      if (this.opts.isMobile) breatheDuration = (parseFloat(breatheDuration) * 1.5).toFixed(2);
      breathe.style.animationDuration = breatheDuration + "s";
      breathe.style.animationDelay = "-" + (Math.random() * 3).toFixed(2) + "s";
    }
  };

  /** Inclina la flor hacia un punto (x,y) del viewport. */
  GrowingFlower.prototype.tiltToward = function (clientX) {
    var rect = this.el.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var diff = clientX - centerX;
    var max = 13;
    var tilt = Math.max(-max, Math.min(max, diff / 9));
    this.el.style.setProperty("--tilt", tilt + "deg");
    this.el.classList.add("tilt");
  };

  GrowingFlower.prototype.resetTilt = function () {
    this.el.style.setProperty("--tilt", "0deg");
    this.el.classList.remove("tilt");
  };

  /** Devuelve el centro de la flor (bloom) en coordenadas del viewport. */
  GrowingFlower.prototype.getBloomCenter = function () {
    var bloom = this.el.querySelector(".bloom-breathe");
    var rect = bloom.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  window.GrowingFlower = GrowingFlower;
})();
