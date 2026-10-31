import React, { useState } from 'react';
import {
  COSMETIC_CATALOG,
  CosmeticItem,
  DAILY_CHALLENGES,
  MapEdition,
} from '../game/boardData';
import {
  GameRoomState,
  calculatePlayerNetWorth,
  canBuildOnProperty,
  calculateRent,
  ownsFullGroup,
} from '../game/rules';
import { TokenIcon } from './GameTokens';
import { PlacePhoto } from './PlacePhoto';
import { B_W_PLAYER_STYLES } from '../game/heritagePerks';

export interface ClientUserProfile {
  id: string;
  username: string;
  displayName: string;
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
  encryptionBadge: string;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  username: string;
  totalWealth: number;
  gamesWon: number;
  citiesMonopolized: number;
  mudraCoins: number;
  equippedToken: string;
}

/* 1. LIVE AUCTION MODAL — MINIMALIST MONOCHROME */
export const AuctionModal: React.FC<{
  room: GameRoomState;
  onBid: (amount: number) => void;
  onFinalize: () => void;
}> = ({ room, onBid, onFinalize }) => {
  const auc = room.activeAuction;
  if (!auc || !auc.active) return null;
  const human = room.players.find((p) => !p.isBot) || room.players[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none font-sans"
    >
      <div className="w-full max-w-md rounded-xl bg-[#0E0E0E] border border-neutral-700 p-5 sm:p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Live Neelami · Public Property Auction
            </div>
            <h2 id="auction-modal-title" className="text-base font-extrabold text-white mt-0.5 tracking-tight">
              {auc.tileName}
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded">
            List: ₹{auc.basePrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-black border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-neutral-400">Current Highest Bid</div>
            <div className="text-2xl font-mono font-extrabold text-white">
              ₹{auc.currentBid.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-neutral-400">Leading Bidder</div>
            <div className="text-sm font-bold text-neutral-200">
              {auc.highestBidderName || 'Opening Floor'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono text-neutral-300 flex justify-between">
            <span>Raise Bid</span>
            <span className="text-neutral-400">
              Treasury: <strong className="text-white">₹{human.cash.toLocaleString('en-IN')}</strong>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[100, 250, 500].map((inc) => {
              const nextAmt = auc.currentBid + inc;
              return (
                <button
                  key={inc}
                  type="button"
                  disabled={human.cash < nextAmt}
                  onClick={() => onBid(nextAmt)}
                  className="py-2.5 px-3 rounded-lg bg-[#181818] hover:bg-[#222222] disabled:opacity-30 border border-neutral-700 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
                >
                  +₹{inc} (₹{nextAmt})
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onFinalize}
          className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow"
        >
          Hammer Down &amp; Finalize Deed to {auc.highestBidderName}
        </button>
      </div>
    </div>
  );
};

/* 2. BILATERAL PROPERTY TRADING MODAL — MINIMALIST MONOCHROME */
export const TradeModal: React.FC<{
  room: GameRoomState;
  onClose: () => void;
  onProposeTrade: (payload: {
    toPlayerId: string;
    offeredTileIndices: number[];
    requestedTileIndices: number[];
    offeredCash: number;
    requestedCash: number;
  }) => void;
  onAcceptTrade?: (offerId: string) => void;
  onRejectTrade?: (offerId: string) => void;
  onWithdrawTrade?: (offerId: string) => void;
}> = ({
  room,
  onClose,
  onProposeTrade,
  onAcceptTrade,
  onRejectTrade,
  onWithdrawTrade,
}) => {
  const human = room.players.find((p) => !p.isBot) || room.players[0];
  const rivals = room.players.filter((p) => p.id !== human.id && !p.bankrupt);
  const [partnerId, setPartnerId] = useState<string>(rivals[0]?.id || '');
  const [offeredTiles, setOfferedTiles] = useState<number[]>([]);
  const [requestedTiles, setRequestedTiles] = useState<number[]>([]);
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [requestedCash, setRequestedCash] = useState<number>(0);

  const partner = room.players.find((p) => p.id === partnerId) || rivals[0];
  const myProperties = room.tiles.filter((t) => t.ownerId === human.id);
  const partnerProperties = room.tiles.filter((t) => t.ownerId === partner?.id);

  const toggleItem = (list: number[], val: number, setter: (v: number[]) => void) => {
    if (list.includes(val)) setter(list.filter((i) => i !== val));
    else setter([...list, val]);
  };

  // Pending incoming and outgoing trades
  const incomingOffers = (room.tradeOffers || []).filter(
    (o) => o.toPlayerId === human.id && o.status === 'pending'
  );
  const outgoingOffers = (room.tradeOffers || []).filter(
    (o) => o.fromPlayerId === human.id && o.status === 'pending'
  );

  // Computed values
  const offeredPropertiesValue = offeredTiles.reduce((sum, idx) => sum + (room.tiles[idx]?.price || 0), 0);
  const requestedPropertiesValue = requestedTiles.reduce((sum, idx) => sum + (room.tiles[idx]?.price || 0), 0);

  const myProjectedCash = human.cash - offeredCash + requestedCash;
  const partnerProjectedCash = (partner?.cash || 0) - requestedCash + offeredCash;

  const canPropose =
    Boolean(partner) &&
    (offeredTiles.length > 0 || requestedTiles.length > 0 || offeredCash > 0 || requestedCash > 0) &&
    offeredCash <= human.cash &&
    requestedCash <= (partner?.cash || 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none font-sans"
    >
      <div className="w-full max-w-3xl rounded-xl bg-[#0E0E0E] border border-neutral-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Vyapar Sandhi · Bilateral Property Trade
            </div>
            <h2 id="trade-modal-title" className="text-base font-extrabold text-white mt-0.5 tracking-tight">
              Negotiate City Deeds &amp; Sovereign Treasury
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Pending Inbound Offers Notification Banner */}
        {incomingOffers.length > 0 && (
          <div className="space-y-2 p-3 rounded-lg bg-neutral-950 border border-amber-500/40">
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Incoming Trade Proposals Awaiting Your Ratification ({incomingOffers.length})
            </div>
            {incomingOffers.map((offer) => {
              const proposer = room.players.find((p) => p.id === offer.fromPlayerId);
              const offNames = offer.offeredTileIndices.map((i) => room.tiles[i]?.name).filter(Boolean);
              const reqNames = offer.requestedTileIndices.map((i) => room.tiles[i]?.name).filter(Boolean);
              return (
                <div key={offer.id} className="p-3 rounded bg-black border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-white">
                      From: <span className="text-amber-300">{proposer?.name || 'Rival'}</span>
                    </div>
                    <div className="text-neutral-300 font-mono text-[11px]">
                      Offers: {offNames.length > 0 ? offNames.join(', ') : 'None'}{offer.offeredCash > 0 ? ` + ₹${offer.offeredCash}` : ''}
                    </div>
                    <div className="text-neutral-400 font-mono text-[11px]">
                      Demands: {reqNames.length > 0 ? reqNames.join(', ') : 'None'}{offer.requestedCash > 0 ? ` + ₹${offer.requestedCash}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAcceptTrade?.(offer.id)}
                      className="px-3 py-1.5 rounded bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase cursor-pointer"
                    >
                      Accept Trade
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectTrade?.(offer.id)}
                      className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-mono cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Outgoing Offers */}
        {outgoingOffers.length > 0 && (
          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">
              Pending Outgoing Offer to <strong className="text-white">{room.players.find((p) => p.id === outgoingOffers[0].toPlayerId)?.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => onWithdrawTrade?.(outgoingOffers[0].id)}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 uppercase cursor-pointer"
            >
              Withdraw Offer
            </button>
          </div>
        )}

        {/* Counterparty Selector */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5">
            Select Trade Partner
          </label>
          <div className="flex flex-wrap gap-2">
            {rivals.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setPartnerId(r.id);
                  setRequestedTiles([]);
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors cursor-pointer flex items-center gap-2 ${
                  partner?.id === r.id
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                }`}
              >
                <TokenIcon tokenKey={r.tokenKey} size={15} color={partner?.id === r.id ? '#000000' : '#FFFFFF'} />
                <span>{r.name}</span>
                <span className="text-[10px] opacity-75">(₹{r.cash.toLocaleString('en-IN')})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Asset Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Your Offer */}
          <div className="p-3.5 rounded-lg bg-black border border-neutral-800 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Your Offer ({human.name})</span>
              <span className="text-[10px] font-mono text-neutral-400">Deeds: {myProperties.length}</span>
            </div>
            <div>
              <label htmlFor="offer-cash-input" className="block text-[10px] font-mono text-neutral-400 mb-1">
                Cash Offered (Max ₹{human.cash.toLocaleString('en-IN')})
              </label>
              <input
                id="offer-cash-input"
                type="number"
                min={0}
                max={human.cash}
                step={100}
                value={offeredCash}
                onChange={(e) => setOfferedCash(Math.max(0, Math.min(human.cash, Number(e.target.value))))}
                className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-neutral-400">Select Properties to Offer ({offeredTiles.length})</div>
              {myProperties.length === 0 ? (
                <div className="text-xs text-neutral-500 italic py-2">No city deeds owned yet.</div>
              ) : (
                myProperties.map((t) => (
                  <button
                    key={t.index}
                    type="button"
                    onClick={() => toggleItem(offeredTiles, t.index, setOfferedTiles)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between border cursor-pointer ${
                      offeredTiles.includes(t.index)
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="font-mono">₹{t.price}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Partner's Request */}
          <div className="p-3.5 rounded-lg bg-black border border-neutral-800 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Request from {partner?.name}</span>
              <span className="text-[10px] font-mono text-neutral-400">Deeds: {partnerProperties.length}</span>
            </div>
            <div>
              <label htmlFor="request-cash-input" className="block text-[10px] font-mono text-neutral-400 mb-1">
                Cash Requested (Max ₹{partner?.cash || 0})
              </label>
              <input
                id="request-cash-input"
                type="number"
                min={0}
                max={partner?.cash || 0}
                step={100}
                value={requestedCash}
                onChange={(e) =>
                  setRequestedCash(Math.max(0, Math.min(partner?.cash || 0, Number(e.target.value))))
                }
                className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-neutral-400">Select Properties to Request ({requestedTiles.length})</div>
              {partnerProperties.length === 0 ? (
                <div className="text-xs text-neutral-500 italic py-2">Partner owns no deeds yet.</div>
              ) : (
                partnerProperties.map((t) => (
                  <button
                    key={t.index}
                    type="button"
                    onClick={() => toggleItem(requestedTiles, t.index, setRequestedTiles)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between border cursor-pointer ${
                      requestedTiles.includes(t.index)
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="font-mono">₹{t.price}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Proposed Transaction Impact Preview */}
        <div className="p-3.5 rounded-lg bg-black border border-neutral-800 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            Live Settlement &amp; Treasury Projection
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1 border-r border-neutral-800 pr-2">
              <div className="text-neutral-400">Your Portfolio Shift:</div>
              <div>Deeds Value: <strong className="text-white">₹{offeredPropertiesValue} → ₹{requestedPropertiesValue}</strong></div>
              <div>Liquid Cash: <strong className={myProjectedCash >= human.cash ? 'text-green-400' : 'text-neutral-200'}>₹{human.cash} → ₹{myProjectedCash}</strong></div>
            </div>
            <div className="space-y-1">
              <div className="text-neutral-400">{partner?.name} Portfolio Shift:</div>
              <div>Deeds Value: <strong className="text-white">₹{requestedPropertiesValue} → ₹{offeredPropertiesValue}</strong></div>
              <div>Liquid Cash: <strong className={partnerProjectedCash >= (partner?.cash || 0) ? 'text-green-400' : 'text-neutral-200'}>₹{partner?.cash || 0} → ₹{partnerProjectedCash}</strong></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <div className="text-[10px] font-mono text-neutral-400">
            {offeredCash > human.cash ? (
              <span className="text-red-400">Cash offer exceeds your treasury.</span>
            ) : requestedCash > (partner?.cash || 0) ? (
              <span className="text-red-400">Cash request exceeds partner treasury.</span>
            ) : !canPropose ? (
              <span>Select at least one property or cash amount to propose trade.</span>
            ) : (
              <span className="text-neutral-300">Ready to transmit bilateral trade agreement.</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canPropose}
              onClick={() => {
                if (!partner || !canPropose) return;
                onProposeTrade({
                  toPlayerId: partner.id,
                  offeredTileIndices: offeredTiles,
                  requestedTileIndices: requestedTiles,
                  offeredCash,
                  requestedCash,
                });
                onClose();
              }}
              className="px-5 py-2 rounded bg-white hover:bg-neutral-200 disabled:opacity-30 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow"
            >
              Dispatch Trade Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 3. PROPERTY OWNERSHIP DIRECTORY & SOVEREIGN DEED LEDGER */
export const PropertyLedgerModal: React.FC<{
  room: GameRoomState;
  onClose: () => void;
  onSelectTile: (tileIndex: number) => void;
  onOpenTradeWithPartner?: (partnerId: string, tileIndex?: number) => void;
  onUpgradeTile?: (tileIndex: number) => void;
}> = ({ room, onClose, onSelectTile, onOpenTradeWithPartner, onUpgradeTile }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'unowned' | 'monopolies' | 'developed'>('all');
  const [filterPlayerId, setFilterPlayerId] = useState<string>('all');
  const human = room.players.find((p) => !p.isBot) || room.players[0];

  const purchasableTiles = room.tiles.filter((t) => ['property', 'transport', 'utility'].includes(t.type));

  const filteredTiles = purchasableTiles.filter((t) => {
    if (filterPlayerId !== 'all') {
      return t.ownerId === filterPlayerId;
    }
    if (activeTab === 'my') {
      return t.ownerId === human.id;
    }
    if (activeTab === 'unowned') {
      return !t.ownerId;
    }
    if (activeTab === 'monopolies') {
      return t.ownerId && ownsFullGroup(t.ownerId, t.group, room.tiles);
    }
    if (activeTab === 'developed') {
      return t.level > 0;
    }
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-ledger-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 select-none font-sans"
    >
      <div className="w-full max-w-4xl rounded-xl bg-[#0E0E0E] border border-neutral-700 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Sovereign Asset Directory · Room {room.roomId}
            </div>
            <h2 id="property-ledger-title" className="text-base font-extrabold text-white mt-0.5 tracking-tight">
              Property Ownership &amp; Portfolio Ledger
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Players Ownership Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {room.players.map((p, idx) => {
            const ownedList = room.tiles.filter((t) => t.ownerId === p.id);
            const totalBaseValue = ownedList.reduce((sum, t) => sum + t.price, 0);
            const totalNetWorth = calculatePlayerNetWorth(p, room.tiles);
            const haveliCount = ownedList.reduce((sum, t) => sum + (t.level || 0), 0);
            const groups = Array.from(new Set(ownedList.map((t) => t.group)));
            const monopolyCount = groups.filter((g) => ownsFullGroup(p.id, g, room.tiles)).length;
            const isTurn = idx === room.currentTurnIndex;

            return (
              <div
                key={p.id}
                onClick={() => setFilterPlayerId((curr) => (curr === p.id ? 'all' : p.id))}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  filterPlayerId === p.id
                    ? 'bg-neutral-900 border-white ring-1 ring-white'
                    : 'bg-black border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TokenIcon tokenKey={p.tokenKey} size={18} color="#FFFFFF" />
                    <span className="font-bold text-xs text-white truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.isBot ? (
                      <span className="text-[9px] font-mono uppercase text-neutral-400 border border-neutral-800 px-1 py-0.2 rounded">
                        AI
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono uppercase text-green-400 border border-green-900/50 px-1 py-0.2 rounded">
                        HUMAN
                      </span>
                    )}
                    {isTurn && (
                      <span className="text-[9px] font-mono uppercase bg-white text-black font-bold px-1 py-0.2 rounded">
                        TURN
                      </span>
                    )}
                    {p.bankrupt && (
                      <span className="text-[9px] font-mono uppercase bg-red-900 text-white font-bold px-1 py-0.2 rounded">
                        BANKRUPT
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono border-t border-neutral-800 pt-2">
                  <div>
                    <span className="text-neutral-500">Liquid Cash: </span>
                    <strong className="text-white">₹{p.cash.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Net Worth: </span>
                    <strong className="text-amber-400">₹{totalNetWorth.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Deeds: </span>
                    <strong className="text-white">{ownedList.length}</strong> (₹{totalBaseValue.toLocaleString('en-IN')})
                  </div>
                  <div>
                    <span className="text-neutral-500">Monopolies: </span>
                    <strong className="text-white">{monopolyCount}</strong> · Havelis: {haveliCount}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
            {[
              { id: 'all', label: `All Deeds (${purchasableTiles.length})` },
              { id: 'my', label: `My Properties (${room.tiles.filter((t) => t.ownerId === human.id).length})` },
              { id: 'unowned', label: `Unclaimed (${purchasableTiles.filter((t) => !t.ownerId).length})` },
              { id: 'monopolies', label: 'Monopolies' },
              { id: 'developed', label: 'Developed Havelis' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setFilterPlayerId('all');
                }}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id && filterPlayerId === 'all'
                    ? 'bg-white text-black font-bold'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filterPlayerId !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterPlayerId('all')}
              className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer"
            >
              Clear Player Filter (Showing {room.players.find((p) => p.id === filterPlayerId)?.name}) ✕
            </button>
          )}
        </div>

        {/* Property Deeds List */}
        <div className="space-y-2 max-h-[48vh] overflow-y-auto">
          {filteredTiles.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500 font-mono">
              No property deeds match this filter criteria.
            </div>
          ) : (
            filteredTiles.map((tile) => {
              const owner = room.players.find((p) => p.id === tile.ownerId);
              const rent = calculateRent(tile, 7, room.tiles, room.turnNumber);
              const hasMonopoly = owner ? ownsFullGroup(owner.id, tile.group, room.tiles) : false;
              const buildCheck = canBuildOnProperty(human, tile, room.tiles);

              return (
                <div
                  key={tile.id}
                  className="p-3 rounded-lg bg-black border border-neutral-800 hover:border-neutral-600 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  {/* Left: Place Photo + Metadata */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-12 rounded overflow-hidden shrink-0 border border-neutral-800 bg-[#141414]">
                      <PlacePhoto tile={tile} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          {tile.group} · {tile.stateOrCountry}
                        </span>
                        {hasMonopoly && (
                          <span className="text-[9px] font-mono uppercase bg-white text-black font-bold px-1.5 py-0.2 rounded">
                            Monopoly (2x Rent)
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {tile.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] font-mono text-neutral-300 mt-0.5">
                        <span>Deed: <strong className="text-white">₹{tile.price.toLocaleString('en-IN')}</strong></span>
                        <span>Rent: <strong className="text-amber-400">₹{rent.toLocaleString('en-IN')}</strong> (Base ₹{tile.baseRent})</span>
                        {tile.level > 0 && (
                          <span className="text-white font-bold">★ Level {tile.level} ({tile.level === 5 ? 'Royal Mahal' : `${tile.level} Havelis`})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Owner Badge & Direct Interaction Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="text-right font-mono text-[11px] mr-1">
                      <div className="text-[9px] text-neutral-500 uppercase">Owner</div>
                      <div className="font-bold text-white flex items-center gap-1">
                        {owner ? (
                          <>
                            <TokenIcon tokenKey={owner.tokenKey} size={14} color="#FFFFFF" />
                            <span>{owner.name.split(' ')[0]}</span>
                          </>
                        ) : (
                          <span className="text-neutral-400">Unclaimed</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTile(tile.index);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-200 cursor-pointer"
                      title="Locate and inspect landmark on the board"
                    >
                      Locate
                    </button>

                    {tile.ownerId === human.id && tile.type === 'property' && onUpgradeTile && (
                      <button
                        type="button"
                        disabled={!buildCheck.allowed}
                        onClick={() => onUpgradeTile(tile.index)}
                        className="px-2.5 py-1.5 rounded bg-white hover:bg-neutral-200 disabled:opacity-30 text-black font-extrabold text-xs uppercase cursor-pointer"
                        title={buildCheck.reason || `Upgrade to Level ${tile.level + 1}`}
                      >
                        +Haveli (₹{tile.houseCost})
                      </button>
                    )}

                    {tile.ownerId && tile.ownerId !== human.id && onOpenTradeWithPartner && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTradeWithPartner(tile.ownerId!, tile.index);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
                      >
                        Trade
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* 3. INTEGRATED REAL-TIME CHAT DRAWER — MINIMALIST MONOCHROME */
export const ChatDrawer: React.FC<{
  roomId: string;
  messages: { id: string; senderId: string; senderName: string; senderColor: string; text: string; timestamp: number }[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}> = ({ roomId, messages, onSendMessage, onClose }) => {
  const [draft, setDraft] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(draft.trim());
    setDraft('');
  };

  return (
    <aside
      aria-label="Multiplayer Room Chat"
      className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-sm bg-[#0E0E0E] border-l border-neutral-800 shadow-2xl flex flex-col font-sans select-none"
    >
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-[#121212]">
        <div>
          <div className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
            Room {roomId} · Darbar Dispatch
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Real-Time WebSocket Channel</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
        >
          Close [Esc]
        </button>
      </div>

      {/* Diplomatic Quick Phrases */}
      <div className="px-3 py-2 border-b border-neutral-800/80 flex gap-1.5 overflow-x-auto bg-black">
        {[
          'Open to trading Jaipur?',
          'Hands off Mumbai & Delhi!',
          'Shubh Labh! Great roll!',
        ].map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => onSendMessage(phrase)}
            className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10.5px] font-mono text-neutral-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="p-2.5 rounded bg-black border border-neutral-800 space-y-0.5">
            <div className="flex items-center justify-between text-[10.5px] font-mono">
              <span className="font-bold text-white">
                {m.senderName}
              </span>
              <span className="text-neutral-500">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">{m.text}</p>
          </div>
        ))}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={submit} className="p-3 border-t border-neutral-800 flex gap-2 bg-[#121212]">
        <input
          type="text"
          aria-label="Chat message input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message room players..."
          className="flex-1 px-3 py-2 rounded bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white font-sans"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase cursor-pointer whitespace-nowrap"
        >
          Send
        </button>
      </form>
    </aside>
  );
};

/* 4. DAILY CHALLENGES, COSMETICS STORE & HONEST DEMO CHECKOUT MODAL */
export const ChallengesAndStoreModal: React.FC<{
  user: ClientUserProfile;
  onClaimChallenge: (challengeId: string) => Promise<void>;
  onPurchaseCosmetic: (itemId: string, paymentMode: 'mudra' | 'inr', paymentMethod?: string) => Promise<void>;
  onClose: () => void;
}> = ({ user, onClaimChallenge, onPurchaseCosmetic, onClose }) => {
  const [tab, setTab] = useState<'challenges' | 'store' | 'checkout'>('challenges');
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const handleOpenCheckout = (item: CosmeticItem) => {
    setSelectedItem(item);
    setTab('checkout');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none font-sans"
    >
      <div className="w-full max-w-3xl rounded-xl bg-[#0E0E0E] border border-neutral-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Samrat Treasury &amp; Token Upgrades
            </div>
            <h2 id="store-modal-title" className="text-base font-extrabold text-white mt-0.5 tracking-tight">
              Mudra Coins &amp; Daily Milestones
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-black p-1 rounded border border-neutral-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTab('challenges')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  tab === 'challenges' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Challenges
              </button>
              <button
                type="button"
                onClick={() => setTab('store')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  tab === 'store' || tab === 'checkout'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Token Vault
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
            >
              Close [Esc]
            </button>
          </div>
        </div>

        {statusBanner && (
          <div className="px-3.5 py-2 rounded bg-white text-black font-mono text-xs font-bold">
            {statusBanner}
          </div>
        )}

        {tab === 'challenges' && (
          <div className="space-y-2.5">
            {DAILY_CHALLENGES.map((ch) => {
              const currentVal = user.stats[ch.metric] || 0;
              const isClaimed = user.claimedChallenges.includes(ch.id);
              const isReady = currentVal >= ch.target && !isClaimed;
              return (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-lg bg-black border border-neutral-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{ch.title}</span>
                      <span className="text-[11px] font-mono text-neutral-300">
                        +{ch.rewardMudra} Mudra
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{ch.description}</p>
                    <div className="text-[11px] font-mono text-neutral-500">
                      Progress: {Math.min(currentVal, ch.target)} / {ch.target}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isReady}
                    onClick={async () => {
                      await onClaimChallenge(ch.id);
                      setStatusBanner(`Claimed +${ch.rewardMudra} Mudra Coins for "${ch.title}"!`);
                    }}
                    className={`px-4 py-2 rounded text-xs font-mono uppercase font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      isClaimed
                        ? 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-default'
                        : isReady
                          ? 'bg-white text-black hover:bg-neutral-200'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    {isClaimed ? 'Claimed' : isReady ? `Claim +${ch.rewardMudra} Mudra` : 'In Progress'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'store' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COSMETIC_CATALOG.map((item) => {
                const owned = user.unlockedCosmetics.includes(item.id);
                const equipped = user.equippedToken === item.svgKey;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-black border border-neutral-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[9.5px] uppercase font-mono tracking-wider text-neutral-400">
                          {item.rarity} Token
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">{item.name}</div>
                      </div>
                      <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                        <TokenIcon tokenKey={item.svgKey} color={item.accentColor} size={28} />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
                    <div className="pt-2 border-t border-neutral-800 flex flex-col gap-1.5">
                      {owned ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await onPurchaseCosmetic(item.id, 'mudra');
                            setStatusBanner(`Equipped ${item.name} on the game board!`);
                          }}
                          className={`w-full py-2 rounded text-xs font-mono uppercase font-bold cursor-pointer transition-colors ${
                            equipped
                              ? 'bg-white text-black'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {equipped ? 'Equipped Active Token' : 'Equip Token'}
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 font-mono">
                          <button
                            type="button"
                            onClick={async () => {
                              await onPurchaseCosmetic(item.id, 'mudra');
                              setStatusBanner(`Unlocked and equipped ${item.name}!`);
                            }}
                            className="py-1.5 px-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-[11px] cursor-pointer"
                          >
                            {item.mudraPrice} Mudra
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCheckout(item)}
                            className="py-1.5 px-2 rounded bg-white hover:bg-neutral-200 text-black font-extrabold text-[11px] cursor-pointer"
                          >
                            Demo Unlock
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Honest Demonstration Checkout (No Fake Gateway Claims) */}
        {tab === 'checkout' && selectedItem && (
          <div className="p-4 rounded-lg bg-black border border-neutral-700 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  [DEMO PROTOTYPE] In-Game Cosmetic Unlock
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  Unlock Token: {selectedItem.name}
                </div>
              </div>
              <div className="text-sm font-mono font-bold text-neutral-400">
                Sandbox Simulation
              </div>
            </div>

            <div className="p-3 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-sans">
              <strong className="text-white">Notice:</strong> Real payment processing (UPI/Cards) is not active in this development sandbox. Clicking the button below simulates the purchase and unlocks <strong>{selectedItem.name}</strong> along with 100 Mudra Coins immediately without charging real funds.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTab('store')}
                className="px-4 py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
              >
                Back to Store
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onPurchaseCosmetic(selectedItem.id, 'inr', 'Simulated Demo Grant');
                  setStatusBanner(
                    `Sandbox Grant Confirmed! Unlocked ${selectedItem.name} + 100 Bonus Mudra Coins.`
                  );
                  setTab('store');
                }}
                className="px-5 py-2 rounded bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow"
              >
                Confirm Free Demo Unlock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* 5. PROFILE, ENCRYPTED LOGIN, LEADERBOARD & SOCIAL SHARE MODAL — MINIMALIST MONOCHROME */
export const ProfileAndLeaderboardModal: React.FC<{
  user: ClientUserProfile;
  leaderboard: LeaderboardEntry[];
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, displayName: string, password: string) => Promise<void>;
  onToggleNotifications: (enabled: boolean) => Promise<void>;
  onClose: () => void;
}> = ({ user, leaderboard, onLogin, onRegister, onToggleNotifications, onClose }) => {
  const [tab, setTab] = useState<'profile' | 'leaderboard' | 'auth'>('profile');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleShareAchievement = async () => {
    const shareText = `🏆 Samrat Monopoly Dispatch: ${user.displayName} (@${user.username}) has amassed ₹${user.totalWealthEarned.toLocaleString('en-IN')} Career Wealth, ${user.citiesMonopolized} Heritage Landmarks, and ${user.mudraCoins} Royal Mudra Coins! Join Room BHARAT-108!`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      setShareToast('Achievement Dispatch copied to clipboard for friends!');
    } catch {
      setShareToast(shareText);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none font-sans"
    >
      <div className="w-full max-w-3xl rounded-xl bg-[#0E0E0E] border border-neutral-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              {user.encryptionBadge}
            </div>
            <h2 id="profile-modal-title" className="text-base font-extrabold text-white mt-0.5 tracking-tight">
              {user.displayName} (@{user.username})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-black p-1 rounded border border-neutral-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTab('profile')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  tab === 'profile' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Profile Stats
              </button>
              <button
                type="button"
                onClick={() => setTab('leaderboard')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  tab === 'leaderboard' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Leaderboard
              </button>
              <button
                type="button"
                onClick={() => setTab('auth')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  tab === 'auth' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Account Auth
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
            >
              Close [Esc]
            </button>
          </div>
        </div>

        {shareToast && (
          <div className="px-3.5 py-2 rounded bg-white text-black font-mono text-xs font-bold">
            {shareToast}
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded bg-black border border-neutral-800">
                <div className="text-[10px] font-mono uppercase text-neutral-400">Career Wealth</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  ₹{user.totalWealthEarned.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 rounded bg-black border border-neutral-800">
                <div className="text-[10px] font-mono uppercase text-neutral-400">Games Won / Played</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  {user.gamesWon} / {user.gamesPlayed}
                </div>
              </div>
              <div className="p-3 rounded bg-black border border-neutral-800">
                <div className="text-[10px] font-mono uppercase text-neutral-400">Cities Acquired</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  {user.citiesMonopolized + user.stats.properties_bought}
                </div>
              </div>
              <div className="p-3 rounded bg-black border border-neutral-800">
                <div className="text-[10px] font-mono uppercase text-neutral-400">Mudra Coins</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  {user.mudraCoins}
                </div>
              </div>
            </div>

            {/* Notification and Social Share Strip */}
            <div className="p-4 rounded bg-black border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Push Notifications &amp; Daily Turn Alerts
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Receive turn reminders, live auction notices, and daily Mudra milestone events.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleNotifications(!user.pushNotificationsEnabled)}
                  className={`px-3 py-1.5 rounded text-xs font-mono uppercase font-bold border cursor-pointer ${
                    user.pushNotificationsEnabled
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                  }`}
                >
                  {user.pushNotificationsEnabled ? 'Alerts: Active' : 'Enable Alerts'}
                </button>
                <button
                  type="button"
                  onClick={handleShareAchievement}
                  className="px-3.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-mono text-xs uppercase cursor-pointer"
                >
                  Share Achievement Card
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-[10px] uppercase text-neutral-500">
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Player</th>
                  <th className="py-2 px-3">Total Wealth</th>
                  <th className="py-2 px-3">Wins</th>
                  <th className="py-2 px-3">Mudra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-neutral-900/60">
                    <td className="py-2.5 px-3 font-bold text-white">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                      <TokenIcon tokenKey={entry.equippedToken} size={16} />
                      <span>{entry.displayName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-neutral-200">
                      ₹{entry.totalWealth.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400">
                      {entry.gamesWon}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300">
                      {entry.mudraCoins}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'auth' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (authMode === 'login') {
                await onLogin(username, password);
              } else {
                await onRegister(username, displayName || username, password);
              }
              setShareToast('Authenticated with Scrypt + AES-256-GCM Encrypted Vault!');
              setTab('profile');
            }}
            className="p-4 rounded-lg bg-black border border-neutral-800 space-y-3 max-w-md mx-auto"
          >
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {authMode === 'login' ? 'Encrypted Sign In' : 'Register Encrypted Account'}
              </div>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-[11px] font-mono text-neutral-400 underline cursor-pointer hover:text-white"
              >
                {authMode === 'login' ? 'Create New Account' : 'Have an Account? Sign In'}
              </button>
            </div>
            <div>
              <label htmlFor="auth-username" className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="aarav_samrat"
                className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>
            {authMode === 'register' && (
              <div>
                <label htmlFor="auth-displayname" className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                  Display Title
                </label>
                <input
                  id="auth-displayname"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Maharaja Aarav"
                  className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-password" className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                Password (Scrypt Salted Hash)
              </label>
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
            >
              {authMode === 'login' ? 'Unlock Profile Vault' : 'Encrypt & Register Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* 6. PAUSE & GAMEOVER STATUS MODAL — MINIMALIST MONOCHROME */
export const StatusModal: React.FC<{
  mode: 'paused' | 'gameover';
  room: GameRoomState;
  onResume: () => void;
  onRestart: () => void;
  onSwitchEdition: (ed: MapEdition) => void;
  onReturnTitle: () => void;
  onOpenRules?: () => void;
}> = ({ mode, room, onResume, onRestart, onSwitchEdition, onReturnTitle, onOpenRules }) => {
  const human = room.players.find((p) => !p.isBot) || room.players[0];
  const netWorth = calculatePlayerNetWorth(human, room.tiles);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none font-sans"
    >
      <div className="w-full max-w-md rounded-xl bg-[#0E0E0E] border border-neutral-700 p-6 shadow-2xl space-y-5 text-center text-white">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            {mode === 'paused' ? 'Match Suspended' : 'Campaign Complete'}
          </div>
          <h2 id="status-modal-title" className="text-xl font-extrabold tracking-tight text-white mt-1">
            {mode === 'paused' ? 'Game Session Paused' : 'Treasury Settlement & Reckoning'}
          </h2>
        </div>

        {/* Tabular Stats Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded bg-black border border-neutral-800">
            <div className="text-[9.5px] font-mono uppercase text-neutral-500">Net Worth</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              ₹{netWorth.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-3 rounded bg-black border border-neutral-800">
            <div className="text-[9.5px] font-mono uppercase text-neutral-500">Deeds Held</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {room.tiles.filter((t) => t.ownerId === human.id).length}
            </div>
          </div>
          <div className="p-3 rounded bg-black border border-neutral-800">
            <div className="text-[9.5px] font-mono uppercase text-neutral-500">Turns</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {room.turnNumber}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {mode === 'paused' ? (
            <button
              type="button"
              onClick={onResume}
              className="w-full py-2.5 rounded bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow"
            >
              Resume Match [Esc]
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="w-full py-2.5 rounded bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow"
            >
              Play Again / Rematch
            </button>
          )}

          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="w-full py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono uppercase text-neutral-200 cursor-pointer"
            >
              View Strategic Rulebook &amp; Perks [H]
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSwitchEdition(room.edition === 'india' ? 'world' : 'india')}
              className="py-2 px-3 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
            >
              Switch to {room.edition === 'india' ? 'World Map' : 'Bharat Map'}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="py-2 px-3 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
            >
              Reset Board
            </button>
          </div>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-2 rounded text-xs font-mono text-neutral-500 hover:text-neutral-300 cursor-pointer"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};

/* 7. REAL-TIME MATCH ACTION LOG DRAWER — MINIMALIST MONOCHROME */
export const ActionLogDrawer: React.FC<{
  room: GameRoomState;
  onClose: () => void;
}> = ({ room, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'buy' | 'rent' | 'auction' | 'trade' | 'event'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const rentLogs = room.logs.filter((l) => l.type === 'rent');
  const buyLogs = room.logs.filter((l) => l.type === 'buy');
  const auctionLogs = room.logs.filter((l) => l.type === 'auction');
  const tradeLogs = room.logs.filter((l) => l.type === 'trade');

  const filteredLogs = room.logs.filter((log) => {
    if (filter !== 'all' && log.type !== filter) return false;
    if (searchTerm.trim()) {
      return log.text.toLowerCase().includes(searchTerm.toLowerCase().trim());
    }
    return true;
  });

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'buy':
        return { label: 'DEED ACQUIRED', bg: 'bg-white text-black border-white' };
      case 'rent':
        return { label: 'RENT PAID', bg: 'bg-neutral-800 text-white border-neutral-600' };
      case 'auction':
        return { label: 'AUCTION HAMMER', bg: 'bg-neutral-800 text-white border-neutral-600' };
      case 'trade':
        return { label: 'TRADE ACCORD', bg: 'bg-neutral-700 text-white border-neutral-500' };
      case 'event':
        return { label: 'HISTORICAL CARD', bg: 'bg-neutral-900 text-neutral-300 border-neutral-700' };
      default:
        return { label: 'MATCH INFO', bg: 'bg-neutral-900 text-neutral-400 border-neutral-800' };
    }
  };

  return (
    <aside
      aria-label="Match Action Log"
      className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0D0D0D] border-l border-neutral-800 shadow-2xl flex flex-col select-none font-mono text-white"
    >
      <div className="px-4 py-3.5 border-b border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">
              Match Sovereign Ledger
            </h2>
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            ROOM {room.roomId} · ROUND #{room.turnNumber} · {room.logs.length} ENTRIES
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] uppercase font-bold text-neutral-300 transition-colors cursor-pointer"
        >
          Close [Esc]
        </button>
      </div>

      <div className="p-3 bg-[#111111] border-b border-neutral-800 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-black border border-neutral-800">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Deeds</div>
          <div className="text-sm font-bold text-white mt-0.5">{buyLogs.length}</div>
        </div>
        <div className="p-2 rounded bg-black border border-neutral-800">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Rents</div>
          <div className="text-sm font-bold text-white mt-0.5">{rentLogs.length}</div>
        </div>
        <div className="p-2 rounded bg-black border border-neutral-800">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Auctions</div>
          <div className="text-sm font-bold text-white mt-0.5">{auctionLogs.length}</div>
        </div>
        <div className="p-2 rounded bg-black border border-neutral-800">
          <div className="text-[9px] text-neutral-500 uppercase tracking-wider">Trades</div>
          <div className="text-sm font-bold text-white mt-0.5">{tradeLogs.length}</div>
        </div>
      </div>

      <div className="p-3 border-b border-neutral-800 space-y-2 bg-[#0E0E0E]">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter ledger entries..."
          className="w-full px-3 py-1.5 rounded bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white"
        />

        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'buy', label: 'Deeds' },
              { key: 'rent', label: 'Rents' },
              { key: 'auction', label: 'Auctions' },
              { key: 'trade', label: 'Trades' },
              { key: 'event', label: 'Cards' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`px-2.5 py-1 rounded uppercase tracking-wider transition-colors cursor-pointer ${
                filter === t.key
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-neutral-500 text-xs">
            <p>No recorded ledger entries found.</p>
            <p className="text-[10px] text-neutral-600 mt-1">Roll the dice to record transaction history.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getLogBadge(log.type);
            return (
              <div
                key={log.id}
                className="p-2.5 rounded bg-black border border-neutral-800 hover:border-neutral-600 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-[9px]">
                  <span className={`px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-neutral-500">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed font-sans font-medium">
                  {log.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-neutral-800 bg-[#121212] flex items-center justify-between text-[10px] text-neutral-400">
        <span>AES-256 LEDGER PROTOCOL</span>
        <span className="text-white font-bold">ROOM {room.roomId}</span>
      </div>
    </aside>
  );
};

/* 8. INTERACTIVE STRATEGIC RULEBOOK & HOW-TO-PLAY CODEX */
export const RulesAndGuideModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [section, setSection] = useState<'loop' | 'monopoly' | 'auctions' | 'climates' | 'perks' | 'victory'>('loop');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none font-sans"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#0E0E0E] border border-neutral-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Samrat Monopoly Codex
            </div>
            <h2 id="rules-modal-title" className="text-base font-extrabold text-white mt-0.5 tracking-tight">
              Official Game Rules &amp; Strategic Manual
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-mono">
          {[
            { id: 'loop', label: 'Turn Loop' },
            { id: 'monopoly', label: 'Deeds & Havelis' },
            { id: 'auctions', label: 'Auctions & Trades' },
            { id: 'climates', label: 'Market Climates' },
            { id: 'perks', label: 'Heritage Perks' },
            { id: 'victory', label: 'Win Condition' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id as typeof section)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                section === tab.id
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="p-4 rounded-lg bg-black border border-neutral-800 space-y-3 text-xs leading-relaxed text-neutral-300">
          {section === 'loop' && (
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Circumnavigation &amp; Turn Sequence</h3>
              <p>
                Each player begins with <strong>₹12,000</strong> treasury and takes turns rolling the dual dice pair.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                <li><strong className="text-white">Starting Tile (GO):</strong> Every complete circuit around the 24 perimeter tiles grants a <strong>₹2,000 Treasury Stipend</strong>.</li>
                <li><strong className="text-white">Unowned Properties:</strong> When landing on an unowned city, transit line, or utility, you may purchase the title deed at face value or send it to public auction.</li>
                <li><strong className="text-white">Opponent Properties:</strong> Landing on a rival&apos;s property incurs rent. Group monopolies double base rent!</li>
                <li><strong className="text-white">Treasury Pool:</strong> GST taxes swell the Bharat Mandapam / World Development Fund. Landing on Treasury claims the entire accumulated pool (minimum ₹500).</li>
              </ul>
            </div>
          )}

          {section === 'monopoly' && (
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Monopolies &amp; Architectural Upgrades</h3>
              <p>
                Properties are grouped by regional color bands (e.g. Rajputana Heritage, Sacred Doab, Sovereign Capitals).
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                <li><strong className="text-white">Group Monopoly:</strong> Owning all cities in a color group doubles the base rent on unimproved plots automatically.</li>
                <li><strong className="text-white">Havelis (Levels 1–4):</strong> Once a player owns a property, they can invest in Havelis to multiply rent yields significantly.</li>
                <li><strong className="text-white">Royal Mahal (Level 5):</strong> The pinnacle architectural wonder, demanding supreme rents from any rival stepping into your territory.</li>
                <li><strong className="text-white">Transit &amp; Utilities:</strong> Transit rent doubles with each station owned (CSMT, IGI, Sea Lanes, Jetways). Utilities yield 40x or 100x dice rolls based on ownership.</li>
              </ul>
            </div>
          )}

          {section === 'auctions' && (
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Public Auctions &amp; Bilateral Diplomacy</h3>
              <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                <li><strong className="text-white">Live Auctions:</strong> If an unowned property is declined, opening floor neelami begins at 50% list price. Players raise bids in +₹100, +₹250, or +₹500 increments until hammered down.</li>
                <li><strong className="text-white">Bilateral Trades:</strong> Propose package exchanges with any rival player. Combine multiple deeds and cash balances to complete crucial color sets.</li>
                <li><strong className="text-white">AI Counter-offers:</strong> Autonomous AI rivals (Rani Ahilya &amp; Vikramaditya) dynamically analyze deed utility and participate in competitive auctions.</li>
              </ul>
            </div>
          )}

          {section === 'climates' && (
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Economic Market Volatility Cycles</h3>
              <p>
                Every 4 rounds, the global market climate transitions through three macroeconomic states:
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">STABLE EQUILIBRIUM:</strong> Baseline property appraisals and standard rental schedules apply.
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">BULL EXPANSION (+20% RENT):</strong> High capital velocity boosts all property rental payouts by +20%.
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">LIQUIDITY TIGHTENING (-15% RENT):</strong> Tight monetary supply lowers base rents by -15%, while GO circuit stipends are increased to ₹2,500.
                </div>
              </div>
            </div>
          )}

          {section === 'perks' && (
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Signature Landmark Heritage Perks</h3>
              <p>
                Every landmark features authentic historical provenance and a distinct strategic perk:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10.5px]">
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">Mumbai / Dalal Street:</strong> All bilateral trades grant a +10% liquidity bonus.
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">Ahmedabad / GIFT City:</strong> Immune to luxury cess and infrastructure taxes.
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">ISRO &amp; Solar Grid:</strong> Owning both utility nodes doubles clean energy tariffs.
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">Agra / Taj Mahal:</strong> Wonder of the World — Royal Mahal rent cannot be reduced or bypassed.
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">Rome / Colosseum:</strong> Yields +20% bonus when combined with Paris or London.
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <strong className="text-white">Singapore / Marina Bay:</strong> Collects +₹200 whenever rivals transit across continents.
                </div>
              </div>
            </div>
          )}

          {section === 'victory' && (
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Winning Conditions &amp; Bankruptcy</h3>
              <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                <li><strong className="text-white">Total Monopoly:</strong> A player wins immediately if all rival competitors are driven into insolvency/bankruptcy.</li>
                <li><strong className="text-white">Supreme Net Worth Reckoning:</strong> If round 40 is reached, the player with the greatest total net worth (liquid cash + deed book values + constructed havelis) is crowned Samrat!</li>
                <li><strong className="text-white">Insolvency Settlement:</strong> If unable to pay rent, all deeds held by the debtor transfer directly to the creditor to satisfy liabilities.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
