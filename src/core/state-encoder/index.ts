import { FlowerState, Flower } from '../bloom-engine/types';

export class StateEncoder {
  encode(flower: Flower): string {
    // Convert flower state and recent memories into context
    const recentMemories = flower.memory.shortTerm
      .slice(-5)
      .map(m => m.content)
      .join('\n');

    const stateDescription = this.describeState(flower.state);

    return `
Current state: ${stateDescription}
Recent memories:
${recentMemories}
    `.trim();
  }

  async updateState(
    currentState: FlowerState,
    input: string,
    response: any
  ): Promise<FlowerState> {
    // Simple state evolution based on interaction
    const sentiment = this.analyzeSentiment(input + ' ' + response.content);

    return {
      currentMood: this.evolveMood(currentState.currentMood, sentiment),
      energyLevel: Math.max(0, currentState.energyLevel - 0.1),
      coherence: this.calculateCoherence(response.content)
    };
  }

  private describeState(state: FlowerState): string {
    const moodIntensity = state.energyLevel > 0.7 ? 'very' : 'somewhat';
    return `The flower is ${moodIntensity} ${state.currentMood}`;
  }

  private analyzeSentiment(text: string): number {
    // Placeholder sentiment analysis
    const positiveWords = ['happy', 'joy', 'love', 'beautiful'];
    const negativeWords = ['sad', 'angry', 'fear', 'worried'];

    let score = 0;
    const words = text.toLowerCase().split(' ');

    words.forEach(word => {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    });

    return score;
  }

  private evolveMood(currentMood: string, sentiment: number): string {
    const moods = ['joyful', 'contemplative', 'melancholic', 'anxious', 'peaceful'];

    if (sentiment > 2) return 'joyful';
    if (sentiment < -2) return 'melancholic';
    if (sentiment === 0) return 'contemplative';

    return currentMood;
  }

  private calculateCoherence(text: string): number {
    // Simple coherence based on response length and structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return Math.min(1, sentences.length / 5);
  }
}
