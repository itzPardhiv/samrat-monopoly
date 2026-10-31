import {
  BoardTile,
  HistoricalEventCard,
  MapEdition,
  createInitialBoard,
} from './boardData';

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  color: string;
  tokenKey: string;
  cash: number;
  position: number;
  inJailTurns: number;
  bankrupt: boolean;
  mudraEarned: number;
  propertiesBoughtCount: number;
  auctionsWonCount: number;
  tradesCompletedCount: number;
  landmarksUpgradedCount: number;
}

export interface AuctionState {
  tileIndex: number;
  tileName: string;
  basePrice: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  passedPlayerIds: string[];
  active: boolean;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredTileIndices: number[];
  requestedTileIndices: number[];
  offeredCash: number;
  requestedCash: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface GameRoomState {
  roomId: string;
  edition: MapEdition;
  status: 'waiting' | 'playing' | 'paused' | 'gameover';
  players: PlayerState[];
  currentTurnIndex: number;
  turnPhase: 'roll' | 'action' | 'auction' | 'end';
  lastDice: [number, number];
  tiles: BoardTile[];
  treasuryPool: number;
  activeAuction: AuctionState | null;
  activeEventCard: HistoricalEventCard | null;
  tradeOffers: TradeOffer[];
  turnNumber: number;
  winnerId: string | null;
  logs: { id: string; text: string; timestamp: number; type: 'info' | 'rent' | 'buy' | 'event' | 'trade' | 'auction' }[];
}

export function ownsFullGroup(ownerId: string, group: string, allTiles: BoardTile[]): boolean {
  const groupTiles = allTiles.filter((t) => t.type === 'property' && t.group === group);
  if (groupTiles.length === 0) return false;
  return groupTiles.every((t) => t.ownerId === ownerId);
}

export interface TileDensityMetrics {
  ownershipRatio: number; // 0..1 share of group owned by this tile's owner
  valueTier: 'standard' | 'prime' | 'sovereign'; // based on price/rent potential
  intensityAlpha: number; // 0.08..0.42 subtle overlay alpha
  isMonopoly: boolean;
}

export function calculateTileOwnershipDensity(
  tile: BoardTile,
  allTiles: BoardTile[]
): TileDensityMetrics {
  const valueTier: 'standard' | 'prime' | 'sovereign' =
    tile.price >= 3000 ? 'sovereign' : tile.price >= 2000 ? 'prime' : 'standard';

  if (!tile.ownerId) {
    const baseValueAlpha =
      valueTier === 'sovereign' ? 0.18 : valueTier === 'prime' ? 0.11 : 0.04;
    return {
      ownershipRatio: 0,
      valueTier,
      intensityAlpha: baseValueAlpha,
      isMonopoly: false,
    };
  }

  const groupTiles = allTiles.filter((t) => t.group === tile.group && t.price > 0);
  const sameOwnerCount = groupTiles.filter((t) => t.ownerId === tile.ownerId).length;
  const ownershipRatio =
    groupTiles.length > 0 ? sameOwnerCount / groupTiles.length : 1;
  const isMonopoly = groupTiles.length > 1 && sameOwnerCount === groupTiles.length;
  const buildingBoost = (tile.level || 0) * 0.04;
  const intensityAlpha = Math.min(
    0.42,
    0.14 + ownershipRatio * 0.18 + buildingBoost + (valueTier === 'sovereign' ? 0.05 : 0)
  );

  return {
    ownershipRatio,
    valueTier,
    intensityAlpha,
    isMonopoly,
  };
}

export function calculateRent(
  tile: BoardTile,
  diceTotal: number,
  allTiles: BoardTile[],
  turnNumber: number = 1
): number {
  if (!tile.ownerId || tile.isMortgaged) return 0;
  let rent = 0;

  if (tile.type === 'property') {
    if (tile.level > 0) {
      const idx = Math.min(tile.level - 1, 4);
      rent = tile.rents[idx];
    } else {
      const hasMonopoly = ownsFullGroup(tile.ownerId, tile.group, allTiles);
      rent = hasMonopoly ? tile.baseRent * 2 : tile.baseRent;
    }

    // Special European cultural synergy perk for Rome
    if (tile.id === 'wd_rome' && tile.ownerId) {
      const ownsParisOrLondon = allTiles.some(
        (t) => (t.id === 'wd_paris' || t.id === 'wd_london') && t.ownerId === tile.ownerId
      );
      if (ownsParisOrLondon) {
        rent = Math.round(rent * 1.2);
      }
    }
  } else if (tile.type === 'transport') {
    const ownedTransports = allTiles.filter(
      (t) => t.type === 'transport' && t.ownerId === tile.ownerId
    ).length;
    rent = tile.baseRent * Math.max(1, Math.pow(2, ownedTransports - 1));
  } else if (tile.type === 'utility') {
    const ownedUtilities = allTiles.filter(
      (t) => t.type === 'utility' && t.ownerId === tile.ownerId
    ).length;
    const multiplier = ownedUtilities >= 2 ? 100 : 40;
    rent = Math.max(tile.baseRent, diceTotal * multiplier);

    // Bhadla Mega Solar Grid doubles payout if owner also owns ISRO
    if (tile.id === 'in_util_grid' && tile.ownerId) {
      const ownsIsro = allTiles.some((t) => t.id === 'in_util_isro' && t.ownerId === tile.ownerId);
      if (ownsIsro) {
        rent *= 2;
      }
    }
  }

  // Market climate cycle multiplier (Bull: +20%, Recession: -15%, Stable: 1.0)
  if (turnNumber > 1) {
    const cycleIndex = Math.floor((turnNumber - 1) / 4) % 3;
    const climateMultiplier = cycleIndex === 1 ? 1.2 : cycleIndex === 2 ? 0.85 : 1.0;
    rent = Math.round(rent * climateMultiplier);
  }

  return rent;
}

export function calculatePlayerNetWorth(player: PlayerState, tiles: BoardTile[]): number {
  if (player.bankrupt) return 0;
  let propertyValue = 0;
  for (const tile of tiles) {
    if (tile.ownerId === player.id) {
      propertyValue += tile.price + tile.level * tile.houseCost;
    }
  }
  return player.cash + propertyValue;
}

export function canBuildOnProperty(
  player: PlayerState,
  tile: BoardTile,
  allTiles: BoardTile[]
): { allowed: boolean; reason?: string } {
  if (tile.type !== 'property') {
    return { allowed: false, reason: 'Only city deeds can build Havelis or Royal Mahals.' };
  }
  if (tile.ownerId !== player.id) {
    return { allowed: false, reason: 'You do not own this city deed.' };
  }
  if (tile.isMortgaged) {
    return { allowed: false, reason: 'Mortgaged properties cannot be developed.' };
  }
  if (tile.level >= 5) {
    return { allowed: false, reason: 'Maximum Royal Mahal level already reached.' };
  }
  if (player.cash < tile.houseCost) {
    return { allowed: false, reason: `Insufficient treasury (Need ₹${tile.houseCost}).` };
  }
  void allTiles;
  return { allowed: true };
}

export function executePropertyPurchase(
  state: GameRoomState,
  playerId: string,
  tileIndex: number
): { ok: boolean; error?: string } {
  const player = state.players.find((p) => p.id === playerId);
  const tile = state.tiles[tileIndex];
  if (!player || !tile) return { ok: false, error: 'Invalid player or tile.' };
  if (!['property', 'transport', 'utility'].includes(tile.type)) {
    return { ok: false, error: 'This space cannot be purchased.' };
  }
  if (tile.ownerId !== null) {
    return { ok: false, error: 'Deed is already owned.' };
  }
  if (player.cash < tile.price) {
    return { ok: false, error: 'Insufficient ₹ balance to buy deed.' };
  }

  player.cash -= tile.price;
  tile.ownerId = player.id;
  player.propertiesBoughtCount += 1;
  player.mudraEarned += 15;
  state.turnPhase = 'end';
  state.logs.unshift({
    id: `log_${Date.now()}_${Math.random()}`,
    text: `${player.name} purchased ${tile.name} for ₹${tile.price.toLocaleString('en-IN')}.`,
    timestamp: Date.now(),
    type: 'buy',
  });
  return { ok: true };
}

export function placeAuctionBid(
  auction: AuctionState,
  playerId: string,
  playerName: string,
  bidAmount: number,
  playerCash: number
): { ok: boolean; error?: string } {
  if (!auction.active) return { ok: false, error: 'Auction is no longer active.' };
  if (bidAmount <= auction.currentBid) {
    return { ok: false, error: `Bid must exceed ₹${auction.currentBid}.` };
  }
  if (bidAmount > playerCash) {
    return { ok: false, error: 'Cannot bid more than your available cash.' };
  }
  auction.currentBid = bidAmount;
  auction.highestBidderId = playerId;
  auction.highestBidderName = playerName;
  auction.passedPlayerIds = auction.passedPlayerIds.filter((id) => id !== playerId);
  return { ok: true };
}

export function validateAndExecuteTrade(
  state: GameRoomState,
  offer: TradeOffer
): { ok: boolean; error?: string } {
  if (offer.status !== 'pending') {
    return { ok: false, error: 'This trade offer is no longer pending.' };
  }
  const sender = state.players.find((p) => p.id === offer.fromPlayerId);
  const receiver = state.players.find((p) => p.id === offer.toPlayerId);
  if (!sender || !receiver) return { ok: false, error: 'Players not found.' };
  if (sender.bankrupt || receiver.bankrupt) {
    return { ok: false, error: 'Cannot trade with an insolvent player.' };
  }
  if (offer.offeredCash < 0 || offer.requestedCash < 0) {
    return { ok: false, error: 'Cash amounts cannot be negative.' };
  }
  if (sender.cash < offer.offeredCash) {
    return { ok: false, error: `${sender.name} does not have ₹${offer.offeredCash}.` };
  }
  if (receiver.cash < offer.requestedCash) {
    return { ok: false, error: `${receiver.name} does not have ₹${offer.requestedCash}.` };
  }

  for (const idx of offer.offeredTileIndices) {
    const t = state.tiles[idx];
    if (!t || t.ownerId !== sender.id) {
      return { ok: false, error: `${sender.name} no longer owns ${t?.name ?? 'tile'}.` };
    }
  }
  for (const idx of offer.requestedTileIndices) {
    const t = state.tiles[idx];
    if (!t || t.ownerId !== receiver.id) {
      return { ok: false, error: `${receiver.name} no longer owns ${t?.name ?? 'tile'}.` };
    }
  }

  // Execute atomic transfer
  sender.cash = sender.cash - offer.offeredCash + offer.requestedCash;
  receiver.cash = receiver.cash - offer.requestedCash + offer.offeredCash;

  for (const idx of offer.offeredTileIndices) {
    state.tiles[idx].ownerId = receiver.id;
  }
  for (const idx of offer.requestedTileIndices) {
    state.tiles[idx].ownerId = sender.id;
  }

  offer.status = 'accepted';
  // Keep state.tradeOffers in sync if present
  const existingOffer = state.tradeOffers?.find((o) => o.id === offer.id);
  if (existingOffer) {
    existingOffer.status = 'accepted';
  }
  sender.tradesCompletedCount += 1;
  receiver.tradesCompletedCount += 1;
  sender.mudraEarned += 25;
  receiver.mudraEarned += 25;

  state.logs.unshift({
    id: `log_${Date.now()}_${Math.random()}`,
    text: `Diplomatic trade sealed between ${sender.name} and ${receiver.name}!`,
    timestamp: Date.now(),
    type: 'trade',
  });
  return { ok: true };
}

export function rejectTradeOffer(
  state: GameRoomState,
  offerId: string,
  rejectingPlayerId: string
): { ok: boolean; error?: string } {
  const offer = state.tradeOffers?.find((o) => o.id === offerId);
  if (!offer) return { ok: false, error: 'Trade offer not found.' };
  if (offer.status !== 'pending') return { ok: false, error: 'Offer is not pending.' };

  const rejecter = state.players.find((p) => p.id === rejectingPlayerId);
  offer.status = 'rejected';

  state.logs.unshift({
    id: `log_${Date.now()}_rej`,
    text: `${rejecter?.name || 'Counterparty'} declined the trade proposal.`,
    timestamp: Date.now(),
    type: 'trade',
  });
  return { ok: true };
}

export function withdrawTradeOffer(
  state: GameRoomState,
  offerId: string,
  withdrawingPlayerId: string
): { ok: boolean; error?: string } {
  const offer = state.tradeOffers?.find((o) => o.id === offerId);
  if (!offer) return { ok: false, error: 'Trade offer not found.' };
  if (offer.status !== 'pending') return { ok: false, error: 'Offer is not pending.' };
  if (offer.fromPlayerId !== withdrawingPlayerId) {
    return { ok: false, error: 'Only the trade proposer can withdraw this offer.' };
  }

  const proposer = state.players.find((p) => p.id === withdrawingPlayerId);
  offer.status = 'rejected';

  state.logs.unshift({
    id: `log_${Date.now()}_wd`,
    text: `${proposer?.name || 'Proposer'} withdrew their trade proposal.`,
    timestamp: Date.now(),
    type: 'trade',
  });
  return { ok: true };
}

export function applyEventCard(
  state: GameRoomState,
  playerId: string,
  card: HistoricalEventCard
): void {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return;

  if (card.effectType === 'cash_gain' && card.amount) {
    player.cash += card.amount;
  } else if (card.effectType === 'cash_loss' && card.amount) {
    const loss = Math.min(player.cash, card.amount);
    player.cash -= loss;
    state.treasuryPool += loss;
  } else if (card.effectType === 'collect_from_all' && card.amount) {
    for (const other of state.players) {
      if (other.id !== player.id && !other.bankrupt) {
        const transfer = Math.min(other.cash, card.amount);
        other.cash -= transfer;
        player.cash += transfer;
      }
    }
  } else if (card.effectType === 'move_to' && typeof card.targetTileIndex === 'number') {
    if (card.targetTileIndex < player.position) {
      player.cash += 2000; // Passed GO
    }
    player.position = card.targetTileIndex;
  }

  if (card.mudraReward) {
    player.mudraEarned += card.mudraReward;
  }

  state.logs.unshift({
    id: `log_${Date.now()}_${Math.random()}`,
    text: `${player.name} drew "${card.title}" (${card.year}): ${card.description}`,
    timestamp: Date.now(),
    type: 'event',
  });
}

export function checkWinCondition(state: GameRoomState): {
  isGameOver: boolean;
  winnerId: string | null;
} {
  const activePlayers = state.players.filter((p) => !p.bankrupt);
  if (activePlayers.length === 1 && state.players.length > 1) {
    return { isGameOver: true, winnerId: activePlayers[0].id };
  }
  // Also check if someone reached ₹25,000 net worth threshold or turn 40
  if (state.turnNumber >= 40 && activePlayers.length > 0) {
    const sorted = [...activePlayers].sort(
      (a, b) => calculatePlayerNetWorth(b, state.tiles) - calculatePlayerNetWorth(a, state.tiles)
    );
    return { isGameOver: true, winnerId: sorted[0].id };
  }
  return { isGameOver: false, winnerId: null };
}

export function createInitialRoomState(
  roomId: string,
  edition: MapEdition,
  hostPlayer: { id: string; name: string; tokenKey: string; color?: string },
  includeBots = true,
  playerCount = 3
): GameRoomState {
  const chosenHostToken = hostPlayer.tokenKey || 'elephant';
  const players: PlayerState[] = [
    {
      id: hostPlayer.id,
      name: hostPlayer.name,
      isBot: false,
      color: hostPlayer.color || '#F59E0B',
      tokenKey: chosenHostToken,
      cash: 12000,
      position: 0,
      inJailTurns: 0,
      bankrupt: false,
      mudraEarned: 0,
      propertiesBoughtCount: 0,
      auctionsWonCount: 0,
      tradesCompletedCount: 0,
      landmarksUpgradedCount: 0,
    },
  ];

  if (includeBots) {
    const candidateBotTokens = [
      'peacock',
      'train',
      'tiger',
      'horse',
      'chariot',
      'lotus',
      'rocket',
      'ship',
      'crown',
      'wheel',
    ];
    const availableForBots = candidateBotTokens.filter((k) => k !== chosenHostToken);

    const botProfiles = [
      {
        id: 'bot_ahilya',
        name: 'Rani Ahilya (AI)',
        color: '#10B981',
        preferredToken: 'peacock',
      },
      {
        id: 'bot_vikram',
        name: 'Vikramaditya (AI)',
        color: '#38BDF8',
        preferredToken: 'train',
      },
      {
        id: 'bot_ashoka',
        name: 'Samrat Ashoka (AI)',
        color: '#EC4899',
        preferredToken: 'tiger',
      },
    ];

    const botsNeeded = Math.max(1, Math.min(3, playerCount - 1));
    const usedTokens = new Set<string>([chosenHostToken]);

    for (let i = 0; i < botsNeeded; i++) {
      const profile = botProfiles[i];
      let assignedToken = profile.preferredToken;
      if (usedTokens.has(assignedToken)) {
        const fallback = availableForBots.find((t) => !usedTokens.has(t)) || 'wheel';
        assignedToken = fallback;
      }
      usedTokens.add(assignedToken);

      players.push({
        id: profile.id,
        name: profile.name,
        isBot: true,
        color: profile.color,
        tokenKey: assignedToken,
        cash: 12000,
        position: 0,
        inJailTurns: 0,
        bankrupt: false,
        mudraEarned: 0,
        propertiesBoughtCount: 0,
        auctionsWonCount: 0,
        tradesCompletedCount: 0,
        landmarksUpgradedCount: 0,
      });
    }
  }

  return {
    roomId,
    edition,
    status: 'playing',
    players,
    currentTurnIndex: 0,
    turnPhase: 'roll',
    lastDice: [3, 4],
    tiles: createInitialBoard(edition),
    treasuryPool: 1000,
    activeAuction: null,
    activeEventCard: null,
    tradeOffers: [],
    turnNumber: 1,
    winnerId: null,
    logs: [
      {
        id: 'log_init',
        text: `Welcome to Samrat Monopoly (${edition === 'india' ? 'Bharat Samrat Edition' : 'Global Tycoon Edition'})! Each player begins with ₹12,000.`,
        timestamp: Date.now(),
        type: 'info',
      },
    ],
  };
}
