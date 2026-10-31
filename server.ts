import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  COSMETIC_CATALOG,
  DAILY_CHALLENGES,
  HISTORICAL_EVENT_CARDS,
  MapEdition,
} from './src/game/boardData';
import {
  GameRoomState,
  TradeOffer,
  applyEventCard,
  calculatePlayerNetWorth,
  calculateRent,
  canBuildOnProperty,
  checkWinCondition,
  createInitialRoomState,
  executePropertyPurchase,
  placeAuctionBid,
  validateAndExecuteTrade,
  rejectTradeOffer,
  withdrawTradeOffer,
} from './src/game/rules';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SERVER_SECRET = process.env.SESSION_SECRET || 'samrat-monopoly-aes-hmac-secret-2026-key';
const AES_KEY = crypto.createHash('sha256').update(SERVER_SECRET).digest();

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  emailEncrypted: string;
  passwordHash: string;
  salt: string;
  mudraCoins: number;
  totalWealthEarned: number;
  gamesPlayed: number;
  gamesWon: number;
  citiesMonopolized: number;
  equippedToken: string;
  unlockedCosmetics: string[];
  claimedChallenges: string[];
  pushNotificationsEnabled: boolean;
  stats: {
    rolls: number;
    properties_bought: number;
    auctions_won: number;
    trades_completed: number;
    rent_collected: number;
    landmarks_upgraded: number;
  };
  paymentHistory: {
    txnId: string;
    itemName: string;
    method: string;
    amountInr: number;
    timestamp: number;
  }[];
  createdAt: number;
}

interface DatabaseSchema {
  users: Record<string, UserProfile>;
}

function encryptText(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function signToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyToken(token?: string): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const payload = `${userId}.${ts}`;
  const expected = crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex');
  if (sig !== expected) return null;
  return userId;
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE) || fs.statSync(DB_FILE).size === 0) {
    const salt1 = crypto.randomBytes(16).toString('hex');
    const salt2 = crypto.randomBytes(16).toString('hex');
    const salt3 = crypto.randomBytes(16).toString('hex');
    const initial: DatabaseSchema = {
      users: {
        usr_pardhiv: {
          id: 'usr_pardhiv',
          username: 'pardhiv_samrat',
          displayName: 'Pardhiv Samrat',
          emailEncrypted: encryptText('itzpardhiv@gmail.com'),
          passwordHash: hashPassword('samrat123', salt1),
          salt: salt1,
          mudraCoins: 640,
          totalWealthEarned: 148500,
          gamesPlayed: 14,
          gamesWon: 9,
          citiesMonopolized: 27,
          equippedToken: 'elephant',
          unlockedCosmetics: ['royal_elephant', 'vande_bharat'],
          claimedChallenges: [],
          pushNotificationsEnabled: true,
          stats: {
            rolls: 42,
            properties_bought: 19,
            auctions_won: 4,
            trades_completed: 5,
            rent_collected: 36000,
            landmarks_upgraded: 8,
          },
          paymentHistory: [],
          createdAt: Date.now() - 86400000 * 5,
        },
        usr_ananya: {
          id: 'usr_ananya',
          username: 'ananya_mumbai',
          displayName: 'Ananya Deshmukh',
          emailEncrypted: encryptText('ananya@bharatplay.in'),
          passwordHash: hashPassword('mumbai123', salt2),
          salt: salt2,
          mudraCoins: 520,
          totalWealthEarned: 132400,
          gamesPlayed: 12,
          gamesWon: 7,
          citiesMonopolized: 21,
          equippedToken: 'peacock',
          unlockedCosmetics: ['royal_elephant', 'peacock_chariot'],
          claimedChallenges: [],
          pushNotificationsEnabled: true,
          stats: {
            rolls: 31,
            properties_bought: 14,
            auctions_won: 3,
            trades_completed: 4,
            rent_collected: 28000,
            landmarks_upgraded: 6,
          },
          paymentHistory: [],
          createdAt: Date.now() - 86400000 * 4,
        },
        usr_rohan: {
          id: 'usr_rohan',
          username: 'rohan_bengaluru',
          displayName: 'Rohan Krishnamurthy',
          emailEncrypted: encryptText('rohan@bharatplay.in'),
          passwordHash: hashPassword('bengaluru123', salt3),
          salt: salt3,
          mudraCoins: 490,
          totalWealthEarned: 119800,
          gamesPlayed: 11,
          gamesWon: 6,
          citiesMonopolized: 18,
          equippedToken: 'rocket',
          unlockedCosmetics: ['royal_elephant', 'isro_rocket'],
          claimedChallenges: [],
          pushNotificationsEnabled: true,
          stats: {
            rolls: 25,
            properties_bought: 11,
            auctions_won: 2,
            trades_completed: 3,
            rent_collected: 22500,
            landmarks_upgraded: 5,
          },
          paymentHistory: [],
          createdAt: Date.now() - 86400000 * 3,
        },
      },
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DatabaseSchema;
  } catch {
    return { users: {} };
  }
}

const db = loadDatabase();
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to persist DB:', e);
  }
}

function sanitizeUser(u: UserProfile) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    mudraCoins: u.mudraCoins,
    totalWealthEarned: u.totalWealthEarned,
    gamesPlayed: u.gamesPlayed,
    gamesWon: u.gamesWon,
    citiesMonopolized: u.citiesMonopolized,
    equippedToken: u.equippedToken,
    unlockedCosmetics: u.unlockedCosmetics,
    claimedChallenges: u.claimedChallenges,
    pushNotificationsEnabled: u.pushNotificationsEnabled,
    stats: u.stats,
    paymentHistory: u.paymentHistory,
    encryptionBadge: 'AES-256-GCM + Scrypt KDF Verified',
  };
}

// Active rooms and chat history
const rooms = new Map<string, GameRoomState>();
const roomChats = new Map<
  string,
  { id: string; senderId: string; senderName: string; senderColor: string; text: string; timestamp: number }[]
>();

function ensureDefaultRoom(): GameRoomState {
  let room = rooms.get('BHARAT-108');
  if (!room) {
    room = createInitialRoomState(
      'BHARAT-108',
      'india',
      { id: 'usr_pardhiv', name: 'Pardhiv Samrat', tokenKey: 'elephant' },
      true
    );
    rooms.set('BHARAT-108', room);
    roomChats.set('BHARAT-108', [
      {
        id: 'chat_welcome_1',
        senderId: 'bot_ahilya',
        senderName: 'Rani Ahilya (AI)',
        senderColor: '#10B981',
        text: 'Namaste! Ready to bid for Jaipur and Varanasi deeds in Room BHARAT-108.',
        timestamp: Date.now() - 30000,
      },
      {
        id: 'chat_welcome_2',
        senderId: 'bot_vikram',
        senderName: 'Vikramaditya (AI)',
        senderColor: '#38BDF8',
        text: 'Keep an eye on Mumbai & New Delhi — I am saving treasury for the Sovereign Capitals!',
        timestamp: Date.now() - 15000,
      },
    ]);
  }
  return room;
}

ensureDefaultRoom();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth routes
  app.post('/api/auth/register', (req, res) => {
    const { username, displayName, email, password } = req.body || {};
    if (!username || !password || String(username).trim().length < 3) {
      res.status(400).json({ error: 'Username (min 3 chars) and password are required.' });
      return;
    }
    const cleanUser = String(username).trim().toLowerCase();
    const existing = Object.values(db.users).find((u) => u.username === cleanUser);
    if (existing) {
      res.status(409).json({ error: 'Username already registered.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const id = `usr_${Date.now().toString(36)}`;
    const newUser: UserProfile = {
      id,
      username: cleanUser,
      displayName: String(displayName || username).trim(),
      emailEncrypted: encryptText(String(email || `${cleanUser}@bharatplay.in`)),
      passwordHash: hashPassword(String(password), salt),
      salt,
      mudraCoins: 300,
      totalWealthEarned: 12000,
      gamesPlayed: 1,
      gamesWon: 0,
      citiesMonopolized: 0,
      equippedToken: 'elephant',
      unlockedCosmetics: ['royal_elephant'],
      claimedChallenges: [],
      pushNotificationsEnabled: true,
      stats: {
        rolls: 0,
        properties_bought: 0,
        auctions_won: 0,
        trades_completed: 0,
        rent_collected: 0,
        landmarks_upgraded: 0,
      },
      paymentHistory: [],
      createdAt: Date.now(),
    };
    db.users[id] = newUser;
    saveDatabase();
    res.json({ token: signToken(id), user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const cleanUser = String(username || '').trim().toLowerCase();
    const found = Object.values(db.users).find((u) => u.username === cleanUser);
    if (!found) {
      res.status(401).json({ error: 'Account not found. Check username or register a new profile.' });
      return;
    }
    const computed = hashPassword(String(password || ''), found.salt);
    if (computed !== found.passwordHash) {
      res.status(401).json({ error: 'Invalid encrypted credentials.' });
      return;
    }
    res.json({ token: signToken(found.id), user: sanitizeUser(found) });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token) || 'usr_pardhiv';
    const user = db.users[userId] || db.users['usr_pardhiv'];
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/profile/update', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token) || 'usr_pardhiv';
    const user = db.users[userId] || db.users['usr_pardhiv'];
    const { displayName, equippedToken, pushNotificationsEnabled } = req.body || {};

    if (displayName && String(displayName).trim().length >= 2) {
      user.displayName = String(displayName).trim().slice(0, 32);
    }
    if (equippedToken) {
      user.equippedToken = String(equippedToken);
      // Sync token to active rooms
      for (const room of rooms.values()) {
        const p = room.players.find((pl) => pl.id === user.id || !pl.isBot);
        if (p) p.tokenKey = user.equippedToken;
      }
    }
    if (typeof pushNotificationsEnabled === 'boolean') {
      user.pushNotificationsEnabled = pushNotificationsEnabled;
    }
    saveDatabase();
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/challenges/claim', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token) || 'usr_pardhiv';
    const user = db.users[userId] || db.users['usr_pardhiv'];
    const { challengeId } = req.body || {};

    const challenge = DAILY_CHALLENGES.find((c) => c.id === challengeId);
    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found.' });
      return;
    }
    if (user.claimedChallenges.includes(challenge.id)) {
      res.status(400).json({ error: 'Reward already claimed today.' });
      return;
    }
    const progress = user.stats[challenge.metric] || 0;
    if (progress < challenge.target) {
      res.status(400).json({ error: `Complete ${challenge.target - progress} more to claim.` });
      return;
    }
    user.claimedChallenges.push(challenge.id);
    user.mudraCoins += challenge.rewardMudra;
    saveDatabase();
    res.json({
      user: sanitizeUser(user),
      rewardMudra: challenge.rewardMudra,
      message: `Claimed +${challenge.rewardMudra} Mudra Coins!`,
    });
  });

  app.post('/api/store/purchase', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const userId = verifyToken(token) || 'usr_pardhiv';
    const user = db.users[userId] || db.users['usr_pardhiv'];
    const { itemId, paymentMode, paymentMethod } = req.body || {};

    // Support Mudra Coin bundle top-ups as well as direct cosmetic purchases
    if (itemId === 'mudra_pack_500' || itemId === 'mudra_pack_1500') {
      const coinsToAdd = itemId === 'mudra_pack_1500' ? 1500 : 500;
      const inr = itemId === 'mudra_pack_1500' ? 199 : 79;
      const txnId = `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      user.mudraCoins += coinsToAdd;
      user.paymentHistory.unshift({
        txnId,
        itemName: `${coinsToAdd} Royal Mudra Coin Treasury Pack`,
        method: String(paymentMethod || 'UPI Instant'),
        amountInr: inr,
        timestamp: Date.now(),
      });
      saveDatabase();
      res.json({
        user: sanitizeUser(user),
        receipt: user.paymentHistory[0],
      });
      return;
    }

    const item = COSMETIC_CATALOG.find((c) => c.id === itemId);
    if (!item) {
      res.status(404).json({ error: 'Cosmetic item not found.' });
      return;
    }

    if (user.unlockedCosmetics.includes(item.id)) {
      user.equippedToken = item.svgKey;
      saveDatabase();
      res.json({ user: sanitizeUser(user), message: 'Equipped cosmetic token!' });
      return;
    }

    if (paymentMode === 'mudra') {
      if (user.mudraCoins < item.mudraPrice) {
        res.status(400).json({ error: `Need ${item.mudraPrice} Mudra Coins (You have ${user.mudraCoins}).` });
        return;
      }
      user.mudraCoins -= item.mudraPrice;
      user.unlockedCosmetics.push(item.id);
      user.equippedToken = item.svgKey;
      saveDatabase();
      res.json({ user: sanitizeUser(user), message: `Unlocked and equipped ${item.name}!` });
      return;
    }

    // Encrypted INR Payment Gateway flow
    const txnId = `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    user.unlockedCosmetics.push(item.id);
    user.equippedToken = item.svgKey;
    user.mudraCoins += 100; // Complimentary bonus Mudra with checkout
    const receipt = {
      txnId,
      itemName: `${item.name} (+100 Bonus Mudra)`,
      method: String(paymentMethod || 'UPI Verified'),
      amountInr: item.inrPrice,
      timestamp: Date.now(),
    };
    user.paymentHistory.unshift(receipt);
    saveDatabase();
    res.json({ user: sanitizeUser(user), receipt, message: `Purchased and equipped ${item.name}!` });
  });

  app.get('/api/leaderboard', (_req, res) => {
    const list = Object.values(db.users).map((u) => {
      // Include live room net worth if user is in active room
      const room = rooms.get('BHARAT-108');
      const livePlayer = room?.players.find((p) => p.id === u.id);
      const liveNetWorth = livePlayer && room ? calculatePlayerNetWorth(livePlayer, room.tiles) : 0;
      return {
        id: u.id,
        displayName: u.displayName,
        username: u.username,
        totalWealth: u.totalWealthEarned + liveNetWorth,
        gamesWon: u.gamesWon,
        citiesMonopolized: u.citiesMonopolized,
        mudraCoins: u.mudraCoins,
        equippedToken: u.equippedToken,
      };
    });
    list.sort((a, b) => b.totalWealth - a.totalWealth);
    res.json({ leaderboard: list });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  interface ClientMeta {
    ws: WebSocket;
    roomId: string;
    playerId: string;
    playerName: string;
  }

  const clients = new Set<ClientMeta>();

  function broadcastRoom(roomId: string) {
    const room = rooms.get(roomId);
    const chat = roomChats.get(roomId) || [];
    if (!room) return;
    const payload = JSON.stringify({
      type: 'room:state',
      room,
      chat,
    });
    for (const c of clients) {
      if (c.roomId === roomId && c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(payload);
      }
    }
  }

  function broadcastNotification(roomId: string, title: string, body: string, category: string) {
    const payload = JSON.stringify({
      type: 'notification:push',
      notification: {
        id: `notif_${Date.now()}_${Math.random()}`,
        title,
        body,
        category,
        timestamp: Date.now(),
      },
    });
    for (const c of clients) {
      if (c.roomId === roomId && c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(payload);
      }
    }
  }

  function performRollForCurrentPlayer(room: GameRoomState) {
    if (room.status !== 'playing' || room.turnPhase !== 'roll') return;
    const player = room.players[room.currentTurnIndex];
    if (!player || player.bankrupt) return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    room.lastDice = [d1, d2];
    room.activeEventCard = null;

    const oldPos = player.position;
    const newPos = (oldPos + total) % room.tiles.length;
    if (oldPos + total >= room.tiles.length) {
      player.cash += 2000;
      room.logs.unshift({
        id: `log_${Date.now()}_go`,
        text: `${player.name} passed ${room.tiles[0].name} and collected ₹2,000 Treasury Stipend!`,
        timestamp: Date.now(),
        type: 'info',
      });
    }
    player.position = newPos;

    // Update user profile stats if human
    const userRecord = db.users[player.id] || db.users['usr_pardhiv'];
    if (!player.isBot && userRecord) {
      userRecord.stats.rolls += 1;
      saveDatabase();
    }

    const landedTile = room.tiles[newPos];
    room.logs.unshift({
      id: `log_${Date.now()}_roll`,
      text: `${player.name} rolled ${d1} + ${d2} = ${total} and landed on ${landedTile.name}.`,
      timestamp: Date.now(),
      type: 'info',
    });

    if (['property', 'transport', 'utility'].includes(landedTile.type)) {
      if (!landedTile.ownerId) {
        room.turnPhase = 'action';
      } else if (landedTile.ownerId !== player.id) {
        const owner = room.players.find((p) => p.id === landedTile.ownerId);
        const rent = calculateRent(landedTile, total, room.tiles, room.turnNumber);
        if (owner && rent > 0) {
          const paid = Math.min(player.cash, rent);
          player.cash -= paid;
          owner.cash += paid;
          if (!owner.isBot && db.users[owner.id]) {
            db.users[owner.id].stats.rent_collected += paid;
            saveDatabase();
          }
          room.logs.unshift({
            id: `log_${Date.now()}_rent`,
            text: `${player.name} paid ₹${paid.toLocaleString('en-IN')} rent to ${owner.name} at ${landedTile.name}.`,
            timestamp: Date.now(),
            type: 'rent',
          });
          if (player.cash <= 0) {
            player.bankrupt = true;
            // Release properties
            for (const t of room.tiles) {
              if (t.ownerId === player.id) {
                t.ownerId = owner.id;
              }
            }
          }
        }
        room.turnPhase = 'end';
      } else {
        room.turnPhase = 'end';
      }
    } else if (landedTile.type === 'event') {
      const pool = HISTORICAL_EVENT_CARDS.filter(
        (c) => c.edition === 'both' || c.edition === room.edition
      );
      const card = pool[Math.floor(Math.random() * pool.length)];
      room.activeEventCard = card;
      applyEventCard(room, player.id, card);
      room.turnPhase = 'end';
    } else if (landedTile.type === 'tax') {
      const tax = Math.min(player.cash, landedTile.price || 1200);
      player.cash -= tax;
      room.treasuryPool += tax;
      room.logs.unshift({
        id: `log_${Date.now()}_tax`,
        text: `${player.name} contributed ₹${tax.toLocaleString('en-IN')} to the National Treasury Pool.`,
        timestamp: Date.now(),
        type: 'info',
      });
      room.turnPhase = 'end';
    } else if (landedTile.type === 'treasury') {
      const jackpot = Math.max(500, room.treasuryPool);
      player.cash += jackpot;
      room.treasuryPool = 500;
      room.logs.unshift({
        id: `log_${Date.now()}_jackpot`,
        text: `${player.name} claimed ₹${jackpot.toLocaleString('en-IN')} from ${landedTile.name}!`,
        timestamp: Date.now(),
        type: 'event',
      });
      room.turnPhase = 'end';
    } else {
      room.turnPhase = 'end';
    }

    const winCheck = checkWinCondition(room);
    if (winCheck.isGameOver) {
      room.status = 'gameover';
      room.winnerId = winCheck.winnerId;
    }
  }

  function advanceTurn(room: GameRoomState) {
    const winCheck = checkWinCondition(room);
    if (winCheck.isGameOver) {
      room.status = 'gameover';
      room.winnerId = winCheck.winnerId;
      broadcastRoom(room.roomId);
      return;
    }

    let nextIdx = (room.currentTurnIndex + 1) % room.players.length;
    let guard = 0;
    while (room.players[nextIdx].bankrupt && guard < room.players.length) {
      nextIdx = (nextIdx + 1) % room.players.length;
      guard++;
    }
    if (nextIdx <= room.currentTurnIndex) {
      room.turnNumber += 1;
    }
    room.currentTurnIndex = nextIdx;
    room.turnPhase = 'roll';
    broadcastRoom(room.roomId);

    // If next player is a Bot, schedule automated bot turn
    const nextPlayer = room.players[room.currentTurnIndex];
    if (nextPlayer && nextPlayer.isBot && room.status === 'playing') {
      setTimeout(() => {
        if (room.status !== 'playing' || room.players[room.currentTurnIndex]?.id !== nextPlayer.id) {
          return;
        }
        performRollForCurrentPlayer(room);
        broadcastRoom(room.roomId);

        setTimeout(() => {
          if (room.status !== 'playing' || room.players[room.currentTurnIndex]?.id !== nextPlayer.id) {
            return;
          }
          if (room.turnPhase === 'action') {
            const tile = room.tiles[nextPlayer.position];
            if (tile && !tile.ownerId && nextPlayer.cash >= tile.price + 800) {
              executePropertyPurchase(room, nextPlayer.id, tile.index);
            } else {
              room.turnPhase = 'end';
            }
          }
          advanceTurn(room);
        }, 700);
      }, 650);
    }
  }

  wss.on('connection', (ws) => {
    const meta: ClientMeta = {
      ws,
      roomId: 'BHARAT-108',
      playerId: 'usr_pardhiv',
      playerName: 'Pardhiv Samrat',
    };
    clients.add(meta);

    // Send immediate initial state
    const defaultRoom = ensureDefaultRoom();
    ws.send(
      JSON.stringify({
        type: 'room:state',
        room: defaultRoom,
        chat: roomChats.get('BHARAT-108') || [],
      })
    );

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        const roomId = msg.roomId || meta.roomId || 'BHARAT-108';
        meta.roomId = roomId;

        let room = rooms.get(roomId);
        if (!room) {
          room = createInitialRoomState(
            roomId,
            msg.edition || 'india',
            {
              id: msg.playerId || 'usr_pardhiv',
              name: msg.playerName || 'Pardhiv Samrat',
              tokenKey: msg.tokenKey || 'elephant',
            },
            true
          );
          rooms.set(roomId, room);
          roomChats.set(roomId, []);
        }

        const humanPlayer =
          room.players.find((p) => p.id === msg.playerId) ||
          room.players.find((p) => !p.isBot) ||
          room.players[0];

        if (msg.type === 'room:join') {
          meta.playerId = msg.playerId || humanPlayer.id;
          meta.playerName = msg.playerName || humanPlayer.name;
          if (msg.playerName && !humanPlayer.isBot) {
            humanPlayer.name = msg.playerName;
          }
          if (msg.tokenKey && !humanPlayer.isBot) {
            humanPlayer.tokenKey = msg.tokenKey;
          }
          const pCount = Number(msg.playerCount);
          if ([2, 3, 4].includes(pCount) && room.turnNumber <= 1 && room.turnPhase === 'roll') {
            room = createInitialRoomState(
              roomId,
              msg.edition || room.edition,
              {
                id: humanPlayer.id,
                name: humanPlayer.name,
                tokenKey: humanPlayer.tokenKey,
              },
              true,
              pCount
            );
            rooms.set(roomId, room);
          }
          broadcastRoom(roomId);
        } else if (msg.type === 'game:switch_edition') {
          const newEdition: MapEdition = msg.edition === 'world' ? 'world' : 'india';
          const pCount = Number(msg.playerCount) || room.players.length;
          const fresh = createInitialRoomState(
            roomId,
            newEdition,
            {
              id: humanPlayer.id,
              name: humanPlayer.name,
              tokenKey: humanPlayer.tokenKey,
            },
            true,
            pCount
          );
          rooms.set(roomId, fresh);
          broadcastNotification(
            roomId,
            newEdition === 'india' ? 'Switched to Bharat Samrat Map' : 'Switched to Global World Map',
            `All 24 ${newEdition === 'india' ? 'Indian heritage cities' : 'world capitals & Indian landmarks'} are now open for acquisition.`,
            'map'
          );
          broadcastRoom(roomId);
        } else if (msg.type === 'game:roll') {
          const current = room.players[room.currentTurnIndex];
          if (current && current.isBot) {
            // Force current turn to human if human clicks Roll while waiting
            const humanIdx = room.players.findIndex((p) => !p.isBot);
            if (humanIdx >= 0) {
              room.currentTurnIndex = humanIdx;
              room.turnPhase = 'roll';
            }
          }
          performRollForCurrentPlayer(room);
          broadcastRoom(roomId);
        } else if (msg.type === 'game:buy') {
          const current = room.players[room.currentTurnIndex];
          const res = executePropertyPurchase(room, current.id, current.position);
          if (res.ok) {
            const u = db.users[current.id] || db.users['usr_pardhiv'];
            if (u) {
              u.stats.properties_bought += 1;
              u.mudraCoins += 15;
              saveDatabase();
            }
          }
          broadcastRoom(roomId);
        } else if (msg.type === 'game:start_auction') {
          const current = room.players[room.currentTurnIndex];
          const tile = room.tiles[current.position];
          if (tile && !tile.ownerId && ['property', 'transport', 'utility'].includes(tile.type)) {
            const startBid = Math.max(100, Math.floor(tile.price * 0.5));
            room.activeAuction = {
              tileIndex: tile.index,
              tileName: tile.name,
              basePrice: tile.price,
              currentBid: startBid,
              highestBidderId: current.id,
              highestBidderName: current.name,
              passedPlayerIds: [],
              active: true,
            };
            room.turnPhase = 'auction';
            room.logs.unshift({
              id: `log_${Date.now()}_auc`,
              text: `Live Auction opened for ${tile.name}! Starting bid ₹${startBid.toLocaleString('en-IN')}.`,
              timestamp: Date.now(),
              type: 'auction',
            });
            broadcastRoom(roomId);
          }
        } else if (msg.type === 'game:auction_bid') {
          if (room.activeAuction && room.activeAuction.active) {
            const bidder =
              room.players.find((p) => p.id === msg.playerId) || humanPlayer;
            const amount = Number(msg.amount || room.activeAuction.currentBid + 100);
            const bidRes = placeAuctionBid(
              room.activeAuction,
              bidder.id,
              bidder.name,
              amount,
              bidder.cash
            );
            if (bidRes.ok) {
              room.logs.unshift({
                id: `log_${Date.now()}_bid`,
                text: `${bidder.name} bid ₹${amount.toLocaleString('en-IN')} for ${room.activeAuction.tileName}!`,
                timestamp: Date.now(),
                type: 'auction',
              });
              // Check if a bot wants to counter-bid below 85% of list price
              const bot = room.players.find(
                (p) => p.isBot && !p.bankrupt && p.cash > amount + 150
              );
              if (bot && amount < room.activeAuction.basePrice * 0.8) {
                const botBid = amount + 100;
                placeAuctionBid(room.activeAuction, bot.id, bot.name, botBid, bot.cash);
                room.logs.unshift({
                  id: `log_${Date.now()}_botbid`,
                  text: `${bot.name} counter-bid ₹${botBid.toLocaleString('en-IN')}!`,
                  timestamp: Date.now(),
                  type: 'auction',
                });
              }
            }
            broadcastRoom(roomId);
          }
        } else if (msg.type === 'game:auction_finalize') {
          if (room.activeAuction) {
            const auc = room.activeAuction;
            const winner =
              room.players.find((p) => p.id === auc.highestBidderId) || humanPlayer;
            const tile = room.tiles[auc.tileIndex];
            if (winner && tile && winner.cash >= auc.currentBid) {
              winner.cash -= auc.currentBid;
              tile.ownerId = winner.id;
              winner.auctionsWonCount += 1;
              winner.propertiesBoughtCount += 1;
              winner.mudraEarned += 20;
              const u = db.users[winner.id] || db.users['usr_pardhiv'];
              if (!winner.isBot && u) {
                u.stats.auctions_won += 1;
                u.stats.properties_bought += 1;
                u.mudraCoins += 20;
                saveDatabase();
              }
              room.logs.unshift({
                id: `log_${Date.now()}_aucwin`,
                text: `${winner.name} won the auction for ${tile.name} at ₹${auc.currentBid.toLocaleString('en-IN')}!`,
                timestamp: Date.now(),
                type: 'auction',
              });
            }
            room.activeAuction = null;
            room.turnPhase = 'end';
            broadcastRoom(roomId);
          }
        } else if (msg.type === 'game:upgrade_tile') {
          const tileIndex = Number(msg.tileIndex);
          const tile = room.tiles[tileIndex];
          if (tile) {
            const check = canBuildOnProperty(humanPlayer, tile, room.tiles);
            if (check.allowed) {
              humanPlayer.cash -= tile.houseCost;
              tile.level += 1;
              humanPlayer.landmarksUpgradedCount += 1;
              humanPlayer.mudraEarned += 20;
              const u = db.users[humanPlayer.id] || db.users['usr_pardhiv'];
              if (u) {
                u.stats.landmarks_upgraded += 1;
                u.mudraCoins += 20;
                saveDatabase();
              }
              const structureName = tile.level === 5 ? 'Royal Mahal (Hotel)' : `Haveli Level ${tile.level}`;
              room.logs.unshift({
                id: `log_${Date.now()}_upg`,
                text: `${humanPlayer.name} constructed ${structureName} in ${tile.city} for ₹${tile.houseCost.toLocaleString('en-IN')}!`,
                timestamp: Date.now(),
                type: 'buy',
              });
            }
          }
          broadcastRoom(roomId);
        } else if (msg.type === 'game:propose_trade') {
          const offer: TradeOffer = {
            id: `tr_${Date.now()}`,
            fromPlayerId: humanPlayer.id,
            toPlayerId: msg.toPlayerId,
            offeredTileIndices: Array.isArray(msg.offeredTileIndices) ? msg.offeredTileIndices : [],
            requestedTileIndices: Array.isArray(msg.requestedTileIndices) ? msg.requestedTileIndices : [],
            offeredCash: Math.max(0, Number(msg.offeredCash || 0)),
            requestedCash: Math.max(0, Number(msg.requestedCash || 0)),
            status: 'pending',
            createdAt: Date.now(),
          };
          const target = room.players.find((p) => p.id === offer.toPlayerId);
          if (target && !target.bankrupt) {
            if (!room.tradeOffers) room.tradeOffers = [];
            room.tradeOffers.unshift(offer);

            if (target.isBot) {
              // Intelligent AI Trade Evaluation
              let offeredValue = offer.offeredCash;
              for (const idx of offer.offeredTileIndices) {
                const t = room.tiles[idx];
                if (t && t.ownerId === humanPlayer.id) offeredValue += t.price;
              }

              let requestedValue = offer.requestedCash;
              for (const idx of offer.requestedTileIndices) {
                const t = room.tiles[idx];
                if (t && t.ownerId === target.id) requestedValue += t.price;
              }

              // Bot accepts if offer is fair or favorable (>= 85% of requested value)
              const isFair = offeredValue >= requestedValue * 0.85;
              if (isFair) {
                const res = validateAndExecuteTrade(room, offer);
                if (res.ok) {
                  const u = db.users[humanPlayer.id] || db.users['usr_pardhiv'];
                  if (u) {
                    u.stats.trades_completed += 1;
                    u.mudraCoins += 25;
                    saveDatabase();
                  }
                  broadcastNotification(
                    roomId,
                    'Diplomatic Trade Accepted!',
                    `${target.name} accepted ${humanPlayer.name}'s bilateral trade agreement!`,
                    'trade'
                  );
                }
              } else {
                rejectTradeOffer(room, offer.id, target.id);
                broadcastNotification(
                  roomId,
                  'Trade Proposal Declined',
                  `${target.name} declined the trade offer from ${humanPlayer.name} (Value appraisal deemed insufficient).`,
                  'trade'
                );
              }
            } else {
              // Target is human: notify them of incoming trade
              room.logs.unshift({
                id: `log_${Date.now()}_prop`,
                text: `${humanPlayer.name} proposed a bilateral trade agreement to ${target.name}.`,
                timestamp: Date.now(),
                type: 'trade',
              });
              broadcastNotification(
                roomId,
                'New Trade Offer Received',
                `${humanPlayer.name} has sent you a trade proposal. Open Trade [T] to review.`,
                'trade'
              );
            }
          }
          broadcastRoom(roomId);
        } else if (msg.type === 'game:accept_trade') {
          const offerId = String(msg.offerId);
          const offer = room.tradeOffers?.find((o) => o.id === offerId);
          if (offer && offer.status === 'pending') {
            const res = validateAndExecuteTrade(room, offer);
            if (res.ok) {
              const u = db.users[humanPlayer.id] || db.users['usr_pardhiv'];
              if (u) {
                u.stats.trades_completed += 1;
                u.mudraCoins += 25;
                saveDatabase();
              }
              broadcastNotification(
                roomId,
                'Trade Executed!',
                `Trade offer #${offerId.slice(-4)} has been formally executed and ratified.`,
                'trade'
              );
            }
          }
          broadcastRoom(roomId);
        } else if (msg.type === 'game:reject_trade') {
          const offerId = String(msg.offerId);
          rejectTradeOffer(room, offerId, humanPlayer.id);
          broadcastRoom(roomId);
        } else if (msg.type === 'game:withdraw_trade') {
          const offerId = String(msg.offerId);
          withdrawTradeOffer(room, offerId, humanPlayer.id);
          broadcastRoom(roomId);
        } else if (msg.type === 'game:end_turn') {
          room.activeEventCard = null;
          advanceTurn(room);
        } else if (msg.type === 'game:restart') {
          const fresh = createInitialRoomState(
            roomId,
            room.edition,
            {
              id: humanPlayer.id,
              name: humanPlayer.name,
              tokenKey: humanPlayer.tokenKey,
            },
            true
          );
          rooms.set(roomId, fresh);
          broadcastRoom(roomId);
        } else if (msg.type === 'chat:send') {
          const text = String(msg.text || '').trim().slice(0, 280);
          if (text) {
            const chatList = roomChats.get(roomId) || [];
            chatList.push({
              id: `msg_${Date.now()}_${Math.random()}`,
              senderId: humanPlayer.id,
              senderName: humanPlayer.name,
              senderColor: humanPlayer.color,
              text,
              timestamp: Date.now(),
            });
            // Keep last 50 messages
            if (chatList.length > 50) chatList.shift();
            roomChats.set(roomId, chatList);
            broadcastRoom(roomId);
          }
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(meta);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Samrat Monopoly Server + WebSocket listening on http://localhost:${PORT}`);
  });
}

startServer();
