import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const filePath = path.join(__dirname, '../../samples/facade-pattern/parametters.txt');

    console.log('Reading file from:', filePath);

    if (!fs.existsSync(filePath)) {
        console.error('File not found!');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse the file
    const requestMatch = content.match(/Request: (.*)/);
    const scriptMatch = content.match(/Elevenlabs script: ([\s\S]*?)VTT transcript:/);
    const vttMatch = content.match(/VTT transcript: ([\s\S]*)/);

    if (!requestMatch || !scriptMatch || !vttMatch) {
        console.error('Failed to parse parameters file');
        return;
    }

  const prompt = requestMatch[1].trim();
  const script = scriptMatch[1].trim();
  const vtt = vttMatch[1].trim();
  const audioPath = path.join(__dirname, '../../samples/facade-pattern/sample-audio.mp3');

  console.log('Parsed data:');
  console.log('Prompt:', prompt);
  console.log('Script length:', script.length);
  console.log('VTT length:', vtt.length);
  console.log('Audio path:', audioPath);

  try {
    console.log('\nSending request to backend...');
    const response = await fetch('http://localhost:3000/poc/test-script-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        script,
        vtt,
        duration: 65, // Updated duration based on sample audio length (approx 1:05)
        audioPath
      }),
    });
        const data = await response.json();
        console.log('\nResponse status:', response.status);
        console.log(JSON.stringify(data, null, 2));

        if (data.success && data.requestId) {
            const requestId = data.requestId;
            console.log(`\n[TEST] Request ID: ${requestId}`);

            // Wait for HTML generation (mock is fast, but let's wait a sec)
            console.log('[TEST] Waiting for HTML generation...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check Preview
            console.log('[TEST] Checking Preview...');
            const previewRes = await fetch(`http://localhost:3000/poc/preview/${requestId}`);
            const previewHtml = await previewRes.text();
            console.log(`[TEST] Preview HTML length: ${previewHtml.length}`);
            if (previewHtml.includes('Preview not ready')) {
                console.error('[TEST] Preview not ready!');
            } else {
                console.log('[TEST] Preview ready. HTML starts with:', previewHtml.substring(0, 50));
            }

            // Trigger Render
            console.log('[TEST] Triggering Render...');
            const renderRes = await fetch(`http://localhost:3000/poc/render/${requestId}`, {
                method: 'POST'
            });
            const renderData = await renderRes.json();
            console.log('[TEST] Render response:', JSON.stringify(renderData, null, 2));
        }

    } catch (error) {
        console.error('\nError sending request:', error);
    }
}

run();
