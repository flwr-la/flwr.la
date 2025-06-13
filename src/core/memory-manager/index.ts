import { Flower, MemoryFragment, Episode } from '../bloom-engine/types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class MemoryManager {
  private storagePath: string;

  constructor(storagePath: string = './flowerbed') {
    this.storagePath = storagePath;
    this.ensureStorageExists();
  }

  private async ensureStorageExists() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  async save(flower: Flower): Promise<void> {
    const filePath = path.join(this.storagePath, `${flower.id}.flwr`);
    await fs.writeFile(filePath, JSON.stringify(flower, null, 2));
  }

  async load(flowerId: string): Promise<Flower | null> {
    try {
      const filePath = path.join(this.storagePath, `${flowerId}.flwr`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async delete(flowerId: string): Promise<void> {
    const filePath = path.join(this.storagePath, `${flowerId}.flwr`);
    await fs.unlink(filePath);
  }

  async updateMemories(flower: Flower, interaction: any): Promise<void> {
    // Add to short-term memory
    const fragment: MemoryFragment = {
      content: `User: ${interaction.input}\nFlower: ${interaction.response}`,
      timestamp: interaction.timestamp,
      importance: this.calculateImportance(interaction)
    };

    flower.memory.shortTerm.push(fragment);

    // Manage memory size
    if (flower.memory.shortTerm.length > 10) {
      // Move important memories to long-term
      const important = flower.memory.shortTerm
        .filter(m => m.importance > 0.7)
        .slice(0, 2);

      flower.memory.longTerm.push(...important);
      flower.memory.shortTerm = flower.memory.shortTerm.slice(-8);
    }

    // Create episodes from significant interactions
    if (fragment.importance > 0.8) {
      const episode: Episode = {
        id: `ep_${Date.now()}`,
        fragments: [fragment],
        summary: this.summarizeInteraction(interaction),
        emotionalTone: this.detectEmotionalTone(interaction)
      };

      flower.memory.episodic.push(episode);
    }

    await this.save(flower);
  }

  private calculateImportance(interaction: any): number {
    // Simple heuristic based on length and keywords
    const length = interaction.input.length + interaction.response.length;
    const keywords = ['important', 'remember', 'never forget', 'always'];

    let score = Math.min(length / 500, 0.5);

    keywords.forEach(keyword => {
      if (interaction.input.toLowerCase().includes(keyword)) {
        score += 0.2;
      }
    });

    return Math.min(score, 1);
  }

  private summarizeInteraction(interaction: any): string {
    // Placeholder - in production, use LLM to summarize
    return `Discussed: ${interaction.input.slice(0, 50)}...`;
  }

  private detectEmotionalTone(interaction: any): string {
    // Placeholder emotion detection
    const text = (interaction.input + interaction.response).toLowerCase();

    if (text.includes('happy') || text.includes('joy')) return 'joyful';
    if (text.includes('sad') || text.includes('cry')) return 'melancholic';
    if (text.includes('angry') || text.includes('frustrated')) return 'tense';

    return 'neutral';
  }
}
