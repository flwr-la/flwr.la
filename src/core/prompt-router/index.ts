import { Flower } from '../bloom-engine/types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export class PromptRouter {
  private providers: Map<string, any>;

  constructor() {
    this.providers = new Map([
      ['gpt-4', new OpenAIProvider()],
      ['claude-3', new AnthropicProvider()]
    ]);
  }

  async route(flower: Flower, context: string, input: string): Promise<any> {
    const provider = this.providers.get(flower.genome.baseModel);
    if (!provider) {
      throw new Error(`Provider not found for model: ${flower.genome.baseModel}`);
    }

    const prompt = this.constructPrompt(flower, context, input);
    return await provider.complete(prompt, {
      temperature: flower.genome.temperature
    });
  }

  private constructPrompt(flower: Flower, context: string, input: string): string {
    const traits = flower.genome.traits.join(', ');

    return `
${flower.genome.systemPrompt}

You are a flower with the following traits: ${traits}
Current mood: ${flower.state.currentMood}
Energy level: ${flower.state.energyLevel}

Context:
${context}

User: ${input}
Flower:`;
  }
}
