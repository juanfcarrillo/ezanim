# Ezanim

Ezanim is a engine for creating videos with ai, specially for explanatory videos.

## How it works

### Phase 1

1. User maker a request about some topic.
2. The ai generates a script using elevenlabs Controls best practices.
3. An audio voice file is generated using elevenlabs (Eleven Multilingual V2).
4. The transcript with timestamps is generated using stable-ts.
5. The ai sends ranscript, the timestamps in VTT format and the initial user request 

### Phase 2

1. The ai receives the transcript, the timestamps in VTT format and the initial user request.
2. The ai processes it using a **single specialized agent** acting as an expert frontend developer and creative animator.
   - This agent generates a single, self-contained HTML file with all CSS and JS included.
   - **Libraries**: Uses Anime.js (v3.2.1) for animations and FontAwesome (v6.4.0) for icons.
   - **Visual Structure**: Creates a modern video player UI with Play/Pause controls, progress bar, and time indicator.
   - **Animation Logic**: Uses `anime.timeline()` to sequence the story, employing dynamic entrances (bounce effects) and micro-interactions (staggering) for a professional look.
   - **Output**: A complete, runnable HTML file ready for rendering.
3. The preview of the video is shown to the user.
4. The ai renders the video in a headless browser (Google Chrome) and saves it as an .mp4 file.
5. The video and audio are merged into a single file.

## Technologies

1. El Core de Renderizado (El Motor)
Estas son las piezas clave que se ejecutarán en tu servidor "Worker" para crear el video.

Node.js: El entorno de ejecución base. Es necesario porque Puppeteer es una librería de Node.

Puppeteer (o Playwright): La librería que lanza y controla una versión oculta de Google Chrome (Headless Chrome). Es la herramienta que abrirá tu HTML y ejecutará anime.js.

Google Chrome (Headless): El navegador real que interpretará el CSS, JS y el Canvas. Se instala automáticamente con Puppeteer.

FFmpeg: Una herramienta de línea de comandos (binario) que debe estar instalada en el sistema operativo del servidor. Es el estándar mundial para procesar audio y video. Unirá las imágenes capturadas por Puppeteer.

Anime.js: La librería que ya conoces, que controlará la lógica de movimiento.

2. Backend y API (El Orquestador)
Necesitas un servidor que reciba la petición del usuario y gestione el proceso.

NestJS (Recomendado) o Express: Framework de Node.js.

Por qué NestJS: Tiene una integración nativa y excelente con colas de trabajo (BullMQ) y microservicios, lo cual es ideal para separar la "API web" del "Worker pesado".

TypeScript: Altamente recomendado para evitar errores de tipos en las configuraciones de video (anchura, altura, duración).

3. Gestión de Colas (Asincronía)
Esta capa evita que tu servidor colapse si 50 personas piden un video al mismo tiempo.

Redis: Una base de datos en memoria muy rápida. Actuará como el "buzón" donde se guardan los trabajos pendientes.

BullMQ: Una librería de Node.js que conecta tu backend con Redis. Gestiona reintentos (si falla un render), prioridades y estados (progreso, completado, fallido).

4. Almacenamiento (Storage)
Los videos pesan mucho, no debes guardarlos en la carpeta del servidor o llenarás el disco rápidamente.

AWS S3 (o Google Cloud Storage / Azure Blob): Para guardar los archivos .mp4 finales.

Signed URLs: Una tecnología de S3 para generar enlaces de descarga seguros y temporales para tus usuarios.

5. Frontend (El Cliente)
Desde donde el usuario configura la animación.

React / Vue / Angular: Cualquiera sirve.

Anime.js: Para mostrar una "previsualización" ligera en el navegador del usuario antes de enviarla a renderizar al servidor.

6. Infraestructura (DevOps) - CRÍTICO
Desplegar Puppeteer y FFmpeg en un servidor normal (como un VPS de Ubuntu) es doloroso por las dependencias del sistema.

Docker: Obligatorio para tu salud mental.

Necesitas crear un Dockerfile que instale Node.js, las librerías necesarias de Chrome (que son muchas en Linux) y FFmpeg en un solo contenedor.

Esto garantiza que si funciona en tu máquina, funcionará en producción.