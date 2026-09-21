/**
 * ============================================================
 *  CONFIGURACIÓN — "Flores Amarillas"
 * ============================================================
 * Editá los valores de este archivo para personalizar la
 * experiencia (mensajes, dedicatoria secreta, frases que
 * aparecen al tocar las flores, cantidad de flores y música).
 *
 * No hace falta tocar ningún otro archivo para personalizar
 * el regalo: todo lo editable vive acá.
 *
 * Tono: pensado como un regalo digital cercano y cálido, pero
 * NO romántico — puede enviarse a una amiga, conocida o
 * compañera, no solo a una pareja.
 * ============================================================
 */
window.FLORES_CONFIG = {
  // ---------------------------------------------------------
  // Escena 1 — Introducción (líneas secuenciales + botón)
  // ---------------------------------------------------------
  introLines: [
    "Hoy quería regalarte algo…",
    "Pero no quería enviarte una imagen cualquiera.",
  ],
  discoverButtonText: "Ver mi regalo",

  // Se muestra apenas comienza a crecer la primera flor
  growingMessage: "Así que hice estas flores para vos.",

  // Se muestran, una tras otra, cuando aparece todo el jardín
  gardenLines: [
    "Tal vez hoy nadie llegó con un ramo…",
    "Por eso quise regalarte uno diferente.",
  ],

  // Mensaje principal (grande), cuando las flores terminan de abrirse
  mainMessage:
    "No hace falta esperar que alguien te regale flores para recordar lo especial que sos.",
  mainMessageSub: "Hoy estas flores son para vos 💛",

  // ---------------------------------------------------------
  // DEDICATORIA SECRETA — la tarjeta de la flor especial
  // ---------------------------------------------------------
  secretCardTitle:
    "Si llegaste hasta esta flor, encontraste el mensaje que escondí para vos.",
  secretDedication:
    "No hace falta que seamos personas cercanas para desearte algo bonito. Espero que estas flores alegren aunque sea un poquito tu día.",

  // ---------------------------------------------------------
  // Escena final
  // ---------------------------------------------------------
  finalMessage: "Un pequeño regalo digital, hecho con cariño.",
  finalSubMessage: "",
  restartButtonText: "Hacerlas florecer otra vez",
  shareButtonText: "Regalarle estas flores a alguien",
  shareCopiedMessage: "Enlace copiado",

  // Título y texto compartidos por la Web Share API (si está disponible)
  shareTitle: "Flores Amarillas 💛",
  shareText: "Un pequeño regalo digital de flores amarillas para vos 💛",

  // Frases breves que aparecen al tocar una flor del jardín
  words: [
    "Esta es para recordarte tu valor.",
    "Esta floreció para vos.",
    "Que nunca te falten motivos para sonreír.",
    "También merecés recibir cosas bonitas.",
    "No necesitás una fecha especial.",
    "Hoy alguien quiso regalarte flores.",
    "Espero que este pequeño gesto alegre tu día.",
  ],

  // Cantidad de flores del jardín (entre 12 y 20 recomendado)
  flowerCount: 16,

  // Música ambiental
  music: {
    enabled: true, // false = oculta por completo el control de música
    src: "audio/ambient.mp3",
    volume: 0.35,
    loop: true,
  },

  // Cantidad de mariposas y luciérnagas
  butterflyCount: 3,
  fireflyCount: 10,

  // Cantidad de interacciones (flores tocadas) antes de mostrar la
  // escena final, o segundos de espera máximos si el usuario no interactúa.
  interactionsForFinal: 5,
  finalSceneTimeoutMs: 32000,

  // ---------------------------------------------------------
  // Escena 3D — Ramo interactivo
  // ---------------------------------------------------------
  bouquet3D: {
    enabled: true,
    flowerCount: 7,
    hasSecretFlower: true,
    formationDuration: 5000,
    ambientParticles: 18,
    autoRotateSpeed: 0.015,
    cameraZoomLimits: { min: 60, max: 120 },
  },
  bouquetMessages: [
    "También merecés recibir cosas bonitas.",
    "Nunca necesitás una fecha especial para florecer.",
    "Que no te falten razones para sonreír.",
    "Esta flor estaba esperando que la encontraras.",
    "Recordá siempre lo valiosa que sos.",
    "A veces, un pequeño gesto puede cambiar un día.",
    "Hoy este ramo es solamente para vos.",
  ],
  secretFlowerMessage:
    "Si encontraste esta flor, descubriste el mensaje que escondí especialmente para vos.\n\nNo hace falta esperar que alguien llegue con un ramo para recordar lo especial que sos 💛",
  bouquetInitialHint: "Entre estas flores escondí algo para vos.\n\nTocá los pétalos para descubrirlo.",
  bouquetCompletionMessage:
    "Encontraste todo lo que este ramo guardaba para vos.\n\nAhora estas flores también son un poquito tuyas 💛",
  progressFormat: "{discovered} de {total} mensajes encontrados",
};
