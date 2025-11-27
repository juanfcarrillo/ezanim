import { Injectable } from '@nestjs/common';
import { IAnimationElementRepository } from '@domain/repositories/animation-element.repository.interface';
import { AnimationElement } from '@domain/entities/animation-element.entity';

@Injectable()
export class InMemoryAnimationElementRepository implements IAnimationElementRepository {
  private elements: Map<string, AnimationElement> = new Map();

  async save(element: AnimationElement): Promise<AnimationElement> {
    this.elements.set(element.id, element);
    return element;
  }

  async saveMany(elements: AnimationElement[]): Promise<AnimationElement[]> {
    elements.forEach((element) => this.elements.set(element.id, element));
    return elements;
  }

  async findById(id: string): Promise<AnimationElement | null> {
    return this.elements.get(id) || null;
  }

  async findByVideoRequestId(videoRequestId: string): Promise<AnimationElement[]> {
    return Array.from(this.elements.values()).filter(
      (element) => element.videoRequestId === videoRequestId,
    );
  }

  async update(element: AnimationElement): Promise<AnimationElement> {
    this.elements.set(element.id, element);
    return element;
  }

  async delete(id: string): Promise<void> {
    this.elements.delete(id);
  }
}
