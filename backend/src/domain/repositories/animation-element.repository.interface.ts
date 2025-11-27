import { AnimationElement } from '../entities/animation-element.entity';

export interface IAnimationElementRepository {
  save(element: AnimationElement): Promise<AnimationElement>;
  saveMany(elements: AnimationElement[]): Promise<AnimationElement[]>;
  findById(id: string): Promise<AnimationElement | null>;
  findByVideoRequestId(videoRequestId: string): Promise<AnimationElement[]>;
  update(element: AnimationElement): Promise<AnimationElement>;
  delete(id: string): Promise<void>;
}
