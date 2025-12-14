import { AspectRatio } from './aspect-ratio.type';
import { SvgNormalizer } from './svg-normalizer.interface';
import { Landscape16x9Normalizer } from './landscape-16x9.normalizer';
import { Portrait9x16Normalizer } from './portrait-9x16.normalizer';
import { Square1x1Normalizer } from './square-1x1.normalizer';

export class SvgNormalizerFactory {
  static forAspectRatio(ratio: AspectRatio): SvgNormalizer {
    switch (ratio) {
      case '16:9':
        return new Landscape16x9Normalizer();
      case '9:16':
        return new Portrait9x16Normalizer();
      case '1:1':
      default:
        return new Square1x1Normalizer();
    }
  }
}