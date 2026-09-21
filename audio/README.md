# Musica ambiental

Este proyecto esta preparado para reproducir musica ambiental suave e
instrumental, pero **no incluye ningun archivo de audio** (para evitar
problemas de licencia/copyright).

## Como agregar la musica

1. Consegui una pista instrumental suave, sin copyright, en formato MP3.
   Algunas fuentes recomendadas con musica libre de derechos:
   - https://pixabay.com/music/ (licencia libre, sin atribucion obligatoria)
   - https://freemusicarchive.org/ (revisar la licencia de cada pista)
   - https://freepd.com/ (dominio publico)
2. Renombra el archivo a `ambient.mp3`.
3. Coloca el archivo en esta misma carpeta: `flores-amarillas/audio/ambient.mp3`.

Eso es todo. El boton de sonido (arriba a la derecha de la pantalla) lo
detectara automaticamente.

## Si no agregas ningun archivo

No pasa nada: el boton de musica se muestra igual, pero al tocarlo se
deshabilita silenciosamente sin generar errores ni interrumpir la
experiencia visual.

## Cambiar el nombre o la ruta del archivo

Si preferis otro nombre de archivo o ruta, editá `music.src` en
`flores-amarillas/js/config.js`.
