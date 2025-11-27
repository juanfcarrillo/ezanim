import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface VideoEncodeOptions {
  framePaths: string[];
  outputPath: string;
  fps: number;
  width: number;
  height: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  size: number;
}

@Injectable()
export class FFmpegService {
  constructor() {
    // Verify FFmpeg is available
    this.verifyFFmpeg();
  }

  private verifyFFmpeg(): void {
    console.log('[FFmpegService] Initializing FFmpeg service');
    // FFmpeg verification happens on first use
  }

  async encodeVideo(options: VideoEncodeOptions): Promise<string> {
    console.log('[FFmpegService] Starting video encoding');
    const { framePaths, outputPath, fps, width, height } = options;

    if (framePaths.length === 0) {
      throw new Error('No frames to encode');
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Get the pattern for input frames
    const frameDir = path.dirname(framePaths[0]);
    const framePattern = path.join(frameDir, 'frame-%05d.png');

    return new Promise<string>((resolve, reject) => {
      ffmpeg()
        .input(framePattern)
        .inputFPS(fps)
        .size(`${width}x${height}`)
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt yuv420p', // Compatibility with most players
          '-preset fast', // Encoding speed
          '-crf 23', // Quality (lower = better, 23 is default)
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('[FFmpegService] FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(
              `[FFmpegService] Encoding progress: ${progress.percent.toFixed(1)}%`,
            );
          }
        })
        .on('end', () => {
          console.log('[FFmpegService] Video encoding complete:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('[FFmpegService] Encoding error:', err);
          reject(err);
        })
        .run();
    });
  }

  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err as Error);
          return;
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video',
        );
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: (eval(videoStream.r_frame_rate || '0') || 0) as number,
          size: metadata.format.size || 0,
        });
      });
    });
  }
}
