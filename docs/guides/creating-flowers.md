# Creating Custom Flowers

Learn how to create specialized flowers for different use cases.

## Flower Anatomy

Every flower has these components:

### Genome
The core configuration that defines the flower's behavior:

```json
{
  "baseModel": "gpt-4",           // LLM provider
  "temperature": 0.9,             // Creativity level (0-1)
  "systemPrompt": "You are...",   // Core instruction
  "traits": ["trait1", "trait2"]  // Personality traits
}
```

### Memory System
Flowers remember through:
- Recent interactions (short-term)
- Important information (long-term)  
- Significant moments (episodic)

### State
Dynamic properties that change:
- `currentMood`: Emotional state
- `energyLevel`: Interaction capacity
- `coherence`: Response quality

## Flower Types

### Creative Writer
```javascript
{
  type: "creative_writer",
  genome: {
    temperature: 0.9,
    traits: ["imaginative", "poetic", "philosophical"],
    systemPrompt: "You are a creative writer who sees beauty in everything..."
  }
}
```

### Technical Assistant
```javascript
{
  type: "tech_assistant",
  genome: {
    temperature: 0.3,
    traits: ["precise", "helpful", "analytical"],
    systemPrompt: "You are a technical expert who explains complex topics clearly..."
  }
}
```

### Emotional Companion
```javascript
{
  type: "companion",
  genome: {
    temperature: 0.7,
    traits: ["empathetic", "supportive", "intuitive"],
    systemPrompt: "You are a caring companion who listens deeply..."
  }
}
```

## Advanced Configuration

### Custom State Evolution

Flowers can have custom state evolution logic:

```javascript
// In your flower configuration
{
  stateEvolution: {
    moodTransitions: {
      "happy": ["joyful", "content", "playful"],
      "sad": ["melancholic", "contemplative", "quiet"]
    },
    energyDecay: 0.05  // Per interaction
  }
}
```

### Memory Strategies

Configure how memories are formed:

```javascript
{
  memoryStrategy: {
    shortTermCapacity: 10,
    importanceThreshold: 0.7,
    episodeFormation: "emotional"  // or "temporal", "thematic"
  }
}
```

## Best Practices

1. **Clear Traits**: Use specific, actionable traits
2. **Balanced Temperature**: Higher for creative tasks, lower for factual
3. **Rich System Prompts**: Provide context and examples
4. **Test Interactions**: Bloom frequently during development

## Example: Custom Study Buddy

```javascript
const studyBuddy = await client.seed({
  type: "study_buddy",
  genome: {
    baseModel: "gpt-4",
    temperature: 0.5,
    systemPrompt: `You are an encouraging study companion who:
    - Breaks down complex topics into simple parts
    - Celebrates small victories
    - Remembers what the user is learning
    - Offers gentle reminders and motivation`,
    traits: ["encouraging", "patient", "organized", "knowledgeable"]
  },
  initialMemory: "I love helping people learn and grow!"
});
```

## Sharing Flowers

Export your flower for others to use:

```bash
flwr export my_flower_id > my_custom_flower.flwr
```

Import a shared flower:

```bash
flwr import my_custom_flower.flwr
```

## Next Steps

- Explore [example flowers](/examples)
- Read about [Memory Architecture](/docs/ARCHITECTURE.md#memory-architecture)
- Join our community to share your creations!
