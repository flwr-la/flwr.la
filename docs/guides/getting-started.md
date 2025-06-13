# Getting Started with flwr.la

Welcome to flwr.la! This guide will help you create your first flower and understand the core concepts.

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (or other LLM provider)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flwr.la.git
cd flwr.la
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the development server:
```bash
npm run dev
```

## Core Concepts

### What is a Flower?
A flower in flwr.la is an ephemeral LLM module that:
- Has a unique personality (genome)
- Maintains memories across sessions
- Evolves based on interactions
- Lives only while "blooming"

### Flower Lifecycle

1. **Seed** 🌱: Create a new flower with initial configuration
2. **Bloom** 🌸: Activate the flower for interaction
3. **Tend** 🌺: Interact with the blooming flower
4. **Wilt** 🥀: End the session or delete the flower

## Your First Flower

### Using the API

```javascript
// Import the client
import { FlwrClient } from '@flwr/sdk';

const client = new FlwrClient({
  apiKey: process.env.FLWR_API_KEY
});

// Plant a seed
const flower = await client.seed({
  type: 'companion',
  traits: ['friendly', 'curious', 'empathetic'],
  temperature: 0.8
});

// Bloom the flower
const session = await client.bloom(flower.flowerId);

// Interact
const response = await client.tend(session.sessionId, {
  message: "Hello, flower! How are you feeling today?"
});

console.log(response.message);
// "Hello! I'm feeling quite curious and peaceful today..."
```

### Using the CLI

```bash
# Create a new flower
flwr seed --type creative_writer --traits "poetic,dreamy"

# List your flowers
flwr list

# Bloom and interact
flwr bloom creative_writer_a7b3c9
> Hello flower!
< Ah, a greeting floats like a petal on the wind...
```

## Understanding Flower Memory

Flowers have three types of memory:

1. **Short-term**: Current conversation context
2. **Long-term**: Important facts and patterns
3. **Episodic**: Memorable interactions

Memory persists between bloom sessions but lives in the `.flwr` file.

## Next Steps

- Read [Creating Custom Flowers](creating-flowers.md)
- Explore the [API Documentation](/docs/api/v1.md)
- Join our [Discord community](https://discord.gg/flwrla)
