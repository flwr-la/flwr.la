import { v4 as uuidv4 } from 'uuid';
import { FlowerConfig, Flower, BloomSession } from '../types';
import { StateEncoder } from '../state-encoder';
import { PromptRouter } from '../prompt-router';
import { MemoryManager } from '../memory-manager';

export class BloomEngine {
  private stateEncoder: StateEncoder;
  private promptRouter: PromptRouter;
  private memoryManager: MemoryManager;
  private activeSessions: Map<string, BloomSession>;

  constructor() {
    this.stateEncoder = new StateEncoder();
    this.promptRouter = new PromptRouter();
    this.memoryManager = new MemoryManager();
    this.activeSessions = new Map();
  }

  async seed(config: FlowerConfig): Promise<Flower> {
    const flowerId = `${config.type}_${uuidv4().slice(0, 6)}`;

    const flower: Flower = {
      id: flowerId,
      version: '1.0',
      metadata: {
        created: new Date().toISOString(),
        lastBloomed: null,
        bloomCount: 0
      },
      genome: {
        baseModel: config.baseModel || 'gpt-4',
        temperature: config.temperature || 0.7,
        systemPrompt: config.systemPrompt || '',
        traits: config.traits || []
      },
      memory: {
        shortTerm: [],
        longTerm: [],
        episodic: []
      },
      state: {
        currentMood: 'neutral',
        energyLevel: 1.0,
        coherence: 1.0
      }
    };

    await this.memoryManager.save(flower);
    return flower;
  }

  async bloom(flowerId: string): Promise<BloomSession> {
    const flower = await this.memoryManager.load(flowerId);
    if (!flower) {
      throw new Error('Flower not found');
    }

    const sessionId = uuidv4();
    const context = await this.stateEncoder.encode(flower);

    const session: BloomSession = {
      sessionId,
      flowerId,
      flower,
      context,
      startTime: new Date()
    };

    this.activeSessions.set(sessionId, session);

    // Update flower metadata
    flower.metadata.lastBloomed = new Date().toISOString();
    flower.metadata.bloomCount++;

    return session;
  }

  async tend(sessionId: string, input: string): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Route to appropriate LLM
    const response = await this.promptRouter.route(
      session.flower,
      session.context,
      input
    );

    // Update flower state based on interaction
    session.flower.state = await this.stateEncoder.updateState(
      session.flower.state,
      input,
      response
    );

    // Update memories
    await this.memoryManager.updateMemories(session.flower, {
      input,
      response,
      timestamp: new Date()
    });

    return {
      response: response.content,
      state: session.flower.state
    };
  }

  async wilt(flowerId: string): Promise<void> {
    // Remove all active sessions for this flower
    for (const [sessionId, session] of this.activeSessions) {
      if (session.flowerId === flowerId) {
        this.activeSessions.delete(sessionId);
      }
    }

    // Delete flower data
    await this.memoryManager.delete(flowerId);
  }
}
