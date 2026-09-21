# Flores Amarillas 💛

Regalo digital interactivo: un jardín de flores amarillas que nace y
florece en cascada frente al usuario. HTML/CSS/JS puro (sin frameworks,
sin build), pensado para vivir dentro de `D:\flores`, que no tenía
ningún framework ni sistema de rutas propio.

## Cómo abrirlo

Este proyecto no depende de Node ni de ningún build. Dos formas de verlo:

### Opción A — Doble clic (la más simple)

Abrí `index.html` directamente con doble clic (se abre en tu navegador
por defecto). Todo funciona igual, salvo que Chrome/Edge son algo más
estrictos con `file://`; si notás algo raro, probá la opción B.

### Opción B — Servidor local (recomendado)

Desde esta carpeta (`flores-amarillas/`), con Node instalado:

```
npx serve .
```

o, si preferís Python:

```
python -m http.server 8080
```

y abrí la URL que te indique (por ejemplo `http://localhost:8080`).

## Personalizar el contenido

Todo el texto editable (mensajes, dedicatoria secreta, frases al tocar
las flores, cantidad de flores, música) vive en:

```
js/config.js
```

No hace falta tocar ningún otro archivo para cambiar el contenido.

## Música

Ver `audio/README.md` para agregar una pista ambiental. Si no agregás
ningún archivo, el botón de música se deshabilita solo, sin errores.

## Estructura

```
index.html              punto de entrada
css/styles.css          toda la hoja de estilos
js/config.js            contenido editable
js/FlowerExperience.js  orquestador de la secuencia completa
js/main.js              arranque
js/components/          IntroScene, GrowingFlower, FlowerGarden,
                         Butterfly, Fireflies, GoldenParticles,
                         PetalDrift, StoryCaption, SecretFlowerCard,
                         MusicControl, ShareButton
audio/                  carpeta para el archivo de música (opcional)
```

## Nada publicado

Este proyecto vive solo en tu disco (`D:\flores`). No se hizo ningún
`git init`, commit ni push — es 100% local hasta que decidas publicarlo.
