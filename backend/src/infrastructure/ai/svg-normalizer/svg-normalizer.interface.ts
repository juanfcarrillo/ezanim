import { AspectRatio } from './aspect-ratio.type';

export interface NormalizedSvg {
  svg: string;
  canvas: { width: number; height: number };
  contentBBox: { x: number; y: number; width: number; height: number };
  transform: { scale: number; translateX: number; translateY: number };
  aspectRatio: AspectRatio;
}

export interface SvgNormalizer {
  normalize(rawSvg: string, paddingPct?: number): NormalizedSvg;
}