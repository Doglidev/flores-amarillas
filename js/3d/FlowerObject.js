/** Estado, interacción y animación de una flor individual. */
(function () {
  "use strict";

  function tween(duration, step) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    duration = reduced ? Math.min(duration, 80) : duration;
    return new Promise(function (resolve) {
      var start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / Math.max(1, duration));
        step(1 - Math.pow(1 - t, 3));
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function FlowerObject(geometry, position, size, message, isSecret) {
    if (!window.THREE) throw new Error("FlowerObject requiere Three.js.");
    this.mesh = new window.THREE.Group();
    this.mesh.add(geometry);
    this.mesh.position.copy(position);
    this.mesh.scale.setScalar(size || 1);
    this.mesh.userData.flowerObject = this;
    this.geometry = geometry;
    this.position = this.mesh.position;
    this.size = size || 1;
    this.message = message || "";
    this.isSecret = Boolean(isSecret);
    this.discovered = false;
    this.hovered = false;
    this._disposed = false;
    this._baseScale = this.mesh.scale.clone();
    this._baseRotation = this.mesh.rotation.clone();
    this._marker = null;
    this._burstHandler = null;
    this._materials = [];
    geometry.traverse(function (child) {
      if (child.material) this._materials.push(child.material);
      child.userData.flowerObject = this;
    }.bind(this));
    if (this.isSecret) this.highlight();
  }

  FlowerObject.prototype.setHovered = function (value) {
    if (this.discovered || this.hovered === value) return;
    this.hovered = value;
    var scale = value ? 1.06 : 1;
    this.mesh.scale.set(this._baseScale.x * scale, this._baseScale.y * scale, this._baseScale.z * scale);
    this._setEmissive(value ? 0.2 : this.isSecret ? 0.14 : 0.06);
  };

  FlowerObject.prototype.setDiscovered = function () {
    if (this.discovered) return false;
    this.discovered = true;
    this.hovered = false;
    this._setEmissive(0.32);
    var THREE = window.THREE;
    this._marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffdc55 })
    );
    this._marker.position.set(0, -9, 1);
    this.mesh.add(this._marker);
    if (this.isSecret) this._secretBlink();
    return true;
  };

  FlowerObject.prototype.reset = function () {
    this.discovered = false;
    this.hovered = false;
    this.mesh.rotation.copy(this._baseRotation);
    this.mesh.scale.copy(this._baseScale);
    if (this._marker) {
      this.mesh.remove(this._marker);
      if (this._marker.geometry) this._marker.geometry.dispose();
      if (this._marker.material) this._marker.material.dispose();
      this._marker = null;
    }
    this.highlight();
  };

  FlowerObject.prototype._setEmissive = function (strength) {
    this._materials.forEach(function (material) {
      if (material.emissive && material.color) material.emissive.copy(material.color).multiplyScalar(strength);
    });
  };

  FlowerObject.prototype.bloom = function () {
    var self = this;
    this._setEmissive(0.35);
    return Promise.all([
      this.animatePetalOpen(),
      tween(500, function (t) {
        var s = 1 + Math.sin(t * Math.PI) * 0.12;
        self.mesh.scale.set(self._baseScale.x * s, self._baseScale.y * s, self._baseScale.z * s);
      }),
    ]).then(function () { self.mesh.scale.copy(self._baseScale); });
  };

  FlowerObject.prototype.inclineTo = function (vec3) {
    if (!vec3 || !this.mesh.parent) return;
    var localTarget = this.mesh.parent.worldToLocal(vec3.clone());
    var dx = localTarget.x - this.position.x;
    var dy = localTarget.y - this.position.y;
    this.mesh.rotation.y = Math.max(-0.26, Math.min(0.26, dx * 0.012));
    this.mesh.rotation.x = Math.max(-0.26, Math.min(0.26, -dy * 0.008));
  };

  FlowerObject.prototype.emit = function () {
    if (typeof this._burstHandler === "function") this._burstHandler(this.position);
  };

  FlowerObject.prototype.highlight = function () { this._setEmissive(this.isSecret ? 0.22 : 0.12); };

  FlowerObject.prototype.animatePetalOpen = function () {
    var petals = this.geometry.userData.petals || [];
    return Promise.all(petals.map(function (petal, index) {
      var from = petal.rotation.x;
      var to = petal.userData.openRotationX || from + 0.3;
      return new Promise(function (resolve) {
        setTimeout(function () {
          tween(500, function (t) { petal.rotation.x = from + (to - from) * t; }).then(resolve);
        }, index * 22);
      });
    }));
  };

  FlowerObject.prototype.animateStemBend = function (angle) {
    var self = this;
    var from = this.mesh.rotation.z;
    return tween(450, function (t) { self.mesh.rotation.z = from + (angle - from) * t; });
  };

  FlowerObject.prototype._secretBlink = function () {
    var self = this;
    var flashes = 0;
    var id = setInterval(function () {
      self._setEmissive(flashes % 2 ? 0.3 : 0.65);
      flashes++;
      if (flashes >= 6) { clearInterval(id); self._setEmissive(0.35); }
    }, 180);
  };

  FlowerObject.prototype.dispose = function () {
    if (this._disposed) return;
    this._disposed = true;
    this.mesh.traverse(function (child) {
      if (child.geometry && child.geometry.dispose) child.geometry.dispose();
      if (child.material) {
        var materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(function (material) { if (material.dispose) material.dispose(); });
      }
    });
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
  };

  window.FlowerObject = FlowerObject;
})();
