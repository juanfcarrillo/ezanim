
async function run() {
  const prompt = "Explica brevemente qué es la fotosíntesis para niños.";

  console.log('Sending full video creation request...');
  console.log('Prompt:', prompt);

  try {
    const response = await fetch('http://localhost:3000/video-requests/create-full', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    console.log('\nResponse status:', response.status);
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.requestId) {
      const requestId = data.requestId;
      console.log(`\n[TEST] Request ID: ${requestId}`);
      
      // Poll for preview ready
      console.log('[TEST] Waiting for HTML generation (polling)...');
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusRes = await fetch(`http://localhost:3000/poc/status/${requestId}`);
        const statusData = await statusRes.json();
        
        if (statusData.videoRequest && statusData.videoRequest.status === 'PREVIEW_READY') {
          console.log('[TEST] Preview is READY!');
          break;
        }
        process.stdout.write('.');
        attempts++;
      }

      // Trigger Render
      console.log('\n[TEST] Triggering Render...');
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
