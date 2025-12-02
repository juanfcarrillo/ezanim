interface CreateVideoResponse {
  success: boolean;
  requestId: string;
  message: string;
}

interface StatusResponse {
  success: boolean;
  videoRequest: {
    status: string;
    [key: string]: any;
  };
  statusInfo: string;
}

interface RenderResponse {
  success: boolean;
  message: string;
  statusEndpoint: string;
}

async function runs() {
  const prompt =
    '¿Es el "Clean Code" una estafa? ¿Escribir código "limpio" hace que el software sea lento? (Referencia a la polémica de Casey Muratori)';
  const aspectRatio = '9:16';

  console.log(`Sending full video creation request (${aspectRatio})...`);
  console.log('Prompt:', prompt);

  try {
    const response = await fetch(
      'http://localhost:3000/video-requests/create-full',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, aspectRatio }),
      },
    );

    const data = (await response.json()) as CreateVideoResponse;
    console.log('\nResponse status:', response.status);
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.requestId) {
      const requestId = data.requestId;
      console.log(`\n[TEST] Request ID: ${requestId}`);

      // Poll for preview ready
      console.log('[TEST] Waiting for HTML generation (polling)...');
      let attempts = 0;
      while (attempts < 1000) {
        // Increased attempts as generation might take time (queue + QA loops)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusRes = await fetch(
          `http://localhost:3000/poc/status/${requestId}`,
        );
        const statusData = (await statusRes.json()) as StatusResponse;

        if (
          statusData.videoRequest &&
          statusData.videoRequest.status === 'PREVIEW_READY'
        ) {
          console.log('\n[TEST] Preview is READY!');
          break;
        }
        process.stdout.write('.');
        attempts++;
      }

      // Trigger Render
      console.log('\n[TEST] Triggering Render...');
      const renderRes = await fetch(
        `http://localhost:3000/poc/render/${requestId}`,
        {
          method: 'POST',
        },
      );
      const renderData = (await renderRes.json()) as RenderResponse;
      console.log(
        '[TEST] Render response:',
        JSON.stringify(renderData, null, 2),
      );

      // Poll for rendering completion
      console.log('\n[TEST] Waiting for Video Rendering (polling)...');
      attempts = 0;
      while (attempts < 1000) {
        // Rendering takes longer, wait up to 4 minutes (120 * 2s)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusRes = await fetch(
          `http://localhost:3000/poc/status/${requestId}`,
        );
        const statusData = (await statusRes.json()) as StatusResponse;

        const status = statusData.videoRequest?.status;

        if (status === 'COMPLETED') {
          console.log('\n[TEST] Video Rendering is COMPLETED!');
          console.log(
            `[TEST] Video URL: http://localhost:3000/poc/video/${requestId}`,
          );
          break;
        } else if (status === 'FAILED') {
          console.error('\n[TEST] Video Rendering FAILED!');
          break;
        }

        process.stdout.write('.');
        attempts++;
      }
    }
  } catch (error) {
    console.error('\nError sending request:', error);
  }
}

void runs();
