/** Sistema único de partículas para formación, bursts, ambiente y final. */
(function () {
  "use strict";

  function ParticleSystem(scene, maxParticles) {
    if (!window.THREE) throw new Error("ParticleSystem requiere Three.js.");
    this.scene = scene;
    this.maxParticles = Math.min(1000, maxParticles || 1000);
    this.effects = [];
    this.ambientPoints = null;
    this._disposed = false;
  }

  ParticleSystem.prototype._points = function (count, color, size, opacity) {
    var THREE = window.THREE;
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    var material = new THREE.PointsMaterial({
      color: color || 0xffd83d,
      size: size || 1.2,
      transparent: true,
      opacity: opacity == null ? 0.9 : opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    var points = new THREE.Points(geometry, material);
    this.scene.add(points);
    return points;
  };

  ParticleSystem.prototype.morphFlowerBouquet = function (bouquetScene, duration) {
    var self = this;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    duration = reduced ? 250 : Math.max(4000, Math.min(6000, duration || 5000));
    var count = reduced ? 70 : Math.min(420, this.maxParticles);
    var points = this._points(count, 0xffd83d, 1.35, 0.95);
    var positions = points.geometry.attributes.position.array;
    var starts = [];
    var ends = [];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var radius = 35 + Math.random() * 35;
      starts.push({ x: Math.cos(angle) * radius, y: -28 + Math.random() * 30, z: (Math.random() - 0.5) * 25, phase: angle });
      var flower = bouquetScene.flowers[i % bouquetScene.flowers.length];
      ends.push({ x: flower.position.x + (Math.random() - 0.5) * 8, y: flower.position.y + (Math.random() - 0.5) * 8, z: flower.position.z + (Math.random() - 0.5) * 5 });
    }
    points.geometry.setDrawRange(0, count);
    return new Promise(function (resolve) {
      var startTime = performance.now();
      function frame(now) {
        if (self._disposed) { resolve(); return; }
        var t = Math.min(1, (now - startTime) / duration);
        var convergence = t < 0.3 ? t / 0.3 * 0.35 : t < 0.7 ? 0.35 + ((t - 0.3) / 0.4) * 0.5 : 0.85 + ((t - 0.7) / 0.3) * 0.15;
        var eased = convergence < 0.5 ? 2 * convergence * convergence : 1 - Math.pow(-2 * convergence + 2, 2) / 2;
        for (var i = 0; i < count; i++) {
          var s = starts[i];
          var e = ends[i];
          var spiral = Math.sin(t * Math.PI) * (1 - t) * 13;
          positions[i * 3] = s.x + (e.x - s.x) * eased + Math.cos(s.phase + t * 10) * spiral;
          positions[i * 3 + 1] = s.y + (e.y - s.y) * eased + Math.sin(s.phase + t * 10) * spiral;
          positions[i * 3 + 2] = s.z + (e.z - s.z) * eased;
        }
        points.geometry.attributes.position.needsUpdate = true;
        points.material.size = 1.1 + Math.sin(t * Math.PI) * 1.1;
        if (t < 1) requestAnimationFrame(frame);
        else {
          self._remove(points);
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  };

  ParticleSystem.prototype.burst = function (position, count) {
    var self = this;
    count = Math.min(count || 15, this.maxParticles);
    var points = this._points(count, 0xffe471, 1.5, 1);
    var array = points.geometry.attributes.position.array;
    var velocity = [];
    for (var i = 0; i < count; i++) {
      array[i * 3] = position.x; array[i * 3 + 1] = position.y; array[i * 3 + 2] = position.z;
      velocity.push(new window.THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.1) * 15, (Math.random() - 0.5) * 12));
    }
    this._animate(900, function (t, dt) {
      for (var j = 0; j < count; j++) {
        array[j * 3] += velocity[j].x * dt;
        array[j * 3 + 1] += velocity[j].y * dt;
        array[j * 3 + 2] += velocity[j].z * dt;
        velocity[j].y -= 12 * dt;
      }
      points.geometry.attributes.position.needsUpdate = true;
      points.material.opacity = 1 - t;
    }).then(function () { self._remove(points); });
  };

  ParticleSystem.prototype.rainPetals = function (duration) {
    var self = this;
    var count = 90;
    var points = this._points(count, 0xffd83d, 2.2, 0.9);
    var array = points.geometry.attributes.position.array;
    for (var i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 100;
      array[i * 3 + 1] = 45 + Math.random() * 50;
      array[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return this._animate(duration || 2000, function (t, dt) {
      for (var j = 0; j < count; j++) {
        array[j * 3] += Math.sin(t * 15 + j) * dt * 4;
        array[j * 3 + 1] -= (28 + (j % 8)) * dt;
      }
      points.geometry.attributes.position.needsUpdate = true;
      points.material.opacity = Math.min(1, (1 - t) * 2);
    }).then(function () { self._remove(points); });
  };

  ParticleSystem.prototype.formHeart = function (center, duration) {
    var self = this;
    var count = 140;
    var points = this._points(count, 0xffd83d, 1.6, 1);
    var array = points.geometry.attributes.position.array;
    center = center || new window.THREE.Vector3(0, 10, 4);
    var targets = [];
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2;
      targets.push(new window.THREE.Vector3(center.x + Math.pow(Math.sin(a), 3) * 1.1, center.y + (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 0.85, center.z));
      array[i * 3] = center.x + (Math.random() - 0.5) * 45;
      array[i * 3 + 1] = center.y + (Math.random() - 0.5) * 45;
      array[i * 3 + 2] = center.z + (Math.random() - 0.5) * 15;
    }
    var initial = Array.prototype.slice.call(array);
    return this._animate(duration || 1500, function (t) {
      var eased = 1 - Math.pow(1 - t, 3);
      for (var j = 0; j < count; j++) {
        array[j * 3] = initial[j * 3] + (targets[j].x - initial[j * 3]) * eased;
        array[j * 3 + 1] = initial[j * 3 + 1] + (targets[j].y - initial[j * 3 + 1]) * eased;
        array[j * 3 + 2] = initial[j * 3 + 2] + (targets[j].z - initial[j * 3 + 2]) * eased;
      }
      points.geometry.attributes.position.needsUpdate = true;
    }).then(function () {
      return self._animate(900, function (t) { points.material.opacity = 1 - t; });
    }).then(function () { self._remove(points); });
  };

  ParticleSystem.prototype.ambient = function (count) {
    if (this.ambientPoints) this._remove(this.ambientPoints);
    count = Math.min(count || 20, 100);
    var points = this._points(count, 0xffe69a, 0.8, 0.55);
    var array = points.geometry.attributes.position.array;
    for (var i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 110;
      array[i * 3 + 1] = (Math.random() - 0.5) * 70;
      array[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }
    this.ambientPoints = points;
  };

  ParticleSystem.prototype.update = function (deltaTime) {
    if (!this.ambientPoints) return;
    var array = this.ambientPoints.geometry.attributes.position.array;
    for (var i = 0; i < array.length / 3; i++) {
      array[i * 3 + 1] += deltaTime * 0.0015;
      array[i * 3] += Math.sin(performance.now() * 0.0004 + i) * deltaTime * 0.0002;
      if (array[i * 3 + 1] > 38) array[i * 3 + 1] = -38;
    }
    this.ambientPoints.geometry.attributes.position.needsUpdate = true;
  };

  ParticleSystem.prototype._animate = function (duration, step) {
    var self = this;
    return new Promise(function (resolve) {
      var start = performance.now();
      var previous = start;
      function frame(now) {
        if (self._disposed) { resolve(); return; }
        var t = Math.min(1, (now - start) / Math.max(1, duration));
        step(t, Math.min(0.05, (now - previous) / 1000));
        previous = now;
        if (t < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  };

  ParticleSystem.prototype._remove = function (points) {
    if (!points) return;
    this.scene.remove(points);
    points.geometry.dispose();
    points.material.dispose();
    if (this.ambientPoints === points) this.ambientPoints = null;
  };
  ParticleSystem.prototype.dispose = function () { this._disposed = true; this._remove(this.ambientPoints); this.effects.length = 0; };

  window.ParticleSystem = ParticleSystem;
})();
