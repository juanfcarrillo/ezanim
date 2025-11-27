import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from 'elevenlabs';

@Injectable()
export class ElevenLabsService {
  private client: ElevenLabsClient;
  private defaultVoiceId: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    this.client = new ElevenLabsClient({ apiKey });
    this.defaultVoiceId =
      this.configService.get<string>('ELEVENLABS_VOICE_ID') ||
      '21m00Tcm4TlvDq8ikWAM'; // Rachel
  }

  async generateAudio(text: string): Promise<Buffer> {
    try {
      const audioStream = await this.client.textToSpeech.convert(
        this.defaultVoiceId,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        },
      );

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error generating audio with ElevenLabs:', error);
      throw error;
    }
  }
}
