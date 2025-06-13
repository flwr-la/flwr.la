import express from 'express';
import dotenv from 'dotenv';
import flowerRoutes from './api/routes/flowers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/v1', flowerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'blooming' });
});

app.listen(PORT, () => {
  console.log(`🌸 flwr.la blooming on port ${PORT}`);
});

export default app;
