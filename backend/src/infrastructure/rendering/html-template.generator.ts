import { Injectable } from '@nestjs/common';
import { AnimationElement } from '@domain/entities/animation-element.entity';

@Injectable()
export class HtmlTemplateGenerator {
  generateVideoHtml(
    elements: AnimationElement[],
    width: number,
    height: number,
    duration: number,
  ): string {
    const elementsHtml = elements
      .map((element, index) => {
        const styleString = Object.entries(element.styles)
          .map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${cssKey}: ${value}`;
          })
          .join('; ');

        return `            <div class="element-${index}" style="${styleString}">${element.content}</div>`;
      })
      .join('\n');

    // Build anime.js timeline with proper offsets
    const timelineAnimations = elements
      .map((element, index) => {
        if (!element.animation) return '';

        const props = Object.entries(element.animation.properties)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');

        // Calculate offset: delay is when it starts in the timeline
        const offset = element.animation.delay || 0;
        const offsetStr = offset === 0 ? '0' : `-=${duration * 1000 - offset}`;

        return `        .add({
            targets: '.element-${index}',
            ${props},
            duration: ${element.animation.duration},
            easing: '${element.animation.easing}'${element.animation.loop ? `,
            loop: true` : ''}
        }, ${offset})`;
      })
      .filter(Boolean)
      .join('\n');

    const durationMinutes = Math.floor(duration / 60);
    const durationSeconds = Math.floor(duration % 60);
    const durationFormatted = `${String(durationMinutes).padStart(2, '0')}:${String(durationSeconds).padStart(2, '0')}`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Explicativo</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-dark: #1e272e;
            --stage-bg: #2d3436;
            --primary-color: #0984e3;
            --primary-gradient: linear-gradient(135deg, #0984e3, #74b9ff);
            --accent-color: #00b894;
            --text-light: #dfe6e9;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--bg-dark);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: var(--text-light);
        }

        /* --- CONTENEDOR DEL VIDEO --- */
        .video-player {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: var(--stage-bg);
            overflow: hidden;
        }

        /* --- ESCENARIO PRINCIPAL --- */
        .stage-center {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* --- UI OVERLAYS (controles de video) --- */
        .video-ui {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 60px;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(5px);
            z-index: 100;
            display: flex;
            align-items: center;
            padding: 0 20px;
            box-sizing: border-box;
        }

        .progress-bar-container {
            flex-grow: 1;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            margin: 0 15px;
            overflow: hidden;
            cursor: pointer;
        }

        .progress-bar-fill {
            width: 0%;
            height: 100%;
            background-color: var(--primary-color);
            transition: width 0.1s linear;
        }

        .control-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            width: 30px;
            transition: transform 0.2s;
        }
        .control-btn:hover { 
            transform: scale(1.1); 
            color: var(--primary-color); 
        }

        .time-display {
            font-size: 0.9rem;
            font-family: monospace;
            width: 100px;
            text-align: right;
        }

        /* --- ESTILOS PARA ELEMENTOS PERSONALIZADOS --- */
        .subtitle-container {
            position: absolute;
            bottom: 80px;
            width: 100%;
            text-align: center;
            pointer-events: none;
        }
        
        .subtitle {
            font-size: 1.4rem;
            font-weight: 300;
            background: rgba(0,0,0,0.3);
            padding: 10px 20px;
            border-radius: 50px;
            display: inline-block;
            opacity: 0;
            transform: translateY(20px);
        }
    </style>
</head>
<body>

    <div class="video-player">
        
        <!-- Escenario Central -->
        <div class="stage-center">
${elementsHtml}
        </div>

        <!-- Controles de Video -->
        <div class="video-ui">
            <button class="control-btn" id="play-pause"><i class="fas fa-play"></i></button>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
            <div class="time-display">00:00 / ${durationFormatted}</div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script>
        const playBtn = document.getElementById('play-pause');
        const icon = playBtn.querySelector('i');
        const progressFill = document.querySelector('.progress-bar-fill');
        const timeDisplay = document.querySelector('.time-display');

        // --- LINEA DE TIEMPO DE ANIMACIÓN ---
        // Expose timeline globally for Puppeteer control
        window.tl = anime.timeline({
            easing: 'easeOutExpo',
            duration: ${duration * 1000},
            autoplay: false,
            update: function(anim) {
                if (progressFill) {
                    progressFill.style.width = anim.progress + '%';
                }
                if (timeDisplay) {
                    let currentSec = Math.floor((anim.progress / 100) * ${duration});
                    let currentMin = Math.floor(currentSec / 60);
                    let displaySec = currentSec % 60;
                    timeDisplay.innerText = String(currentMin).padStart(2, '0') + ':' + String(displaySec).padStart(2, '0') + ' / ${durationFormatted}';
                }
            },
            complete: function() {
                if (icon) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-rotate-right');
                }
            }
        });
        
        const tl = window.tl;

        // === ANIMACIONES ===
        tl
${timelineAnimations};

        // --- CONTROLES ---
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (tl.completed) {
                    tl.restart();
                    icon.className = 'fas fa-pause';
                } else if (tl.paused) {
                    tl.play();
                    icon.className = 'fas fa-pause';
                } else {
                    tl.pause();
                    icon.className = 'fas fa-play';
                }
            });
        }

        // Auto-play for browser preview (but not for Puppeteer)
        // Puppeteer will control the timeline manually via tl.seek()
        if (typeof window.puppeteerMode === 'undefined') {
            setTimeout(() => {
                tl.play();
                if (icon) icon.className = 'fas fa-pause';
            }, 500);
        }

    </script>
</body>
</html>`;
  }
}
