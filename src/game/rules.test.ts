import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRent,
  calculatePlayerNetWorth,
  calculateTileOwnershipDensity,
  canBuildOnProperty,
  executePropertyPurchase,
  placeAuctionBid,
  validateAndExecuteTrade,
  rejectTradeOffer,
  withdrawTradeOffer,
  applyEventCard,
  checkWinCondition,
  createInitialRoomState,
} from './rules';
import { HISTORICAL_EVENT_CARDS } from './boardData';

test('calculateRent doubles base rent when owner holds full city group monopoly', () => {
  const state = createInitialRoomState('room_1', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  // Jaipur (index 1) and Udaipur (index 2) form Rajputana Heritage group
  state.tiles[1].ownerId = 'p1';
  assert.equal(calculateRent(state.tiles[1], 7, state.tiles, 1), 60);

  state.tiles[2].ownerId = 'p1';
  assert.equal(calculateRent(state.tiles[1], 7, state.tiles, 1), 120);
});

test('calculateRent scales correctly with Havelis (L1-L4) and Royal Mahal (L5)', () => {
  const state = createInitialRoomState('room_haveli', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const jaipur = state.tiles[1]; // Jaipur rents: [180, 360, 750, 1100, 1500]
  jaipur.ownerId = 'p1';

  // Level 1: 1 Haveli
  jaipur.level = 1;
  assert.equal(calculateRent(jaipur, 7, state.tiles, 1), 180);

  // Level 2: 2 Havelis
  jaipur.level = 2;
  assert.equal(calculateRent(jaipur, 7, state.tiles, 1), 360);

  // Level 3: 3 Havelis
  jaipur.level = 3;
  assert.equal(calculateRent(jaipur, 7, state.tiles, 1), 750);

  // Level 4: 4 Havelis
  jaipur.level = 4;
  assert.equal(calculateRent(jaipur, 7, state.tiles, 1), 1100);

  // Level 5: Royal Mahal
  jaipur.level = 5;
  assert.equal(calculateRent(jaipur, 7, state.tiles, 1), 1500);
});

test('calculateRent scales transports exponentially based on stations owned', () => {
  const state = createInitialRoomState('room_transports', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  // Find all transport tiles in 24-tile board (CSMT and IGI)
  const transports = state.tiles.filter((t) => t.type === 'transport');
  assert.equal(transports.length, 2);

  // 1 transport owned: baseRent (250)
  transports[0].ownerId = 'p1';
  assert.equal(calculateRent(transports[0], 7, state.tiles, 1), 250);

  // 2 transports owned: 250 * 2^1 = 500
  transports[1].ownerId = 'p1';
  assert.equal(calculateRent(transports[0], 7, state.tiles, 1), 500);
});

test('calculateRent handles utilities and ISRO + Solar Grid synergy perk', () => {
  const state = createInitialRoomState('room_utils', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const solarGrid = state.tiles.find((t) => t.id === 'in_util_grid')!;
  const isro = state.tiles.find((t) => t.id === 'in_util_isro')!;

  // 1 utility owned: 40x dice total (dice=8 => 320)
  solarGrid.ownerId = 'p1';
  assert.equal(calculateRent(solarGrid, 8, state.tiles, 1), 320);

  // 2 utilities owned: 100x dice total, plus ISRO synergy doubles Solar Grid rent (8 * 100 * 2 = 1600)
  isro.ownerId = 'p1';
  assert.equal(calculateRent(solarGrid, 8, state.tiles, 1), 1600);
  // ISRO utility itself gets standard 2 utilities multiplier (8 * 100 = 800)
  assert.equal(calculateRent(isro, 8, state.tiles, 1), 800);
});

test('calculateRent adjusts for macroeconomic climate cycles (Bull +20%, Recession -15%)', () => {
  const state = createInitialRoomState('room_climate', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const jaipur = state.tiles[1];
  jaipur.ownerId = 'p1'; // Base rent 60

  // Turn 1 (Stable): 1.0x -> 60
  assert.equal(calculateRent(jaipur, 7, state.tiles, 1), 60);

  // Turn 5 (Bull cycle index 1): 60 * 1.2 = 72
  assert.equal(calculateRent(jaipur, 7, state.tiles, 5), 72);

  // Turn 9 (Recession cycle index 2): 60 * 0.85 = 51
  assert.equal(calculateRent(jaipur, 7, state.tiles, 9), 51);

  // Turn 13 (Back to Stable cycle index 0): 60 * 1.0 = 60
  assert.equal(calculateRent(jaipur, 7, state.tiles, 13), 60);
});

test('calculateTileOwnershipDensity identifies high-value sovereign areas and scales with monopoly ownership', () => {
  const state = createInitialRoomState('room_density', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  // Unowned Mumbai (₹4000) should be classified as 'sovereign' high-value tier
  const mumbaiUnowned = calculateTileOwnershipDensity(state.tiles[23], state.tiles);
  assert.equal(mumbaiUnowned.valueTier, 'sovereign');
  assert.equal(mumbaiUnowned.ownershipRatio, 0);

  // Partial ownership in Rajputana group (Jaipur owned, Udaipur unowned)
  state.tiles[1].ownerId = 'p1';
  const jaipurPartial = calculateTileOwnershipDensity(state.tiles[1], state.tiles);
  assert.equal(jaipurPartial.ownershipRatio, 0.5);
  assert.equal(jaipurPartial.isMonopoly, false);

  // Full monopoly in Rajputana group (Jaipur + Udaipur owned)
  state.tiles[2].ownerId = 'p1';
  const jaipurFull = calculateTileOwnershipDensity(state.tiles[1], state.tiles);
  assert.equal(jaipurFull.ownershipRatio, 1);
  assert.equal(jaipurFull.isMonopoly, true);
  assert.equal(jaipurFull.intensityAlpha > jaipurPartial.intensityAlpha, true);
});

test('canBuildOnProperty validates ownership, cash, and maximum upgrade cap', () => {
  const state = createInitialRoomState('room_build', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const jaipur = state.tiles[1]; // houseCost: 400

  // Not owned
  const notOwned = canBuildOnProperty(state.players[0], jaipur, state.tiles);
  assert.equal(notOwned.allowed, false);

  // Owned with sufficient cash
  jaipur.ownerId = 'p1';
  const canBuild = canBuildOnProperty(state.players[0], jaipur, state.tiles);
  assert.equal(canBuild.allowed, true);

  // Max level 5
  jaipur.level = 5;
  const maxed = canBuildOnProperty(state.players[0], jaipur, state.tiles);
  assert.equal(maxed.allowed, false);

  // Insufficient treasury
  jaipur.level = 2;
  state.players[0].cash = 200;
  const broke = canBuildOnProperty(state.players[0], jaipur, state.tiles);
  assert.equal(broke.allowed, false);
});

test('executePropertyPurchase deducts cash, assigns ownership, and increments stats', () => {
  const state = createInitialRoomState('room_2', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const res = executePropertyPurchase(state, 'p1', 1); // Jaipur ₹600
  assert.equal(res.ok, true);
  assert.equal(state.tiles[1].ownerId, 'p1');
  assert.equal(state.players[0].cash, 11400);
  assert.equal(state.players[0].propertiesBoughtCount, 1);
});

test('placeAuctionBid validates bid increments and player cash limits', () => {
  const auction = {
    tileIndex: 23,
    tileName: 'Mumbai · Gateway of India',
    basePrice: 4000,
    currentBid: 1000,
    highestBidderId: null,
    highestBidderName: null,
    passedPlayerIds: [],
    active: true,
  };

  const lowBid = placeAuctionBid(auction, 'p1', 'Aarav', 900, 5000);
  assert.equal(lowBid.ok, false);

  const validBid = placeAuctionBid(auction, 'p1', 'Aarav', 1250, 5000);
  assert.equal(validBid.ok, true);
  assert.equal(auction.currentBid, 1250);
  assert.equal(auction.highestBidderId, 'p1');
});

test('validateAndExecuteTrade checks ownership and funds before swapping assets', () => {
  const state = createInitialRoomState('room_3', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  state.tiles[1].ownerId = 'p1'; // Jaipur owned by p1
  state.tiles[4].ownerId = 'bot_ahilya'; // Varanasi owned by bot_ahilya

  // Invalid: p1 does not own tile 2
  const invalidTrade = validateAndExecuteTrade(state, {
    id: 'tr_invalid',
    fromPlayerId: 'p1',
    toPlayerId: 'bot_ahilya',
    offeredTileIndices: [2],
    requestedTileIndices: [4],
    offeredCash: 100,
    requestedCash: 0,
    status: 'pending',
    createdAt: Date.now(),
  });
  assert.equal(invalidTrade.ok, false);

  // Valid trade
  const validTrade = validateAndExecuteTrade(state, {
    id: 'tr_valid',
    fromPlayerId: 'p1',
    toPlayerId: 'bot_ahilya',
    offeredTileIndices: [1],
    requestedTileIndices: [4],
    offeredCash: 300,
    requestedCash: 0,
    status: 'pending',
    createdAt: Date.now(),
  });

  assert.equal(validTrade.ok, true);
  assert.equal(state.tiles[1].ownerId, 'bot_ahilya');
  assert.equal(state.tiles[4].ownerId, 'p1');
  assert.equal(state.players[0].cash, 11700);
  assert.equal(state.players[1].cash, 12300);
});

test('calculatePlayerNetWorth sums cash, deeds base price, and haveli investments', () => {
  const state = createInitialRoomState('room_worth', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const player = state.players[0]; // cash: 12000
  const jaipur = state.tiles[1]; // price: 600, houseCost: 400
  jaipur.ownerId = 'p1';
  jaipur.level = 2; // 2 * 400 = 800

  // 12000 cash + 600 price + 800 havelis = 13400
  assert.equal(calculatePlayerNetWorth(player, state.tiles), 13400);

  // Bankrupt player has 0 net worth
  player.bankrupt = true;
  assert.equal(calculatePlayerNetWorth(player, state.tiles), 0);
});

test('applyEventCard and checkWinCondition compute net worth and victory accurately', () => {
  const state = createInitialRoomState('room_4', 'world', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const cholaCard = HISTORICAL_EVENT_CARDS[0]; // +750 cash
  applyEventCard(state, 'p1', cholaCard);
  assert.equal(state.players[0].cash, 12750);

  state.players[1].bankrupt = true;
  state.players[2].bankrupt = true;
  const win = checkWinCondition(state);
  assert.equal(win.isGameOver, true);
  assert.equal(win.winnerId, 'p1');
});

test('validateAndExecuteTrade rejects already processed or non-pending trades', () => {
  const state = createInitialRoomState('room_trade_replay', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  state.tiles[1].ownerId = 'p1';
  state.tiles[4].ownerId = 'bot_ahilya';

  const offer = {
    id: 'tr_dup',
    fromPlayerId: 'p1',
    toPlayerId: 'bot_ahilya',
    offeredTileIndices: [1],
    requestedTileIndices: [4],
    offeredCash: 100,
    requestedCash: 0,
    status: 'pending' as const,
    createdAt: Date.now(),
  };

  const firstAttempt = validateAndExecuteTrade(state, offer);
  assert.equal(firstAttempt.ok, true);
  assert.equal(offer.status, 'accepted');

  // Second attempt with now-accepted offer must fail
  const secondAttempt = validateAndExecuteTrade(state, offer);
  assert.equal(secondAttempt.ok, false);
  assert.match(secondAttempt.error!, /no longer pending/i);
});

test('rejectTradeOffer and withdrawTradeOffer transition pending offers to rejected', () => {
  const state = createInitialRoomState('room_trade_cancel', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const offer1 = {
    id: 'tr_to_reject',
    fromPlayerId: 'p1',
    toPlayerId: 'bot_ahilya',
    offeredTileIndices: [1],
    requestedTileIndices: [2],
    offeredCash: 0,
    requestedCash: 0,
    status: 'pending' as const,
    createdAt: Date.now(),
  };
  state.tradeOffers.push(offer1);

  const rejRes = rejectTradeOffer(state, 'tr_to_reject', 'bot_ahilya');
  assert.equal(rejRes.ok, true);
  assert.equal(offer1.status, 'rejected');

  const offer2 = {
    id: 'tr_to_withdraw',
    fromPlayerId: 'p1',
    toPlayerId: 'bot_vikram',
    offeredTileIndices: [],
    requestedTileIndices: [],
    offeredCash: 500,
    requestedCash: 0,
    status: 'pending' as const,
    createdAt: Date.now(),
  };
  state.tradeOffers.push(offer2);

  // Unauthorized withdrawal fails
  const unauthorizedRes = withdrawTradeOffer(state, 'tr_to_withdraw', 'bot_vikram');
  assert.equal(unauthorizedRes.ok, false);

  // Proposer withdrawal succeeds
  const withdrawRes = withdrawTradeOffer(state, 'tr_to_withdraw', 'p1');
  assert.equal(withdrawRes.ok, true);
  assert.equal(offer2.status, 'rejected');
});

test('canBuildOnProperty rejects mortgaged properties or unowned plots', () => {
  const state = createInitialRoomState('room_build_rules', 'india', {
    id: 'p1',
    name: 'Aarav',
    tokenKey: 'elephant',
  });
  const p1 = state.players[0];
  const jaipur = state.tiles[1];
  jaipur.ownerId = 'p1';

  // Mortgaged check
  jaipur.isMortgaged = true;
  const mortgagedCheck = canBuildOnProperty(p1, jaipur, state.tiles);
  assert.equal(mortgagedCheck.allowed, false);
  assert.match(mortgagedCheck.reason!, /mortgaged/i);

  // Unmortgage & check allowed
  jaipur.isMortgaged = false;
  assert.equal(canBuildOnProperty(p1, jaipur, state.tiles).allowed, true);
});
