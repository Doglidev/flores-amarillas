/** Geometría procedural reutilizable para el ramo 3D. Requiere Three.js. */
(function () {
  "use strict";

  var FLOWER_COLORS = [
    { bright: 0xfff6be, mid: 0xffd83d, edge: 0xf0ae2a },
    { bright: 0xfff18a, mid: 0xffdb4d, edge: 0xe89f27 },
    { bright: 0xffffcf, mid: 0xffcf33, edge: 0xe79a21 },
    { bright: 0xfff3a4, mid: 0xffe15c, edge: 0xf2b331 },
  ];

  function requireThree() {
    if (!window.THREE) throw new Error("BouquetGeometry requiere Three.js.");
    return window.THREE;
  }

  function BouquetGeometry() {}

  BouquetGeometry.FLOWER_COLORS = FLOWER_COLORS;

  BouquetGeometry.createPetal = function (petalIndex, totalPetals, size, color) {
    var THREE = requireThree();
    var geometry = new THREE.PlaneGeometry(size * 0.72, size * 1.45, 7, 7);
    var positions = geometry.attributes.position;
    for (var i = 0; i < positions.count; i++) {
      var x = positions.getX(i);
      var y = positions.getY(i);
      var normalizedY = y / (size * 1.45) + 0.5;
      var taper = Math.sin(Math.PI * Math.max(0, normalizedY));
      positions.setX(i, x * (0.45 + taper * 0.55));
      positions.setZ(i, Math.sin(normalizedY * Math.PI) * size * 0.2);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    var material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.06),
      shininess: 45,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.96,
    });
    var petal = new THREE.Mesh(geometry, material);
    var angle = (petalIndex / totalPetals) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * size * 0.42, Math.sin(angle) * size * 0.42, 0);
    petal.rotation.set(0.18, 0, angle - Math.PI / 2);
    petal.userData.closedRotationX = petal.rotation.x;
    petal.userData.openRotationX = petal.rotation.x + 0.32;
    petal.userData.isPetal = true;
    return petal;
  };

  BouquetGeometry.createStem = function (height, curve) {
    var THREE = requireThree();
    var bend = curve || 0;
    var path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -height, 0),
      new THREE.Vector3(bend * 0.25, -height * 0.65, 0),
      new THREE.Vector3(bend * 0.75, -height * 0.25, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    var geometry = new THREE.TubeGeometry(path, 32, 0.42, 6, false);
    var material = new THREE.MeshPhongMaterial({ color: 0x426b35, emissive: 0x071407, shininess: 12 });
    var stem = new THREE.Mesh(geometry, material);
    stem.userData.isStem = true;
    return stem;
  };

  BouquetGeometry.createLeaf = function (position, size, rotation) {
    var THREE = requireThree();
    var geometry = new THREE.PlaneGeometry(size, size * 2, 4, 6);
    var positions = geometry.attributes.position;
    for (var i = 0; i < positions.count; i++) {
      var x = positions.getX(i);
      var y = positions.getY(i);
      var ny = y / (size * 2) + 0.5;
      positions.setX(i, x * Math.sin(Math.PI * ny));
      positions.setZ(i, Math.sin(ny * Math.PI * 2) * size * 0.08);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    var leaf = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({ color: 0x527a3f, emissive: 0x071007, side: THREE.DoubleSide, shininess: 18 })
    );
    leaf.position.copy(position);
    leaf.rotation.copy(rotation || new THREE.Euler());
    leaf.userData.isLeaf = true;
    return leaf;
  };

  BouquetGeometry.createFlower = function (sizeVariant) {
    var THREE = requireThree();
    var options = typeof sizeVariant === "object" ? sizeVariant : { size: sizeVariant };
    var size = options.size || 1;
    var palette = FLOWER_COLORS[options.paletteIndex == null ? Math.floor(Math.random() * FLOWER_COLORS.length) : options.paletteIndex % FLOWER_COLORS.length];
    var group = new THREE.Group();
    var flowerHead = new THREE.Group();
    flowerHead.name = "flowerHead";
    var petals = [];
    var outerCount = 10;
    var innerCount = 7;
    for (var i = 0; i < outerCount; i++) {
      var outer = BouquetGeometry.createPetal(i, outerCount, 7.2 * size, palette.mid);
      flowerHead.add(outer);
      petals.push(outer);
    }
    for (var j = 0; j < innerCount; j++) {
      var inner = BouquetGeometry.createPetal(j, innerCount, 4.8 * size, palette.bright);
      inner.position.z = 0.55 * size;
      inner.rotation.x += 0.18;
      inner.userData.openRotationX += 0.18;
      flowerHead.add(inner);
      petals.push(inner);
    }
    var center = new THREE.Mesh(
      new THREE.SphereGeometry(2.8 * size, 18, 12),
      new THREE.MeshPhongMaterial({ color: 0xffe9a6, emissive: 0x5d3b0a, shininess: 70 })
    );
    center.position.z = 1.25 * size;
    center.userData.isFlowerHitTarget = true;
    flowerHead.add(center);
    group.add(flowerHead);

    var height = 26 * size;
    group.add(BouquetGeometry.createStem(height, (Math.random() - 0.5) * 4));
    group.add(BouquetGeometry.createLeaf(new THREE.Vector3(-2.2 * size, -height * 0.45, 0), 3.3 * size, new THREE.Euler(0.2, 0.35, 0.75)));
    group.add(BouquetGeometry.createLeaf(new THREE.Vector3(2 * size, -height * 0.68, -0.3), 2.8 * size, new THREE.Euler(-0.1, -0.45, -0.75)));
    group.userData.petals = petals;
    group.userData.center = center;
    group.userData.head = flowerHead;
    group.userData.palette = palette;
    return group;
  };

  window.BouquetGeometry = BouquetGeometry;
})();
