import { Server } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { calculateScore } from '../shared/scoring';
import { AnswerSubmitPayload } from '../shared/types';

const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const subClient = pubClient.duplicate();

const io = new Server({
  cors: { origin: '*' }
});

io.adapter(createAdapter(pubClient, subClient));

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('room:join', ({ roomCode, userId }) => {
    socket.join(`room:${roomCode}`);
    io.to(`room:${roomCode}`).emit('room:playerJoined', { userId, socketId: socket.id });
  });

  socket.on('answer:submit', async (payload: AnswerSubmitPayload) => {
    const { roomId, questionId, userId, selectedOptionId, inputMode } = payload;

    // Fetch start timestamp set by server when question started
    const startTs = Number(await pubClient.get(`room:${roomId}:q:${questionId}:startTs`));
    const timeLimitSec = 15;
    const elapsedSec = (Date.now() - startTs) / 1000;
    const remainingTimeSec = timeLimitSec - elapsedSec;

    // Mock correct answer validation (Replace with actual DB/Redis check)
    const isCorrect = selectedOptionId === 'correct_option_id';

    const score = calculateScore({
      basePoints: 100,
      timeLimitSec,
      remainingTimeSec,
      isCorrect,
      inputMode
    });

    // Save live score in Redis Sorted Set
    await pubClient.zincrby(`room:${roomId}:scores`, score, userId);
    
    socket.emit('answer:received', { questionId, scoreEarned: score });

    const standings = await pubClient.zrevrange(`room:${roomId}:scores`, 0, -1, 'WITHSCORES');
    io.to(`room:${roomId}`).emit('leaderboard:update', { standings });
  });
});

const PORT = process.env.PORT || 4000;
io.listen(Number(PORT));
console.log(`Realtime Engine running on port ${PORT}`);