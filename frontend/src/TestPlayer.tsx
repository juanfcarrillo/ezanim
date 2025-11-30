import { useState } from 'react'
import './App.css'
import { VideoPlayer } from './components/VideoPlayer'

// Test HTML content with Anime.js
const TEST_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Animation</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
        }
        
        #box {
            width: 100px;
            height: 100px;
            background: white;
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        #subtitle {
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 15px 30px;
            border-radius: 20px;
            font-size: 18px;
            opacity: 0;
        }
    </style>
</head>
<body>
    <div id="box">🎬</div>
    <div id="subtitle">Test Animation Ready!</div>

    <script>
        window.tl = anime.timeline({
            autoplay: false,
            easing: 'easeOutExpo'
        });

        window.tl
            .add({
                targets: '#subtitle',
                opacity: [0, 1],
                duration: 500,
                begin: () => {
                    document.getElementById('subtitle').textContent = 'Welcome to Ezanim!';
                }
            }, 0)
            .add({
                targets: '#box',
                scale: [0, 1],
                rotate: '1turn',
                duration: 1500,
                easing: 'easeOutBounce'
            }, 500)
            .add({
                begin: () => {
                    document.getElementById('subtitle').textContent = 'Creating amazing animations...';
                }
            }, 2000)
            .add({
                targets: '#box',
                translateX: [0, 200, -200, 0],
                translateY: [0, -100, -100, 0],
                rotate: '2turn',
                duration: 3000
            }, 2500)
            .add({
                begin: () => {
                    document.getElementById('subtitle').textContent = 'With AI-powered scripts!';
                }
            }, 5500)
            .add({
                targets: '#box',
                scale: [1, 1.5, 1],
                duration: 1000
            }, 6000)
            .add({
                targets: '#subtitle',
                opacity: [1, 0],
                duration: 500
            }, 7000);

        console.log('Animation loaded!');
    </script>
</body>
</html>`;

function TestPlayer() {
  const [showTest] = useState(true);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>✨ Test VideoPlayer</h1>
        <p>Testing iframe controls with Anime.js</p>
      </header>
      
      <main className="content-wrapper">
        <div className="full-width">
          {showTest ? (
            <VideoPlayer
              htmlContent={TEST_HTML}
              requestId="test-123"
            />
          ) : (
            <VideoPlayer />
          )}
        </div>
      </main>

      <footer style={{ 
        textAlign: 'center', 
        marginTop: '2rem', 
        padding: '1rem',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.9rem'
      }}>
        <p>Click Play to start the animation!</p>
      </footer>
    </div>
  )
}

export default TestPlayer
