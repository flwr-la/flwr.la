import { Router } from 'express';
import { BloomEngine } from '../../core/bloom-engine';

const router = Router();
const bloomEngine = new BloomEngine();

// Seed a new flower
router.post('/flowers/seed', async (req, res) => {
  try {
    const flower = await bloomEngine.seed(req.body);
    res.json({
      flowerId: flower.id,
      status: 'seeded',
      createdAt: flower.metadata.created
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bloom a flower
router.post('/flowers/:flowerId/bloom', async (req, res) => {
  try {
    const session = await bloomEngine.bloom(req.params.flowerId);
    res.json({
      flowerId: session.flowerId,
      status: 'blooming',
      state: session.flower.state,
      sessionId: session.sessionId
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Interact with flower
router.post('/flowers/:flowerId/tend', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const result = await bloomEngine.tend(sessionId, message);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Wilt a flower
router.delete('/flowers/:flowerId/wilt', async (req, res) => {
  try {
    await bloomEngine.wilt(req.params.flowerId);
    res.json({ status: 'wilted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
