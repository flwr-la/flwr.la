import { BloomEngine } from '../../src/core/bloom-engine';
import { FlowerConfig } from '../../src/core/bloom-engine/types';

describe('BloomEngine', () => {
  let engine: BloomEngine;

  beforeEach(() => {
    engine = new BloomEngine();
  });

  describe('seed', () => {
    it('should create a new flower', async () => {
      const config: FlowerConfig = {
        type: 'test_flower',
        traits: ['happy', 'creative']
      };

      const flower = await engine.seed(config);

      expect(flower.id).toContain('test_flower');
      expect(flower.genome.traits).toEqual(['happy', 'creative']);
      expect(flower.metadata.bloomCount).toBe(0);
    });
  });

  describe('bloom', () => {
    it('should create a bloom session', async () => {
      const config: FlowerConfig = { type: 'test' };
      const flower = await engine.seed(config);

      const session = await engine.bloom(flower.id);

      expect(session.sessionId).toBeDefined();
      expect(session.flowerId).toBe(flower.id);
      expect(session.flower.metadata.bloomCount).toBe(1);
    });

    it('should throw error for non-existent flower', async () => {
      await expect(engine.bloom('non_existent')).rejects.toThrow('Flower not found');
    });
  });
});
