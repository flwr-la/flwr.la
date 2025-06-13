export interface FlowerConfig {
  type: string;
  baseModel?: string;
  temperature?: number;
  systemPrompt?: string;
  traits?: string[];
  initialMemory?: string;
}

export interface Flower {
  id: string;
  version: string;
  metadata: FlowerMetadata;
  genome: FlowerGenome;
  memory: FlowerMemory;
  state: FlowerState;
}

export interface FlowerMetadata {
  created: string;
  lastBloomed: string | null;
  bloomCount: number;
}

export interface FlowerGenome {
  baseModel: string;
  temperature: number;
  systemPrompt: string;
  traits: string[];
}

export interface FlowerMemory {
  shortTerm: MemoryFragment[];
  longTerm: MemoryFragment[];
  episodic: Episode[];
}

export interface MemoryFragment {
  content: string;
  embedding?: number[];
  timestamp: Date;
  importance: number;
}

export interface Episode {
  id: string;
  fragments: MemoryFragment[];
  summary: string;
  emotionalTone: string;
}

export interface FlowerState {
  currentMood: string;
  energyLevel: number;
  coherence: number;
}

export interface BloomSession {
  sessionId: string;
  flowerId: string;
  flower: Flower;
  context: string;
  startTime: Date;
}
