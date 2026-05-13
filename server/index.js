const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { cards: DECK } = require('./cards');

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', cards: DECK.length }));

// ─── State ──────────────────────────────────────────────────────────────────
const rooms = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealCards(room, playerId, count, roundUsed = new Set()) {
  if (!room.usedCardsPerPlayer[playerId]) room.usedCardsPerPlayer[playerId] = new Set();
  const personalUsed = room.usedCardsPerPlayer[playerId];

  // Prefer cards not seen by this player AND not dealt to anyone else this round
  let available = DECK.filter((c) => !personalUsed.has(c.id) && !roundUsed.has(c.id));

  // If deck is too depleted, relax the personal-history constraint but keep round-uniqueness
  if (available.length < count) {
    available = DECK.filter((c) => !roundUsed.has(c.id));
  }

  const dealt = shuffle(available).slice(0, count);
  dealt.forEach((c) => {
    personalUsed.add(c.id);
    roundUsed.add(c.id);
  });
  return dealt;
}

function sanitizeRoom(room, forPlayerId) {
  const isResults = room.status === 'results';
  const isEnd = room.status === 'end';
  const showOwners = isResults || isEnd;

  let tableCards = null;
  if (showOwners && room.table.length) {
    tableCards = room.table.map((t) => ({
      cardId: t.cardId,
      card: DECK.find((c) => c.id === t.cardId),
      ownerId: t.playerId,
      ownerName: room.players.find((p) => p.id === t.playerId)?.name ?? '?',
      isBuyer: t.playerId === room.buyerId,
      votedBy: Object.entries(room.votes)
        .filter(([, v]) => v === t.cardId)
        .map(([vid]) => room.players.find((p) => p.id === vid)?.name ?? '?'),
    }));
  } else if (room.status === 'voting' && room.tableShuffled.length) {
    tableCards = room.tableShuffled;
  }

  return {
    code: room.code,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: room.scores[p.id] ?? 0,
      isHost: p.isHost,
      disconnected: p.disconnected ?? false,
    })),
    status: room.status,
    round: room.round,
    maxRounds: room.maxRounds,
    buyerId: room.buyerId,
    buyerName: room.players.find((p) => p.id === room.buyerId)?.name ?? '',
    clue: room.clue,
    phaseStartTime: room.phaseStartTime,
    phaseDuration: room.phaseDuration,
    tableCount: room.table.filter((t) => t.playerId !== room.buyerId).length,
    votesCount: Object.keys(room.votes).length,
    tableCards,
    buyerCardId: showOwners ? room.buyerCard?.id : null,
    votes: showOwners ? room.votes : null,
    scores: room.scores,
    hand: room.hands[forPlayerId] ?? [],
    hasPlayed: room.table.some((t) => t.playerId === forPlayerId),
    hasVoted: !!room.votes[forPlayerId],
    roundHistory: isEnd ? room.roundHistory : [],
    lastRoundHistory: isResults ? room.roundHistory[room.roundHistory.length - 1] ?? null : null,
    scoreDeltas: isResults ? room.lastScoreDeltas ?? {} : {},
  };
}

function broadcastRoom(room) {
  room.players.forEach((p) => {
    io.to(p.id).emit('room-update', sanitizeRoom(room, p.id));
  });
}

// ─── Game Logic ──────────────────────────────────────────────────────────────
function createRoom(code, hostId, hostName) {
  return {
    code,
    players: [{ id: hostId, name: hostName, isHost: true }],
    status: 'lobby',
    round: 0,
    maxRounds: 6,
    buyerIndex: 0,
    buyerId: null,
    clue: null,
    table: [],
    tableShuffled: [],
    votes: {},
    scores: {},
    hands: {},
    buyerCard: null,
    usedCardsPerPlayer: {},
    roundHistory: [],
    lastScoreDeltas: {},
    phaseStartTime: null,
    phaseDuration: null,
    timer: null,
  };
}

function startRound(room) {
  room.buyerId = room.players[room.buyerIndex % room.players.length].id;
  room.clue = null;
  room.table = [];
  room.tableShuffled = [];
  room.votes = {};
  room.buyerCard = null;
  room.lastScoreDeltas = {};
  room.hands = {};

  // Share one roundUsed set so no card appears in two players' hands
  const roundUsed = new Set();

  const [buyerCard] = dealCards(room, room.buyerId, 1, roundUsed);
  room.buyerCard = buyerCard;
  room.hands[room.buyerId] = [buyerCard];

  room.players.forEach((p) => {
    if (p.id !== room.buyerId) {
      room.hands[p.id] = dealCards(room, p.id, 4, roundUsed);
    }
  });

  room.status = 'clue';
  room.phaseStartTime = Date.now();
  room.phaseDuration = 120;
}

function beginVoting(code, room) {
  room.table.push({ playerId: room.buyerId, cardId: room.buyerCard.id });
  room.tableShuffled = shuffle(room.table).map((t) => ({
    cardId: t.cardId,
    card: DECK.find((c) => c.id === t.cardId),
  }));

  room.status = 'voting';
  room.phaseStartTime = Date.now();
  room.phaseDuration = 45;

  clearTimeout(room.timer);
  room.timer = setTimeout(() => autoVote(code), 45_000);
  broadcastRoom(room);
}

function calculateScores(room) {
  const buyerCardId = room.buyerCard.id;
  const nonBuyers = room.players.filter((p) => !p.disconnected && p.id !== room.buyerId);
  const correctVoters = nonBuyers.filter((p) => room.votes[p.id] === buyerCardId);
  const deltas = {};
  room.players.forEach((p) => (deltas[p.id] = 0));

  if (correctVoters.length === 0 || correctVoters.length === nonBuyers.length) {
    nonBuyers.forEach((p) => {
      deltas[p.id] += 2;
      room.scores[p.id] = (room.scores[p.id] ?? 0) + 2;
    });
  } else {
    deltas[room.buyerId] += 3;
    room.scores[room.buyerId] = (room.scores[room.buyerId] ?? 0) + 3;
    correctVoters.forEach((p) => {
      deltas[p.id] += 3;
      room.scores[p.id] = (room.scores[p.id] ?? 0) + 3;
    });
  }

  room.table.forEach((entry) => {
    if (entry.playerId !== room.buyerId) {
      const voteCount = Object.values(room.votes).filter((v) => v === entry.cardId).length;
      if (voteCount > 0) {
        deltas[entry.playerId] += voteCount;
        room.scores[entry.playerId] = (room.scores[entry.playerId] ?? 0) + voteCount;
      }
    }
  });

  room.lastScoreDeltas = deltas;

  room.roundHistory.push({
    round: room.round,
    buyerId: room.buyerId,
    buyerName: room.players.find((p) => p.id === room.buyerId)?.name ?? '',
    clue: room.clue,
    buyerCard: room.buyerCard,
  });
}

// ─── Auto-advance functions ───────────────────────────────────────────────────
function autoClue(code) {
  const room = rooms[code];
  if (!room || room.status !== 'clue') return;
  room.clue = '…';
  room.status = 'picking';
  room.phaseStartTime = Date.now();
  room.phaseDuration = 120;
  clearTimeout(room.timer);
  room.timer = setTimeout(() => autoPick(code), 120_000);
  broadcastRoom(room);
}

function autoPick(code) {
  const room = rooms[code];
  if (!room || room.status !== 'picking') return;
  room.players.forEach((p) => {
    if (p.id !== room.buyerId && !p.disconnected && !room.table.some((t) => t.playerId === p.id)) {
      const hand = room.hands[p.id];
      if (hand?.length) room.table.push({ playerId: p.id, cardId: hand[0].id });
    }
  });
  beginVoting(code, room);
}

function autoVote(code) {
  const room = rooms[code];
  if (!room || room.status !== 'voting') return;
  const otherCards = room.tableShuffled.filter((t) => t.cardId !== room.buyerCard?.id);
  room.players.forEach((p) => {
    if (p.id !== room.buyerId && !p.disconnected && !room.votes[p.id]) {
      if (otherCards.length) {
        room.votes[p.id] = otherCards[Math.floor(Math.random() * otherCards.length)].cardId;
      }
    }
  });
  calculateScores(room);
  room.status = 'results';
  broadcastRoom(room);
}

// ─── Socket Events ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('create-room', ({ name }, cb) => {
    let code;
    do { code = generateCode(); } while (rooms[code]);

    const room = createRoom(code, socket.id, name);
    rooms[code] = room;
    room.scores[socket.id] = 0;

    socket.join(code);
    socket.data.roomCode = code;

    cb({ success: true, code, room: sanitizeRoom(room, socket.id) });
  });

  socket.on('join-room', ({ code, name }, cb) => {
    const upper = (code ?? '').toUpperCase();
    const room = rooms[upper];
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.status !== 'lobby') return cb({ success: false, error: 'Game already started' });
    if (room.players.length >= 9) return cb({ success: false, error: 'Room is full' });
    if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      return cb({ success: false, error: 'Name already taken in this room' });

    room.players.push({ id: socket.id, name, isHost: false });
    room.scores[socket.id] = 0;

    socket.join(upper);
    socket.data.roomCode = upper;

    broadcastRoom(room);
    cb({ success: true, code: upper, room: sanitizeRoom(room, socket.id) });
  });

  // Page-refresh reconnect: find player by name, update socket ID in all state maps
  socket.on('reconnect-room', ({ code, name }, cb) => {
    const upper = (code ?? '').toUpperCase();
    const room = rooms[upper];
    if (!room) return cb({ success: false, error: 'Room not found' });

    const player = room.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!player) return cb({ success: false, error: 'Player not found' });

    const oldId = player.id;
    const newId = socket.id;

    // Migrate all ID-keyed maps from old socket ID to new one
    if (oldId !== newId) {
      player.id = newId;
      player.disconnected = false;

      for (const map of [room.scores, room.hands, room.votes, room.usedCardsPerPlayer]) {
        if (oldId in map) { map[newId] = map[oldId]; delete map[oldId]; }
      }
      if (room.buyerId === oldId) room.buyerId = newId;
      room.table.forEach((t) => { if (t.playerId === oldId) t.playerId = newId; });
    }

    socket.join(upper);
    socket.data.roomCode = upper;

    broadcastRoom(room);
    cb({ success: true, code: upper, room: sanitizeRoom(room, newId) });
  });

  socket.on('start-game', ({ code }) => {
    const room = rooms[code];
    if (!room) return;
    if (room.players[0].id !== socket.id) return;
    if (room.players.length < 3) return;

    startRound(room);
    clearTimeout(room.timer);
    room.timer = setTimeout(() => autoClue(code), 120_000);
    broadcastRoom(room);
  });

  socket.on('submit-clue', ({ code, clue }) => {
    const room = rooms[code];
    if (!room || room.status !== 'clue' || room.buyerId !== socket.id) return;

    room.clue = (clue ?? '').substring(0, 60);
    room.status = 'picking';
    room.phaseStartTime = Date.now();
    room.phaseDuration = 120;

    clearTimeout(room.timer);
    room.timer = setTimeout(() => autoPick(code), 120_000);
    broadcastRoom(room);
  });

  socket.on('play-card', ({ code, cardId }) => {
    const room = rooms[code];
    if (!room || room.status !== 'picking') return;
    if (socket.id === room.buyerId) return;
    if (room.table.some((t) => t.playerId === socket.id)) return;

    const hand = room.hands[socket.id];
    if (!hand?.find((c) => c.id === cardId)) return;

    room.table.push({ playerId: socket.id, cardId });

    const activePlayers = room.players.filter((p) => p.id !== room.buyerId && !p.disconnected);
    if (room.table.length >= activePlayers.length) {
      clearTimeout(room.timer);
      beginVoting(code, room);
    } else {
      broadcastRoom(room);
    }
  });

  socket.on('submit-vote', ({ code, cardId }) => {
    const room = rooms[code];
    if (!room || room.status !== 'voting') return;
    if (socket.id === room.buyerId) return;
    if (room.votes[socket.id]) return;

    room.votes[socket.id] = cardId;

    const activePlayers = room.players.filter((p) => p.id !== room.buyerId && !p.disconnected);
    if (Object.keys(room.votes).length >= activePlayers.length) {
      clearTimeout(room.timer);
      calculateScores(room);
      room.status = 'results';
    }
    broadcastRoom(room);
  });

  socket.on('next-round', ({ code }) => {
    const room = rooms[code];
    if (!room || room.status !== 'results') return;
    if (room.players[0].id !== socket.id) return;

    room.round += 1;
    room.buyerIndex += 1;

    if (room.round >= room.maxRounds) {
      room.status = 'end';
      broadcastRoom(room);
    } else {
      startRound(room);
      clearTimeout(room.timer);
      room.timer = setTimeout(() => autoClue(code), 120_000);
      broadcastRoom(room);
    }
  });

  socket.on('disconnect', () => {
    const code = socket.data?.roomCode;
    if (!code) return;
    const room = rooms[code];
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    player.disconnected = true;

    // If buyer disconnected during clue phase, auto-advance
    if (room.buyerId === socket.id && room.status === 'clue') {
      clearTimeout(room.timer);
      autoClue(code);
    } else {
      broadcastRoom(room);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Coveted server on :${PORT}`));
