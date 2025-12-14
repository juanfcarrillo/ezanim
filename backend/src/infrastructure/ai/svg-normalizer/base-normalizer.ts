import { AspectRatio, AspectRatioCanvas } from './aspect-ratio.type';
import { NormalizedSvg, SvgNormalizer } from './svg-normalizer.interface';

export abstract class BaseNormalizer implements SvgNormalizer {
  constructor(protected readonly ratio: AspectRatio) {}

  normalize(rawSvg: string, paddingPct: number = 0.08): NormalizedSvg {
    const canvas = AspectRatioCanvas[this.ratio];
    if (!rawSvg || !rawSvg.includes('<svg')) {
      throw new Error('Invalid SVG');
    }

    // 1) Obtener viewBox o fallback a width/height
    const vbMatch = rawSvg.match(/viewBox="([\d.\s-]+)"/i);
    let vb = { x: 0, y: 0, width: 0, height: 0 };
    if (vbMatch) {
      const [x, y, w, h] = vbMatch[1].split(/\s+/).map(Number);
      vb = { x, y, width: w, height: h };
    } else {
      const w = this.num(rawSvg, /width="([\d.]+)"/i) ?? 500;
      const h = this.num(rawSvg, /height="([\d.]+)"/i) ?? 500;
      vb = { x: 0, y: 0, width: w, height: h };
    }

    // 2) Calcular escala con padding
    const padW = canvas.width * paddingPct;
    const padH = canvas.height * paddingPct;
    const usableW = canvas.width - 2 * padW;
    const usableH = canvas.height - 2 * padH;
    const scale = Math.min(usableW / vb.width, usableH / vb.height);
    const scaledW = vb.width * scale;
    const scaledH = vb.height * scale;

    // 3) Centrar contenido
    const translateX = (canvas.width - scaledW) / 2 - vb.x * scale;
    const translateY = (canvas.height - scaledH) / 2 - vb.y * scale;

    // 4) Limpiar width/height y asegurar viewBox
    let cleaned = rawSvg.replace(/\swidth="[^"]*"/gi, '').replace(/\sheight="[^"]*"/gi, '');
    if (!vbMatch) {
      cleaned = cleaned.replace('<svg', `<svg viewBox="${vb.x} ${vb.y} ${vb.width} ${vb.height}"`);
    }

    // 5) Envolver en <g> con transform final, canvas fijo
    const body = cleaned.replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '');
    const transformed = `<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" preserveAspectRatio="xMidYMid meet">
  <g transform="translate(${translateX}, ${translateY}) scale(${scale})">
    ${body}
  </g>
</svg>`;

    return {
      svg: transformed,
      canvas,
      contentBBox: { x: vb.x, y: vb.y, width: vb.width, height: vb.height },
      transform: { scale, translateX, translateY },
      aspectRatio: this.ratio,
    };
  }

  private num(raw: string, regex: RegExp): number | null {
    const m = raw.match(regex);
    return m ? Number(m[1]) : null;
  }
}