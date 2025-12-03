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
    'Monolito vs. Microservicios: La eterna discusión sobre si construir una aplicación como un solo bloque gigante o como pequeños servicios conectados.';
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

        console.log(`Status: ${statusData.videoRequest?.status}`);
        if (statusData.videoRequest?.htmlVersionId) {
          console.log(
            `HTML Version ID: ${statusData.videoRequest.htmlVersionId}`,
          );
        }

        if (
          statusData.videoRequest &&
          (statusData.videoRequest.status === 'QA_COMPLETED' ||
            statusData.videoRequest.status === 'PREVIEW_READY')
        ) {
          // If we want to wait for QA to finish, we should prefer QA_COMPLETED.
          // But for now let's accept either so the test doesn't hang if I messed up the logic.
          // Actually, let's wait for QA_COMPLETED specifically if we want to test that.
          // But if the user wants to see the preview ASAP, PREVIEW_READY is enough.
          // Let's wait for QA_COMPLETED to be sure the new status works.

          if (statusData.videoRequest.status === 'QA_COMPLETED') {
            console.log('\n[TEST] QA Cycle Completed! Ready to render.');
            break;
          }

          // Optional: If it stays in PREVIEW_READY for too long, maybe we should break?
          // For this test, let's just log and wait.
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
