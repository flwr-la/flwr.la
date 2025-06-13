import { Flower, FlowerState } from '../bloom-engine/types';
import { logger } from '../../utils/logger';

export class EvolutionManager {
  private evolutionRules: Map<string, EvolutionRule>;

  constructor() {
    this.evolutionRules = new Map([
      ['emotional_continuity', new EmotionalContinuityRule()],
      ['memory_influence', new MemoryInfluenceRule()],
      ['interaction_pattern', new InteractionPatternRule()],
      ['energy_dynamics', new EnergyDynamicsRule()]
    ]);
  }

  async evolveFlower(
    flower: Flower,
    interaction: any,
    context: EvolutionContext
  ): Promise<Flower> {
    logger.info('Evolving flower', { flowerId: flower.id });

    let evolvedFlower = { ...flower };

    // Apply each evolution rule
    for (const [name, rule] of this.evolutionRules) {
      if (rule.shouldApply(evolvedFlower, context)) {
        evolvedFlower = await rule.apply(evolvedFlower, interaction, context);
        logger.debug(`Applied evolution rule: ${name}`);
      }
    }

    // Check for emergent behaviors
    evolvedFlower = this.checkEmergentBehaviors(evolvedFlower);

    // Update evolution history
    evolvedFlower.metadata.evolutionHistory = [
      ...(evolvedFlower.metadata.evolutionHistory || []),
      {
        timestamp: new Date().toISOString(),
        changes: this.detectChanges(flower, evolvedFlower),
        trigger: interaction.input.slice(0, 50)
      }
    ];

    return evolvedFlower;
  }

  private checkEmergentBehaviors(flower: Flower): Flower {
    const traits = flower.genome.traits;
    const mood = flower.state.currentMood;
    const energy = flower.state.energyLevel;

    // Complex trait interactions
    if (traits.includes('creative') && traits.includes('melancholic') && energy < 0.3) {
      flower.state.emergentState = 'profound_introspection';
    } else if (traits.includes('empathetic') && mood === 'joyful' && energy > 0.8) {
      flower.state.emergentState = 'radiant_compassion';
    }

    return flower;
  }

  private detectChanges(before: Flower, after: Flower): any {
    return {
      mood: before.state.currentMood !== after.state.currentMood,
      energy: Math.abs(before.state.energyLevel - after.state.energyLevel) > 0.1,
      traits: JSON.stringify(before.genome.traits) !== JSON.stringify(after.genome.traits),
      emergent: before.state.emergentState !== after.state.emergentState
    };
  }
}

interface EvolutionRule {
  shouldApply(flower: Flower, context: EvolutionContext): boolean;
  apply(flower: Flower, interaction: any, context: EvolutionContext): Promise<Flower>;
}

interface EvolutionContext {
  interactionCount: number;
  sessionDuration: number;
  emotionalTrajectory: string[];
  recentTopics: string[];
}

class EmotionalContinuityRule implements EvolutionRule {
  shouldApply(flower: Flower, context: EvolutionContext): boolean {
    return context.emotionalTrajectory.length > 3;
  }

  async apply(flower: Flower, interaction: any, context: EvolutionContext): Promise<Flower> {
    // Ensure emotional transitions are smooth and believable
    const trajectory = context.emotionalTrajectory.slice(-5);
    const dominantEmotion = this.findDominantEmotion(trajectory);

    if (dominantEmotion && this.isStablePattern(trajectory)) {
      flower.state.emotionalInertia = 0.8; // Resist sudden changes
    } else {
      flower.state.emotionalInertia = 0.3; // More responsive to change
    }

    return flower;
  }

  private findDominantEmotion(trajectory: string[]): string {
    const counts = trajectory.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
  }

  private isStablePattern(trajectory: string[]): boolean {
    const uniqueEmotions = new Set(trajectory).size;
    return uniqueEmotions <= 2;
  }
}

class MemoryInfluenceRule implements EvolutionRule {
  shouldApply(flower: Flower, context: EvolutionContext): boolean {
    return flower.memory.episodic.length > 0;
  }

  async apply(flower: Flower, interaction: any, context: EvolutionContext): Promise<Flower> {
    // Let memories influence current state
    const relevantMemories = this.findRelevantMemories(
      flower.memory.episodic,
      interaction.input
    );

    if (relevantMemories.length > 0) {
      const memoryInfluence = this.calculateMemoryInfluence(relevantMemories);
      flower.state.memoryResonance = memoryInfluence.resonance;

      // Adjust mood based on memory emotional tone
      if (memoryInfluence.emotionalPull > 0.6) {
        flower.state.currentMood = this.blendMoods(
          flower.state.currentMood,
          memoryInfluence.dominantEmotion,
          0.3
        );
      }
    }

    return flower;
  }

  private findRelevantMemories(episodes: any[], input: string): any[] {
    // Simple keyword matching - in production, use embeddings
    const keywords = input.toLowerCase().split(' ');
    return episodes.filter(ep => 
      keywords.some(kw => ep.summary.toLowerCase().includes(kw))
    );
  }

  private calculateMemoryInfluence(memories: any[]): any {
    // Analyze memory emotional patterns
    const emotions = memories.map(m => m.emotionalTone);
    const dominantEmotion = emotions[0]; // Simplified

    return {
      resonance: Math.min(memories.length / 10, 1),
      emotionalPull: 0.7,
      dominantEmotion
    };
  }

  private blendMoods(current: string, memory: string, weight: number): string {
    // Simplified mood blending
    const moodMap: Record<string, string[]> = {
      'joyful': ['happy', 'excited', 'playful'],
      'melancholic': ['sad', 'thoughtful', 'nostalgic'],
      'contemplative': ['thoughtful', 'curious', 'calm']
    };

    return weight > 0.5 ? memory : current;
  }
}

class InteractionPatternRule implements EvolutionRule {
  shouldApply(flower: Flower, context: EvolutionContext): boolean {
    return context.interactionCount > 5;
  }

  async apply(flower: Flower, interaction: any, context: EvolutionContext): Promise<Flower> {
    // Detect and respond to interaction patterns
    const topics = context.recentTopics;

    if (this.isRepetitivePattern(topics)) {
      flower.state.conversationMode = 'exploring_variations';
      flower.genome.temperature = Math.min(flower.genome.temperature + 0.1, 0.95);
    } else if (this.isDiversePattern(topics)) {
      flower.state.conversationMode = 'adaptive_engagement';
    }

    return flower;
  }

  private isRepetitivePattern(topics: string[]): boolean {
    const uniqueTopics = new Set(topics).size;
    return uniqueTopics / topics.length < 0.3;
  }

  private isDiversePattern(topics: string[]): boolean {
    const uniqueTopics = new Set(topics).size;
    return uniqueTopics / topics.length > 0.8;
  }
}

class EnergyDynamicsRule implements EvolutionRule {
  shouldApply(flower: Flower, context: EvolutionContext): boolean {
    return true; // Always apply energy dynamics
  }

  async apply(flower: Flower, interaction: any, context: EvolutionContext): Promise<Flower> {
    const responseLength = interaction.response.length;
    const complexity = this.calculateComplexity(interaction);

    // Energy cost based on response complexity
    const energyCost = Math.min(
      0.05 + (complexity * 0.1) + (responseLength / 10000),
      0.2
    );

    flower.state.energyLevel = Math.max(0, flower.state.energyLevel - energyCost);

    // Low energy affects other states
    if (flower.state.energyLevel < 0.2) {
      flower.state.coherence = Math.max(0.5, flower.state.coherence - 0.1);
      flower.genome.temperature = Math.max(0.3, flower.genome.temperature - 0.1);
    }

    // Energy recovery in quiet moments
    if (interaction.input.length < 50 && !this.isComplexQuery(interaction.input)) {
      flower.state.energyLevel = Math.min(1, flower.state.energyLevel + 0.05);
    }

    return flower;
  }

  private calculateComplexity(interaction: any): number {
    // Simplified complexity calculation
    const factors = {
      questionCount: (interaction.input.match(/\?/g) || []).length,
      wordCount: interaction.input.split(' ').length,
      emotionalIntensity: this.detectEmotionalIntensity(interaction.input)
    };

    return (factors.questionCount * 0.3 + 
            factors.wordCount / 100 + 
            factors.emotionalIntensity * 0.4);
  }

  private isComplexQuery(input: string): boolean {
    const complexIndicators = ['explain', 'analyze', 'compare', 'why', 'how'];
    return complexIndicators.some(ind => input.toLowerCase().includes(ind));
  }

  private detectEmotionalIntensity(text: string): number {
    const intenseWords = ['love', 'hate', 'desperate', 'ecstatic', 'terrified'];
    const matches = intenseWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;

    return Math.min(matches / 3, 1);
  }
}

export { EvolutionContext };
