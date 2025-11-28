import { Injectable } from '@nestjs/common';
import { VideoCreatorAgent } from '../../infrastructure/ai/video-creator.agent';
import { AnimationReviewAgent } from '../../infrastructure/ai/animation-review.agent';
import { QualityAssuranceAgent, JudgeDecision } from '../../infrastructure/ai/quality-assurance.agent';
import { RenderVideoUseCase } from './render-video.use-case';
import { InMemoryVideoRequestRepository } from '../../infrastructure/repositories/in-memory-video-request.repository';
import { VideoRequest, VideoRequestStatus } from '../../domain/entities/video-request.entity';

export interface GenerateVideoFromScriptInput {
  requestId: string;
  initialRequest: string;
  script: string;
  audioPath: string;
  vtt: string;
  duration: number;
}

@Injectable()
export class GenerateVideoFromScriptUseCase {
  constructor(
    private videoCreatorAgent: VideoCreatorAgent,
    private animationReviewAgent: AnimationReviewAgent,
    private qualityAssuranceAgent: QualityAssuranceAgent,
    private renderVideoUseCase: RenderVideoUseCase,
    private videoRequestRepo: InMemoryVideoRequestRepository,
  ) {}

  async execute(input: GenerateVideoFromScriptInput): Promise<void> {
    const { requestId, initialRequest, duration, audioPath, vtt } = input;

    console.log(`[GenerateVideoFromScriptUseCase] Starting Phase 2 for ${requestId}`);

    // 1. Create or Get VideoRequest
    let videoRequest = await this.videoRequestRepo.findById(requestId);
    if (!videoRequest) {
      videoRequest = new VideoRequest(
        requestId,
        initialRequest,
        null,
        null, // htmlContent
        audioPath,
        duration,
        VideoRequestStatus.PENDING,
        new Date(),
        new Date(),
      );
      await this.videoRequestRepo.save(videoRequest);
    } else {
      // Update existing request with new details
      videoRequest = videoRequest.updateAudioAndDuration(audioPath, duration);
      await this.videoRequestRepo.update(videoRequest);
    }

    // 2. Generate Video HTML using Single Agent
    console.log('[GenerateVideoFromScriptUseCase] Generating video HTML with VideoCreatorAgent...');
    let htmlContent = await this.videoCreatorAgent.createVideo(initialRequest, duration, vtt);

    // 3. Quality Assurance Loop
    const MAX_LOOPS = 2;
    let loopCount = 0;
    let approved = false;

    while (!approved && loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(`[GenerateVideoFromScriptUseCase] QA Loop ${loopCount}/${MAX_LOOPS}`);

      // a. Critic Review
      const review = await this.animationReviewAgent.reviewHtml(htmlContent, initialRequest);

      if (!review.hasIssues) {
        console.log('[GenerateVideoFromScriptUseCase] Critic approved the animation.');
        approved = true;
        break;
      }

      console.log(`[GenerateVideoFromScriptUseCase] Critic found issues: ${review.critique}`);

      // b. Refine Video
      console.log('[GenerateVideoFromScriptUseCase] Refining video based on critique...');
      const refinedHtml = await this.videoCreatorAgent.refineVideo(htmlContent, review.critique);

      // c. Judge Decision
      const decision = await this.qualityAssuranceAgent.evaluateFix(review.critique, refinedHtml);
      
      if (decision === JudgeDecision.APPROVE) {
        console.log('[GenerateVideoFromScriptUseCase] Judge APPROVED the fix.');
        htmlContent = refinedHtml;
        approved = true;
      } else {
        console.log('[GenerateVideoFromScriptUseCase] Judge requested REVIEW AGAIN.');
        htmlContent = refinedHtml; // Use the refined version for the next loop
        // Continue loop
      }
    }

    if (!approved) {
      console.warn('[GenerateVideoFromScriptUseCase] QA Loop finished without full approval. Using latest version.');
    }

    // 4. Update VideoRequest with HTML and set to PREVIEW_READY
    videoRequest = videoRequest.updateHtmlContent(htmlContent);
    videoRequest = videoRequest.updateStatus(VideoRequestStatus.PREVIEW_READY);
    await this.videoRequestRepo.update(videoRequest);

    console.log(
      `[GenerateVideoFromScriptUseCase] HTML generated and saved for ${requestId}. Ready for preview.`,
    );
    
    console.log(
      `[GenerateVideoFromScriptUseCase] Phase 2 initiated for ${requestId}`,
    );
  }
}
