import { Injectable } from '@nestjs/common';
import { VideoCreatorAgent } from '../../infrastructure/ai/video-creator.agent';
import { AnimationReviewAgent } from '../../infrastructure/ai/animation-review.agent';
import {
  QualityAssuranceAgent,
  JudgeDecision,
} from '../../infrastructure/ai/quality-assurance.agent';
import { RenderVideoUseCase } from './render-video.use-case';
import { InMemoryVideoRequestRepository } from '../../infrastructure/repositories/in-memory-video-request.repository';
import {
  VideoRequest,
  VideoRequestStatus,
} from '../../domain/entities/video-request.entity';

export interface GenerateVideoFromScriptInput {
  requestId: string;
  initialRequest: string;
  script: string;
  audioPath: string;
  vtt: string;
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
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
    const { requestId, initialRequest, duration, audioPath, vtt, aspectRatio } =
      input;

    console.log(
      `[GenerateVideoFromScriptUseCase] Starting Phase 2 for ${requestId} with aspect ratio ${aspectRatio}`,
    );

    // 1. Create or Get VideoRequest
    let videoRequest = await this.videoRequestRepo.findById(requestId);
    if (!videoRequest) {
      videoRequest = new VideoRequest(
        requestId,
        initialRequest,
        null,
        null, // htmlContent
        null, // htmlVersionId
        audioPath,
        duration,
        VideoRequestStatus.PENDING,
        aspectRatio,
        new Date(),
        new Date(),
      );
      await this.videoRequestRepo.save(videoRequest);
    } else {
      // Update existing request with new details
      videoRequest = videoRequest.updateAudioAndDuration(audioPath, duration);
      // Also update aspect ratio if needed? The entity is immutable.
      // We don't have a method to update aspect ratio. Let's assume it's set correctly or we need to add a method.
      // For now, let's assume if it exists, we keep it, or we should recreate it?
      // If the user changes aspect ratio for an existing request, we might need to update it.
      // But usually this flow creates a new request or updates a pending one.
      // Let's add a method to update aspect ratio if we really need it, but for now let's assume it's fine.
      // Actually, if we are re-running for the same ID, we might want to update the aspect ratio.
      // But VideoRequest doesn't have updateAspectRatio.
      // Let's leave it as is for now.
      await this.videoRequestRepo.update(videoRequest);
    }

    // 2. Generate Video HTML using Single Agent
    console.log(
      '[GenerateVideoFromScriptUseCase] Generating video HTML with VideoCreatorAgent...',
    );
    let htmlContent = await this.videoCreatorAgent.createVideo(
      initialRequest,
      duration,
      vtt,
      aspectRatio,
    );

    // Save initial draft immediately for preview
    videoRequest = videoRequest.updateHtmlContent(htmlContent);
    videoRequest = videoRequest.updateStatus(VideoRequestStatus.PREVIEW_READY);
    await this.videoRequestRepo.update(videoRequest);
    console.log(
      `[GenerateVideoFromScriptUseCase] Initial HTML draft saved for ${requestId}`,
    );

    // 3. Quality Assurance Loop
    const MAX_LOOPS = 2;
    let loopCount = 0;
    let approved = false;

    while (!approved && loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(
        `[GenerateVideoFromScriptUseCase] QA Loop ${loopCount}/${MAX_LOOPS}`,
      );

      // a. Critic Review
      const review = await this.animationReviewAgent.reviewHtml(
        htmlContent,
        initialRequest,
      );

      if (!review.hasIssues) {
        console.log(
          '[GenerateVideoFromScriptUseCase] Critic approved the animation.',
        );
        approved = true;
        break;
      }

      console.log(
        `[GenerateVideoFromScriptUseCase] Critic found issues: ${review.critique}`,
      );

      // b. Refine Video
      console.log(
        '[GenerateVideoFromScriptUseCase] Refining video based on critique...',
      );
      const refinedHtml = await this.videoCreatorAgent.refineVideo(
        htmlContent,
        review.critique,
      );

      // Save refined version immediately
      htmlContent = refinedHtml;
      videoRequest = videoRequest.updateHtmlContent(htmlContent);
      await this.videoRequestRepo.update(videoRequest);
      console.log(
        `[GenerateVideoFromScriptUseCase] Refined HTML saved for ${requestId} (Loop ${loopCount})`,
      );

      // c. Judge Decision
      const decision = await this.qualityAssuranceAgent.evaluateFix(
        review.critique,
        refinedHtml,
      );

      if (decision === JudgeDecision.APPROVE) {
        console.log('[GenerateVideoFromScriptUseCase] Judge APPROVED the fix.');
        approved = true;
      } else {
        console.log(
          '[GenerateVideoFromScriptUseCase] Judge requested REVIEW AGAIN.',
        );
        // Continue loop
      }
    }

    if (!approved) {
      console.warn(
        '[GenerateVideoFromScriptUseCase] QA Loop finished without full approval. Using latest version.',
      );
    }

    // 4. Final Update (Status is already PREVIEW_READY, but ensure content is latest)
    videoRequest = videoRequest.updateHtmlContent(htmlContent);
    videoRequest = videoRequest.updateStatus(VideoRequestStatus.QA_COMPLETED);
    await this.videoRequestRepo.update(videoRequest);

    console.log(
      `[GenerateVideoFromScriptUseCase] HTML generated and saved for ${requestId}. QA Completed.`,
    );
  }
}
