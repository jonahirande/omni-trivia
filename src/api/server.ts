import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const app = express();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'trivia-api' });
});

// Fetch Categories (with Kids Mode filtering)
app.get('/categories', async (req, res) => {
  const isKids = req.query.kids === 'true';
  const categories = await prisma.category.findMany({
    where: isKids ? { isKidsSafe: true } : {}
  });
  res.json(categories);
});

// Post Quick Play / Adventure Score and Update Redis Leaderboards
app.post('/matches', async (req, res) => {
  const { userId, gameMode, score, countryCode } = req.body;

  const match = await prisma.matchResult.create({
    data: { userId, gameMode, score }
  });

  // Update Global & Country Leaderboards in Redis
  await redis.zincrby(`leaderboard:global:${gameMode}`, score, userId);
  if (countryCode) {
    await redis.zincrby(`leaderboard:country:${countryCode}:${gameMode}`, score, userId);
  }

  res.status(201).json(match);
});

// Get Leaderboard Top 10
app.get('/leaderboard', async (req, res) => {
  const mode = req.query.mode || 'quick_play';
  const leaderboardKey = req.query.country 
    ? `leaderboard:country:${req.query.country}:${mode}`
    : `leaderboard:global:${mode}`;

  const rawScores = await redis.zrevrange(leaderboardKey, 0, 9, 'WITHSCORES');
  
  const standings = [];
  for (let i = 0; i < rawScores.length; i += 2) {
    standings.push({ userId: rawScores[i], score: parseInt(rawScores[i + 1], 10) });
  }

  res.json(standings);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`REST API running on port ${PORT}`));