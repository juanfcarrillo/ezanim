export class AnimationElement {
  constructor(
    public readonly id: string,
    public readonly videoRequestId: string,
    public readonly type: ElementType,
    public readonly content: string,
    public readonly styles: Record<string, any>,
    public readonly animation: AnimationConfig | null,
    public readonly order: number,
  ) {}

  static create(
    videoRequestId: string,
    type: ElementType,
    content: string,
    styles: Record<string, any>,
    order: number,
  ): AnimationElement {
    return new AnimationElement(
      crypto.randomUUID(),
      videoRequestId,
      type,
      content,
      styles,
      null,
      order,
    );
  }

  addAnimation(animation: AnimationConfig): AnimationElement {
    return new AnimationElement(
      this.id,
      this.videoRequestId,
      this.type,
      this.content,
      this.styles,
      animation,
      this.order,
    );
  }
}

export enum ElementType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SHAPE = 'SHAPE',
  SVG = 'SVG',
  HTML = 'HTML',
}

export interface AnimationConfig {
  targets: string;
  duration: number;
  easing: string;
  properties: Record<string, any>;
  delay?: number;
  loop?: boolean;
}
