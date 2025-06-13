const { BloomEngine } = require('../dist/core/bloom-engine');

async function seedFlower() {
  const engine = new BloomEngine();

  const config = {
    type: process.argv[2] || 'companion',
    traits: (process.argv[3] || 'friendly,helpful').split(','),
    temperature: parseFloat(process.argv[4] || '0.7')
  };

  console.log('🌱 Seeding flower with config:', config);

  try {
    const flower = await engine.seed(config);
    console.log('🌸 Flower created:', flower.id);
    console.log('📁 Saved to: flowerbed/' + flower.id + '.flwr');
  } catch (error) {
    console.error('❌ Failed to seed flower:', error.message);
  }
}

seedFlower();
