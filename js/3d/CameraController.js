/** Cámara orbital ligera con mouse, touch, zoom y autorrotación. */
(function () {
  "use strict";

  function CameraController(camera, renderer, options) {
    if (!window.THREE) throw new Error("CameraController requiere Three.js.");
    this.camera = camera;
    this.renderer = renderer;
    this.domElement = renderer.domElement;
    this.options = options || {};
    this.target = new window.THREE.Vector3();
    this.distance = camera.position.length() || 80;
    this.minDistance = (this.options.zoomLimits && this.options.zoomLimits.min) || 60;
    this.maxDistance = (this.options.zoomLimits && this.options.zoomLimits.max) || 120;
    this.yaw = 0;
    this.pitch = 0;
    this.autoRotate = false;
    this.autoRotateSpeed = 0.015;
    this.dragging = false;
    this._last = { x: 0, y: 0 };
    this._zoomTween = null;
    this._listeners = [];
    this._bindEvents();
  }

  CameraController.prototype._listen = function (target, type, fn, options) {
    target.addEventListener(type, fn, options);
    this._listeners.push([target, type, fn, options]);
  };

  CameraController.prototype._bindEvents = function () {
    var self = this;
    this._listen(this.domElement, "pointerdown", function (e) { self.onMouseDown(e.clientX, e.clientY); });
    this._listen(window, "pointermove", function (e) {
      if (self.dragging) self.onTouchMove(e.clientX - self._last.x, e.clientY - self._last.y);
      else self.onMouseMove(e.clientX, e.clientY);
      self._last = { x: e.clientX, y: e.clientY };
    });
    this._listen(window, "pointerup", function () { self.onMouseUp(); });
    this._listen(this.domElement, "wheel", function (e) { e.preventDefault(); self.onWheel(e.deltaY); }, { passive: false });
    this._listen(this.domElement, "touchstart", function (e) {
      if (e.touches[0]) self.onMouseDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    this._listen(this.domElement, "touchmove", function (e) {
      if (!e.touches[0]) return;
      var x = e.touches[0].clientX;
      var y = e.touches[0].clientY;
      self.onTouchMove(x - self._last.x, y - self._last.y);
      self._last = { x: x, y: y };
    }, { passive: true });
    this._listen(this.domElement, "touchend", function () { self.onTouchEnd(); }, { passive: true });
  };

  CameraController.prototype.onMouseMove = function (x, y) {
    if (this.dragging) return;
    this.pitch += (((y / window.innerHeight) - 0.5) * 0.08 - this.pitch) * 0.025;
  };
  CameraController.prototype.onMouseDown = function (x, y) { this.dragging = true; this._last = { x: x, y: y }; this.disableAutoRotate(); };
  CameraController.prototype.onMouseUp = function () { this.dragging = false; };
  CameraController.prototype.onWheel = function (delta) { this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta * 0.035)); };
  CameraController.prototype.onTouchMove = function (dx, dy) {
    this.yaw -= dx * 0.006;
    this.pitch = Math.max(-0.5, Math.min(0.5, this.pitch - dy * 0.004));
  };
  CameraController.prototype.onTouchEnd = function () { this.onMouseUp(); };

  CameraController.prototype.zoomToFlower = function (flowerObj, duration) {
    var self = this;
    var start = performance.now();
    var fromTarget = this.target.clone();
    var toTarget = flowerObj.mesh.getWorldPosition(new window.THREE.Vector3());
    var fromDistance = this.distance;
    var toDistance = Math.max(this.minDistance, fromDistance - 5);
    this.disableAutoRotate();
    this._zoomTween = function (now) {
      var t = Math.min(1, (now - start) / (duration || 1000));
      var eased = 1 - Math.pow(1 - t, 3);
      self.target.lerpVectors(fromTarget, toTarget, eased);
      self.distance = fromDistance + (toDistance - fromDistance) * eased;
      if (t >= 1) self._zoomTween = null;
    };
  };

  CameraController.prototype.resetCamera = function (duration) {
    var self = this;
    var start = performance.now();
    var fromTarget = this.target.clone();
    var fromDistance = this.distance;
    this._zoomTween = function (now) {
      var t = Math.min(1, (now - start) / (duration || 800));
      var eased = t * (2 - t);
      self.target.lerpVectors(fromTarget, new window.THREE.Vector3(), eased);
      self.distance = fromDistance + (80 - fromDistance) * eased;
      if (t >= 1) self._zoomTween = null;
    };
  };

  CameraController.prototype.enableAutoRotate = function (speed) { this.autoRotate = true; this.autoRotateSpeed = speed == null ? this.autoRotateSpeed : speed; };
  CameraController.prototype.disableAutoRotate = function () { this.autoRotate = false; };
  CameraController.prototype.update = function (deltaTime) {
    if (this._zoomTween) this._zoomTween(performance.now());
    if (this.autoRotate && !this.dragging) this.yaw += this.autoRotateSpeed * deltaTime * 0.001;
    var cosPitch = Math.cos(this.pitch);
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * cosPitch * this.distance,
      this.target.y + Math.sin(this.pitch) * this.distance,
      this.target.z + Math.cos(this.yaw) * cosPitch * this.distance
    );
    this.camera.lookAt(this.target);
  };
  CameraController.prototype.dispose = function () {
    this._listeners.forEach(function (item) { item[0].removeEventListener(item[1], item[2], item[3]); });
    this._listeners.length = 0;
    this._zoomTween = null;
  };

  window.CameraController = CameraController;
})();
