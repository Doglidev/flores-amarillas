# ESPECIFICACIÓN: Ramo 3D Interactivo — Flores Amarillas

**Versión**: 1.0  
**Estado**: Especificación técnica para desarrollo asistido (Codex/Copilot)  
**Fecha**: 2026-09-21

---

## 1. VISIÓN GENERAL

Agregar a la experiencia "Flores Amarillas" una escena 3D cinematográfica que suceda después de la introducción 2D actual.

### Flujo de usuario
```
[Intro 2D: "Hoy quería regalarte..." → Botón "Ver mi regalo"]
          ↓
[Jardín pequeño 2D comienza a florecer]
          ↓
[Transformación: flores 2D → partículas doradas → convergencia 3D]
          ↓
[Ramo 3D grande se materializa (4-6 seg)]
          ↓
[Usuario interactúa: toca flores, descubre 7 mensajes + 1 secreto]
          ↓
[Progreso visual: contador + indicadores]
          ↓
[Final: lluvia de pétalos + corazón + "Encontraste todo..."]
          ↓
[Botones: "Hacerlo florecer otra vez" / "Regalar estas flores"]
```

---

## 2. ARQUITECTURA TÉCNICA

### 2.1 Stack
- **Motor 3D**: Three.js r168+
- **Lenguaje**: JavaScript (ES6+)
- **Render**: WebGL (con fallback Canvas)
- **Animaciones**: Three.js Tween + custom requestAnimationFrame
- **Responsividad**: CSS media queries + device detection

### 2.2 Estructura de archivos (nuevos)
```
js/
  lib/
    three.min.js                 (descargado o bundled)
  3d/
    BouquetScene.js              Orquestador principal 3D
    BouquetGeometry.js           Generador procedural de flores
    ParticleSystem.js            Gestión de partículas
    FlowerObject.js              Flor 3D interactiva individual
    CameraController.js          Gestión de cámara y zoom
  components/
    BouquetUI.js                 HUD: mensajes, progreso, indicaciones
```

### 2.3 Flujo de datos
```
FlowerExperience (orquestador existente)
  ├→ [Intro 2D] (actual)
  ├→ [Transformación]
  │   └→ ParticleSystem.morph()
  │       └→ BouquetScene.spawn()
  ├→ [Ramo 3D] (nuevo)
  │   ├→ BouquetScene
  │   │   ├→ BouquetGeometry (7-9 FlowerObjects)
  │   │   ├→ ParticleSystem (efectos dinámicos)
  │   │   └→ CameraController (interacción + rotación auto)
  │   └→ BouquetUI
  │       ├→ Mensajes por flor
  │       ├→ Progreso (1/7, 2/7, ...)
  │       └→ Indicaciones iniciales
  └→ [Final] (redirección existente)
```

---

## 3. COMPONENTES DETALLADOS

### 3.1 BouquetScene.js

**Responsabilidades**:
- Instanciar Three.js (escena, cámara, renderer)
- Inicializar iluminación (nocturna cálida)
- Gestionar array de FlowerObjects (7-9)
- Orquestar formación por partículas (4-6 seg)
- Llamar a animaciones finales (corazón, lluvia)
- Limpiar recursos al cerrar

**Constructor**:
```javascript
class BouquetScene {
  constructor(containerEl, config) {
    this.container = containerEl
    this.config = config
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.flowers = []        // Array<FlowerObject>
    this.particleSystem = null
    this.cameraController = null
    this.uiController = null
    this.discoveredCount = 0
  }
  
  init()              // Setup escena, iluminación, cámara
  loadFlowers()       // Crea 7-9 FlowerObjects + los agrega a escena
  formBouquet()       // Anima formación desde partículas (4-6 seg)
  registerFlowerClick(flowerObj)  // Detector de clic/toque
  onFlowerDiscovered(flowerObj)   // Callback: procesa descubrimiento
  playFinalAnimation()  // Lluvia de pétalos + corazón
  cleanup()           // Destruye renderer, geometrías, etc.
}
```

**Iluminación**:
- 1× Luz ambiental cálida (0xFFD700, intensidad 0.6)
- 1× Luz direccional (0xFFEECC, intensidad 1.2, rotada 45°/-45°)
- 1× Luz puntual centrada en ramo (0xFFD83D, intensidad 0.8, radio 300)
- Fog suave (0x05070D, start 50, end 500)

**Cámara**:
- Posición inicial: (0, 0, 80)
- Target: (0, 0, 0)
- FOV: 75
- Aspecto: Viewport actual
- Near/Far: 0.1 / 1000

### 3.2 BouquetGeometry.js

**Responsabilidades**:
- Generar geometrías procedurales de flores
- Variar tamaño, rotación, color dentro de paleta
- No usar modelos externos (.gltf/.obj)

**API**:
```javascript
class BouquetGeometry {
  static createFlower(sizeVariant) 
    → THREE.Group con petals + stem + leaves
  
  static createPetal(petalIndex, totalPetals, size, color)
    → THREE.Mesh (geometría Bezier suavizada)
  
  static createStem(height, curve)
    → THREE.Mesh (tubo curvo)
  
  static createLeaf(position, size, rotation)
    → THREE.Mesh (geometría plana con normal map simulado)
}
```

**Geometrías**:
- **Pétalo**: Plano de 64 vértices, curva suave (shader personalizado opcional)
- **Tallo**: TubeGeometry con 32 segmentos, radio 2px
- **Hoja**: PlaneGeometry rotada, con pequeña ondulación
- **Centro**: SphereGeometry radio 4px, color #FFE9A6

**Colores**:
```javascript
const FLOWER_COLORS = [
  { bright: "#FFF6BE", mid: "#FFD83D", edge: "#F0AE2A" },
  { bright: "#FFF18A", mid: "#FFDB4D", edge: "#E89F27" },
  // ... (4 variantes totales)
]
```

### 3.3 FlowerObject.js

**Responsabilidades**:
- Wrapper de una flor individual en la escena 3D
- Manejo de estados (discovered, highlighted, hovered)
- Efectos visuales (brillo, abertura, inclinación)
- Detección de interacción (raycast)

**Propiedades**:
```javascript
class FlowerObject {
  constructor(geometry, position, size, message, isSecret = false) {
    this.mesh = new THREE.Group()  // Contiene pétals, stem, leaves, center
    this.position = position       // Vector3
    this.size = size               // 0.6..1.2
    this.message = message         // string (1/7 mensajes)
    this.isSecret = isSecret       // boolean
    this.discovered = false        // boolean
    this.hovered = false           // boolean
  }
  
  // Métodos de estado
  setHovered(bool)
  setDiscovered()
  
  // Efectos visuales
  bloom()           // Emite luz, abre pétalos +20%
  inclineTo(vec3)   // Rota hacia un punto (cursor/usuario)
  emit()            // Libera partículas doradas
  highlight()      // Brillo sutil si está oculta o descubierta
  
  // Animación
  animatePetalOpen()      // Abre pétalos en cascada (0.5 seg)
  animateStemBend(angle)  // Inclina tallo
  
  // Limpieza
  dispose()
}
```

**Estados visuales**:
- **Normal**: Ligeramente oscura, sin brillo
- **Hovered**: +20% brillo, pétals ligeramente abiertos
- **Discovered**: Punto luminoso en el tallo (+70% brillo en ese punto), marcada visualmente

### 3.4 ParticleSystem.js

**Responsabilidades**:
- Partículas ambientales (flotantes)
- Partículas de formación (4-6 seg: flores 2D → ramo 3D)
- Burst de partículas (al tocar una flor)
- Lluvia de pétalos (final)
- Corazón de partículas (final)

**API**:
```javascript
class ParticleSystem {
  constructor(scene, maxParticles = 1000)
  
  // Formación
  morphFlowerBouquet(bouquetScene, duration = 5000)
    // Anima conversión del jardín 2D a ramo 3D por partículas
  
  // Interacción
  burst(position, count = 15)  // Explosion de partículas desde una flor
  
  // Final
  rainPetals(duration = 2000)   // Lluvia de pétalos amarillos
  formHeart(center, duration = 1500)  // Formación de corazón
  
  // Ambiente
  ambient(count = 20)  // Partículas flotantes suaves, loop
  
  // Limpieza
  dispose()
}
```

**Geometría de partículas**:
- BufferGeometry con instancing (una única geometría, múltiples transforms)
- Punto o esfera minúscula (radius 1px)
- Material ShaderMaterial con alpha fade

### 3.5 CameraController.js

**Responsabilidades**:
- Rotación automática suave del ramo (cuando está inactivo)
- Manipulación por mouse (drag) o touch (swipe)
- Zoom limitado (no permitir desenfoque)
- Acercamiento suave al tocar una flor

**API**:
```javascript
class CameraController {
  constructor(camera, renderer)
  
  // Control
  onMouseMove(x, y)      // Tilt viewport si no hay drag
  onMouseDown(x, y)      // Inicia drag
  onMouseUp()            // Termina drag
  onWheel(delta)         // Zoom limitado: 60..120 de distancia
  
  // Toque (móvil)
  onTouchMove(dx, dy)
  onTouchEnd()
  
  // Animación
  zoomToFlower(flowerObj, duration = 1000)  // Acerca cámara a flor
  resetCamera(duration = 800)                // Vuelve a posición inicial
  enableAutoRotate(speed = 0.02)            // Rotación automática suave
  disableAutoRotate()                       // Pausa rotación
  
  update(deltaTime)  // Llamar en RAF loop
  
  dispose()
}
```

### 3.6 BouquetUI.js

**Responsabilidades**:
- Renderizar mensajes de flores en tarjetas de vidrio
- Mostrar contador "1/7", "2/7", etc.
- Mostrar indicadores de progreso (pétalos luminosos)
- Mostrar indicaciones iniciales ("Entre estas flores...", "Tocá los pétalos...")
- Demo de interactividad (pétalo con pulso, cursor → mano)

**API**:
```javascript
class BouquetUI {
  constructor(containerEl)
  
  // Indicaciones
  showInitialHint()              // "Entre estas flores escondí algo..."
  hideHint()
  demoFlower(flowerObj)          // Muestra demo visual (pétalo pulsando, etc.)
  
  // Mensajes
  showFlowerMessage(text, position3D)  // Tarjeta de vidrio con mensaje
  hideFlowerMessage()
  
  // Progreso
  updateProgress(discovered, total)   // "3/7 mensajes encontrados"
  showProgressIndicators(total)       // 7 pétalos, iluminar según descubiertos
  highlightIndicator(index)
  
  // Final
  showFinalMessage(text)  // "Encontraste todo lo que este ramo guardaba..."
  
  dispose()
}
```

**Tarjeta de vidrio**:
- Posición: 3D→2D screenspace, centrado sobre flor
- Fondo: rgba(255,248,231,0.08) con backdrop-filter blur
- Borde: 1px solid rgba(255,248,231,0.25)
- Border-radius: 20px
- Padding: 24px
- Font: serif 18px, italic
- Desaparece al hacer clic fuera o después de 5 seg

---

## 4. FLUJO DE ANIMACIÓN: FORMACIÓN (4-6 seg)

### Fase 1: Emisión (0-1.5 seg)
- Flores 2D (del jardín actual) comienzan a emitir partículas doradas
- 20-30 partículas por flor, animadas hacia el centro pantalla
- Opacidad: 1 → 0 en flores 2D mientras las partículas escapan

### Fase 2: Convergencia (1.5-3.5 seg)
- Partículas convergen al centro en remolino (spiral path)
- Rotación: acelera y desacelera (easing cubic)
- Escala partículas: 1 → 2 (mientras convergen)

### Fase 3: Materialización (3.5-6 seg)
1. Silueta luminosa del ramo aparece (líneas doradas finas)
2. Tallos y hojas se solidifican (0.5 seg)
3. Flores se materializan una por una (2 seg total, escalonado)
4. Pétalos se abren en cascada (1.2 seg)
5. Onda de luz recorre el ramo (0.8 seg)
6. Ramo queda "resplandeciente" con halo suave

### Easing
- Emisión: easeInOutQuad
- Convergencia: easeOutElastic
- Materialización: easeInOutCubic
- Onda de luz: easeInOutSine

---

## 5. INTERACCIÓN CON FLORES

### Detección
- Raycast desde cámara a través del cursor/touch
- Detectar colisión con mesh de flor cada frame
- Hover: cambiar color + brillo
- Clic: ejecutar flujo de descubrimiento

### Flujo de descubrimiento (2-3 seg)
1. Cámara acerca sutilmente (+5 unidades hacia flor)
2. Flor se inclina hacia frente (+15°)
3. Pétalos abren 30% más
4. ParticleSystem.burst(flowerPos, 12 partículas)
5. Fondo se oscurece suavemente (alpha 0 → 0.3)
6. Mensaje aparece en tarjeta de vidrio
7. Flor queda marcada (pequeño punto dorado en tallo)
8. BouquetUI.updateProgress(discoveredCount, 7)
9. Al cerrar el mensaje, cámara vuelve a posición normal (0.6 seg)

### Flor secreta
- Posicionada ligeramente detrás del ramo (z-offset = -10)
- Color brillo: +40% saturación en amarillo cálido
- Emite partículas ascendentes sutiles (cada 2 seg)
- Mensaje secreto diferente (ver config)
- Al descubrirla, efecto especial: parpadeo suave x3

---

## 6. CONFIGURACIÓN (actualizar config.js)

```javascript
window.FLORES_CONFIG = {
  // ... (existente)
  
  // Escena 3D: Ramo
  bouquet3D: {
    enabled: true,
    flowerCount: 7,           // Flores principales (sin contar secreta)
    hasSecretFlower: true,    // +1 flor oculta
    formationDuration: 5000,  // ms (4000-6000)
    ambientParticles: 18,     // Flotantes suaves
    autoRotateSpeed: 0.015,   // deg/ms
    cameraZoomLimits: { min: 60, max: 120 },
  },
  
  // Mensajes de flores 3D (7 principales)
  bouquetMessages: [
    "También merecés recibir cosas bonitas.",
    "Nunca necesitás una fecha especial para florecer.",
    "Que no te falten razones para sonreír.",
    "Esta flor estaba esperando que la encontraras.",
    "Recordá siempre lo valiosa que sos.",
    "A veces, un pequeño gesto puede cambiar un día.",
    "Hoy este ramo es solamente para vos.",
  ],
  
  // Flor secreta
  secretFlowerMessage:
    "Si encontraste esta flor, descubriste el mensaje que escondí especialmente para vos.\n\nNo hace falta esperar que alguien llegue con un ramo para recordar lo especial que sos 💛",
  
  // Indicaciones iniciales
  bouquetInitialHint: "Entre estas flores escondí algo para vos.\n\nTocá los pétalos para descubrirlo.",
  
  // Final
  bouquetCompletionMessage: "Encontraste todo lo que este ramo guardaba para vos.\n\nAhora estas flores también son un poquito tuyas 💛",
  
  // UI
  progressFormat: "({discovered}/{total}) mensajes encontrados",
}
```

---

## 7. RENDIMIENTO

### Targets
- **Desktop**: 60 FPS constante (1920×1080)
- **Tablet**: 45 FPS (iPad Pro 12.9")
- **Mobile**: 30 FPS fluido (iPhone 12)

### Optimizaciones
- **Instancing** para partículas (una draw call, múltiples transforms)
- **LOD** para flores distantes (reducir polígonos si existen múltiples)
- **Culling** de geometría fuera de frustum
- **devicePixelRatio clamped** a 1 en móviles (no renderizar 2x)
- **Material pooling**: reutilizar materiales ShaderMaterial
- **Geometry reuse**: crear 1× pétalo, instanciar N veces

### Límites
- Max 1000 partículas simultáneas
- Max 9 flores (geometría + mesh)
- Max 50 draw calls por frame
- Texture atlasing si hay texturas (ahora todo procedural → no aplica)

### Fallback WebGL
- Si WebGL no disponible, mostrar escena 2D degradada
- Usar canvas 2D con flores SVG animadas
- Mantener mensajes y progreso igual

---

## 8. INTEGRACIÓN CON FLUJO EXISTENTE

### FlowerExperience.js (modificar)
```javascript
class FlowerExperience {
  // ... (existente)
  
  _onDiscoverButton() {
    this.intro.hide()
    setTimeout(() => {
      this.startGardenPhase()  // Nuevo método
    }, 500)
  }
  
  async startGardenPhase() {
    // Mostrar jardín 2D pequeño (actual)
    this.gardenSceneEl.hidden = false
    this.garden.bloomGarden(() => {
      // Cuando termina: iniciar transformación 3D
      this.startBouquetPhase()
    })
  }
  
  async startBouquetPhase() {
    // Fade out jardín 2D
    this.gardenSceneEl.style.opacity = '0'
    
    // Inicializar escena 3D
    this.bouquetScene = new BouquetScene(
      this.gardenLayerEl,
      this.config.bouquet3D
    )
    await this.bouquetScene.init()
    
    // Animar formación: partículas 2D → 3D
    await this.bouquetScene.formBouquet()  // 4-6 seg
    
    // Mostrar indicaciones
    this.bouquetUI.showInitialHint()
    this.bouquetUI.demoFlower(this.bouquetScene.flowers[3])  // Demo en flor central
    
    // Registrar clicks
    this.bouquetScene.flowers.forEach(flower => {
      this.bouquetScene.registerFlowerClick(flower, () => {
        this.onBouquetFlowerDiscovered(flower)
      })
    })
    
    // Iniciar rotación auto
    this.bouquetScene.cameraController.enableAutoRotate()
  }
  
  onBouquetFlowerDiscovered(flower) {
    if (!flower.discovered) {
      flower.setDiscovered()
      this.interactionCount++
      
      // Mostrar mensaje
      this.bouquetUI.showFlowerMessage(flower.message, flower.position)
      
      // Efectos
      flower.bloom()
      flower.emit()
      
      // Progreso
      this.bouquetUI.updateProgress(
        this.interactionCount,
        this.config.bouquet3D.flowerCount + (this.config.bouquet3D.hasSecretFlower ? 1 : 0)
      )
      
      // Verificar fin
      if (this.interactionCount === this.config.bouquet3D.flowerCount + 1) {
        this.playBouquetFinal()
      }
    }
  }
  
  async playBouquetFinal() {
    this.bouquetUI.hideHint()
    await this.bouquetScene.playFinalAnimation()  // Lluvia + corazón
    this.bouquetUI.showFinalMessage(this.config.bouquetCompletionMessage)
    
    // Mostrar botones finales (reutilizar existentes)
    this.finalSceneEl.hidden = false
    this.finalMessageEl.textContent = this.config.bouquetCompletionMessage
  }
  
  restart() {
    // ... (existente)
    this.bouquetScene?.cleanup()
    this.bouquetScene = null
  }
}
```

---

## 9. TESTING & QA

### Functional
- [ ] Flores aparecen en formación 4-6 seg
- [ ] Cada flor detectable (raycast funciona)
- [ ] Mensaje personalizado por flor
- [ ] Progreso se actualiza correctamente (1/7 → 7/7)
- [ ] Flor secreta tiene brillo diferente
- [ ] Final desbloquea solo si todas descubiertas
- [ ] Lluvia de pétalos + corazón animan correctamente
- [ ] Botones redirigen a restart/share

### Performance
- [ ] 60 FPS en desktop (monitor con DevTools)
- [ ] 45+ FPS en tablet
- [ ] No memory leaks (ProfileWebGL, restart multiple veces)
- [ ] Texture memory < 50MB

### Responsiveness
- [ ] Funciona en pantalla de 375px ancho (móvil)
- [ ] Touch detecta flores (no solo mouse)
- [ ] Drag/swipe rota ramo correctamente
- [ ] Zoom limites respetados

### Browser Compat
- [ ] Chrome/Edge (WebGL)
- [ ] Firefox (WebGL)
- [ ] Safari (WebGL + iOS)
- [ ] Fallback Canvas 2D si WebGL falla

---

## 10. DEPENDENCIAS

### Externas (agregar a index.html)
```html
<script src="https://cdn.jsdelivr.net/npm/three@r168/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@r168/examples/js/controls/OrbitControls.js"></script>
```

### Internas (crear en js/3d/)
- BouquetScene.js
- BouquetGeometry.js
- FlowerObject.js
- ParticleSystem.js
- CameraController.js
- BouquetUI.js

### Sin dependencias adicionales
- Anims: tres.js Tween o custom RAF
- Shaders: built-in THREE materials (MeshPhongMaterial, PointsMaterial, etc.)

---

## 11. NOTAS PARA CODEX

1. **Modularidad**: cada clase en su archivo, sin dependencias circulares
2. **Convenciones**: camelCase, comentarios JSDoc, error handling con try/catch
3. **Cleanup**: disponer recursos en `.dispose()` para evitar memory leaks
4. **Responsive**: usar window.innerWidth/Height en resize listeners
5. **Touch**: addEventListener('touchstart/move/end', { passive: true }) para mejor perf
6. **prefers-reduced-motion**: verificar antes de animar, usar transiciones más cortas si está activo
7. **Fallback**: si Three.js no carga, mostrar aviso elegante (no error roto)
8. **Accessibility**: aria-labels en botones, alt text en overlay de cámara si es necesario
9. **Mobile-first**: design para 375px, después ampliar a desktop
10. **No hardcode**: todos los valores en config.js o parámetros de función

---

## 12. MILESTONES

### M1: Setup básico (Three.js, cámara, luz)
- [ ] BouquetScene inicializa escena
- [ ] Cámara enfoca al centro
- [ ] Iluminación nocturna + bloom

### M2: Geometría de flores
- [ ] BouquetGeometry genera flores procedurales
- [ ] 7-9 flores distribuidas naturalmente en ramo
- [ ] Pétalos, tallos, hojas, centros

### M3: Partículas de formación
- [ ] ParticleSystem emite partículas desde flores 2D
- [ ] Convergencia en espiral al centro
- [ ] Materialización en 4-6 seg

### M4: Interacción
- [ ] FlowerObject raycast detecta clics
- [ ] Hover cambia brillo
- [ ] Clic abre mensaje + efectos

### M5: UI + Progreso
- [ ] Tarjetas de vidrio renderean mensajes
- [ ] Contador "X/7" se actualiza
- [ ] Indicadores de pétalos se iluminan

### M6: Final + Integración
- [ ] Lluvia de pétalos + corazón animan
- [ ] Botones finales redirigen
- [ ] Integración con FlowerExperience existente

### M7: Optimización + QA
- [ ] Performance profiling y optimizaciones
- [ ] Testing en múltiples dispositivos
- [ ] Fallback para WebGL no disponible

---

## 13. RECURSOS

- Three.js Docs: https://threejs.org/docs/
- WebGL Optimization: https://www.khronos.org/webgl/
- Procedural Generation: literatura sobre L-systems, perlin noise para plantas
- Particle Systems: Three.js PointsMaterial, BufferGeometry con instancing
