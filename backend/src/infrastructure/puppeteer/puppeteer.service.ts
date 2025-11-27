import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface BrowserRenderOptions {
  html: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
}

@Injectable()
export class PuppeteerService {
  private browser: puppeteer.Browser | null = null;

  async ensureBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async renderFrames(options: BrowserRenderOptions): Promise<string[]> {
    console.log('[PuppeteerService] Starting frame capture');
    const { html, width, height, fps, duration } = options;

    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width, height });

    // Load HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Set puppeteer mode to prevent auto-play
    await page.evaluate(() => {
      window['puppeteerMode'] = true;
    });

    // Wait for anime.js to load and timeline to be ready
    await page.waitForFunction(() => typeof window['anime'] !== 'undefined');
    await page.waitForFunction(() => typeof window['tl'] !== 'undefined');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Ensure timeline is paused and at beginning
    await page.evaluate(() => {
      const tl = window['tl'];
      if (tl) {
        tl.pause();
        tl.seek(0);
      }
    });

    const totalFrames = Math.ceil(duration * fps);
    const framePaths: string[] = [];

    // Create temp directory for frames
    const tempDir = path.join(
      process.env.VIDEO_OUTPUT_DIR || '/tmp/ezanim',
      `frames-${Date.now()}`,
    );
    await fs.mkdir(tempDir, { recursive: true });

    console.log(
      `[PuppeteerService] Capturing ${totalFrames} frames at ${fps} FPS for ${duration}s`,
    );

    for (let i = 0; i < totalFrames; i++) {
      // Calculate exact time for this frame
      const currentTime = (i / fps) * 1000; // milliseconds

      // Seek timeline to exact time
      await page.evaluate((time) => {
        const tl = window['tl'];
        if (tl) {
          tl.seek(time);
        }
      }, currentTime);

      // Small delay to let the DOM update
      await new Promise((resolve) => setTimeout(resolve, 50));

      const framePath = path.join(
        tempDir,
        `frame-${String(i).padStart(5, '0')}.png`,
      );

      // Capture screenshot
      await page.screenshot({
        path: framePath,
        type: 'png',
      });

      framePaths.push(framePath);

      // Log progress every 30 frames
      if ((i + 1) % 30 === 0 || i === totalFrames - 1) {
        console.log(
          `[PuppeteerService] Progress: ${i + 1}/${totalFrames} frames (${currentTime.toFixed(0)}ms)`,
        );
      }
    }

    await page.close();
    console.log('[PuppeteerService] Frame capture complete');

    return framePaths;
  }

  async cleanup(framePaths: string[]): Promise<void> {
    if (framePaths.length === 0) return;

    const tempDir = path.dirname(framePaths[0]);

    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('[PuppeteerService] Cleaned up temp directory:', tempDir);
    } catch (error) {
      console.error('[PuppeteerService] Error cleaning up:', error);
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
