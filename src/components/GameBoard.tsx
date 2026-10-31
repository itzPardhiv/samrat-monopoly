import React, { useState } from 'react';
import {
  GameRoomState,
  PlayerState,
  calculateTileOwnershipDensity,
  canBuildOnProperty,
} from '../game/rules';
import { PlacePhoto } from './PlacePhoto';
import { TokenIcon } from './GameTokens';
import {
  B_W_PLAYER_STYLES,
  getMarketClimate,
  getTilePerk,
} from '../game/heritagePerks';

interface GameBoardProps {
  room: GameRoomState;
  selectedTileIndex: number;
  onSelectTile: (index: number) => void;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onStartAuction: () => void;
  onUpgradeTile: (index: number) => void;
  onEndTurn: () => void;
  onOpenTradeModal: () => void;
  onOpenActionLog?: () => void;
  onOpenPropertiesModal?: () => void;
}

// 24 perimeter tiles clockwise around 7x7 CSS grid (row 1..7, col 1..7)
function getGridCoordinates(tileIndex: number): { row: number; col: number } {
  if (tileIndex >= 0 && tileIndex <= 6) {
    return { row: 1, col: tileIndex + 1 };
  }
  if (tileIndex >= 7 && tileIndex <= 12) {
    return { row: tileIndex - 5, col: 7 };
  }
  if (tileIndex >= 13 && tileIndex <= 18) {
    return { row: 7, col: 19 - tileIndex };
  }
  return { row: 25 - tileIndex, col: 1 };
}

// Minimalist Monochrome 3D Dice (Matte Charcoal with Crisp White Pips)
const MinimalistDie: React.FC<{ value: number }> = ({ value }) => {
  const renderPips = () => {
    switch (value) {
      case 1:
        return <circle cx="14" cy="14" r="2.8" fill="#FFFFFF" />;
      case 2:
        return (
          <>
            <circle cx="8" cy="8" r="2.4" fill="#FFFFFF" />
            <circle cx="20" cy="20" r="2.4" fill="#FFFFFF" />
          </>
        );
      case 3:
        return (
          <>
            <circle cx="7" cy="7" r="2.4" fill="#FFFFFF" />
            <circle cx="14" cy="14" r="2.4" fill="#FFFFFF" />
            <circle cx="21" cy="21" r="2.4" fill="#FFFFFF" />
          </>
        );
      case 4:
        return (
          <>
            <circle cx="8" cy="8" r="2.4" fill="#FFFFFF" />
            <circle cx="20" cy="8" r="2.4" fill="#FFFFFF" />
            <circle cx="8" cy="20" r="2.4" fill="#FFFFFF" />
            <circle cx="20" cy="20" r="2.4" fill="#FFFFFF" />
          </>
        );
      case 5:
        return (
          <>
            <circle cx="7" cy="7" r="2.2" fill="#FFFFFF" />
            <circle cx="21" cy="7" r="2.2" fill="#FFFFFF" />
            <circle cx="14" cy="14" r="2.4" fill="#FFFFFF" />
            <circle cx="7" cy="21" r="2.2" fill="#FFFFFF" />
            <circle cx="21" cy="21" r="2.2" fill="#FFFFFF" />
          </>
        );
      case 6:
      default:
        return (
          <>
            <circle cx="8" cy="7" r="2.1" fill="#FFFFFF" />
            <circle cx="20" cy="7" r="2.1" fill="#FFFFFF" />
            <circle cx="8" cy="14" r="2.1" fill="#FFFFFF" />
            <circle cx="20" cy="14" r="2.1" fill="#FFFFFF" />
            <circle cx="8" cy="21" r="2.1" fill="#FFFFFF" />
            <circle cx="20" cy="21" r="2.1" fill="#FFFFFF" />
          </>
        );
    }
  };

  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 28 28"
      className="shrink-0 rounded-lg bg-black border border-white/40 shadow-sm"
    >
      <rect x="1" y="1" width="26" height="26" rx="5" fill="#141414" stroke="#404040" strokeWidth="1" />
      {renderPips()}
    </svg>
  );
};

const formatRegion = (region: string): string => {
  switch (region) {
    case 'International':
      return 'Global';
    case 'United States':
      return 'USA';
    case 'United Kingdom':
      return 'UK';
    case 'Neutral Zone':
      return 'Neutral';
    case 'Global Ocean':
      return 'Ocean';
    case 'Global Sky':
      return 'Skyway';
    case 'India & Global':
      return 'Global';
    case 'Andaman & Nicobar':
      return 'Andaman';
    case 'Uttar Pradesh':
      return 'UP';
    case 'Madhya Pradesh':
      return 'MP';
    case 'West Bengal':
      return 'Bengal';
    case 'Tamil Nadu':
      return 'TN';
    case 'NCT Delhi':
      return 'Delhi';
    default:
      return region;
  }
};

export const GameBoard: React.FC<GameBoardProps> = ({
  room,
  selectedTileIndex,
  onSelectTile,
  onRollDice,
  onBuyProperty,
  onStartAuction,
  onUpgradeTile,
  onEndTurn,
  onOpenTradeModal,
  onOpenActionLog,
  onOpenPropertiesModal,
}) => {
  const [centerMobileTab, setCenterMobileTab] = useState<'dossier' | 'overview'>('dossier');

  const currentPlayer = room.players[room.currentTurnIndex] || room.players[0];
  const humanPlayer = room.players.find((p) => !p.isBot) || room.players[0];
  const currentTile = room.tiles[currentPlayer?.position || 0];
  const inspectedTile = room.tiles[selectedTileIndex] || currentTile;
  const inspectedOwner = room.players.find((p) => p.id === inspectedTile?.ownerId);
  const inspectedPerk = inspectedTile ? getTilePerk(inspectedTile) : null;
  const inspectedDensity = inspectedTile
    ? calculateTileOwnershipDensity(inspectedTile, room.tiles)
    : null;
  const buildCheck = inspectedTile
    ? canBuildOnProperty(humanPlayer, inspectedTile, room.tiles)
    : { allowed: false };

  const marketClimate = getMarketClimate(room.turnNumber);

  return (
    <div
      data-testid="monopoly-board-grid"
      className="w-full h-full flex items-center justify-center p-1 sm:p-2 lg:p-3 overflow-hidden select-none bg-[#0A0A0A] text-[#F5F5F5]"
    >
      {/* Symmetrical Minimalist Black & White Board */}
      <div className="w-full max-w-[min(98vw,calc(100vh-66px))] aspect-square grid grid-cols-7 grid-rows-7 gap-1 sm:gap-1.5 p-1.5 sm:p-2.5 rounded-xl bg-black border border-neutral-800 shadow-2xl relative">
        {/* Render 24 Perimeter Tiles with Real Monochrome Architectural Photos */}
        {room.tiles.map((tile) => {
          const { row, col } = getGridCoordinates(tile.index);
          const playersHere = room.players.filter((p) => !p.bankrupt && p.position === tile.index);
          const owner = room.players.find((p) => p.id === tile.ownerId);
          const isSelected = selectedTileIndex === tile.index;
          const isCurrentPos = currentPlayer?.position === tile.index;
          const isCorner = tile.index === 0 || tile.index === 6 || tile.index === 12 || tile.index === 18;

          const buttonInlineStyles: React.CSSProperties = {
            gridRow: row,
            gridColumn: col,
          };

          if (isCurrentPos && !isSelected) {
            buttonInlineStyles.borderColor = currentPlayer.color;
            buttonInlineStyles.boxShadow = `0 0 10px ${currentPlayer.color}60`;
          }

          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => onSelectTile(tile.index)}
              style={buttonInlineStyles}
              aria-label={`Tile ${tile.index}: ${tile.name} ${tile.stateOrCountry} ${tile.price > 0 ? `₹${tile.price}` : ''} ${owner ? `Owned by ${owner.name}` : ''}`}
              className={`relative flex flex-col justify-between p-1 rounded-lg text-left transition-all cursor-pointer border overflow-hidden group ${
                isSelected
                  ? 'border-white bg-[#1C1C1C] ring-2 ring-white z-30 scale-[1.02] shadow-xl'
                  : isCurrentPos
                    ? 'bg-[#141414] z-20'
                    : 'border-neutral-800/90 bg-[#0F0F0F] hover:border-neutral-600 hover:bg-[#161616] z-10'
              } ${isCorner ? 'bg-[#121212] border-neutral-700' : ''}`}
            >
              {/* Owner Left Accent Border */}
              {owner && (
                <div
                  className="absolute top-0 bottom-0 left-0 w-1 z-25 pointer-events-none"
                  style={{ backgroundColor: owner.color }}
                />
              )}

              {/* Top: Actual Real Landmark Photo of that PLACE */}
              <div className="relative w-full h-[38%] sm:h-[46%] rounded overflow-hidden bg-black border-b border-neutral-800/80">
                <PlacePhoto
                  tile={tile}
                  className="w-full h-full object-cover"
                />

                {/* Prominent Owner Color Stripe across the photo */}
                {owner && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 z-10"
                    style={{
                      backgroundColor: owner.color,
                      boxShadow: `0 1px 5px ${owner.color}`,
                    }}
                  />
                )}

                {/* Owner Token & Name Badge on top-left of photo */}
                {owner && (
                  <div
                    className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-black/95 px-1 py-0.5 rounded shadow border"
                    style={{
                      borderColor: owner.color,
                    }}
                    title={`Deed Owned by ${owner.name}`}
                  >
                    <TokenIcon tokenKey={owner.tokenKey} size={11} color={owner.color} />
                    <span
                      className="text-[7px] sm:text-[8px] font-mono font-black uppercase truncate max-w-[44px] leading-none"
                      style={{ color: owner.color }}
                    >
                      {owner.name.split(' ')[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Middle: Typography & Assigned Owner Indicator */}
              <div className="py-0.5 z-10 min-w-0 flex flex-col justify-center flex-1">
                <div className="flex items-center justify-between gap-0.5 leading-none mb-0.5">
                  <span className="text-[6.5px] sm:text-[7.5px] font-mono uppercase tracking-wider text-neutral-400 truncate">
                    {formatRegion(tile.stateOrCountry)}
                  </span>
                  {owner && (
                    <span
                      className="text-[7.5px] sm:text-[8px] font-mono font-bold px-1 rounded flex items-center gap-0.5 shrink-0"
                      style={{
                        color: owner.color,
                        backgroundColor: `${owner.color}20`,
                      }}
                    >
                      <TokenIcon tokenKey={owner.tokenKey} size={9} color={owner.color} />
                      <span>{owner.name.split(' ')[0]}</span>
                    </span>
                  )}
                </div>
                <div className="text-[7.5px] sm:text-[9px] md:text-[10px] font-bold text-white tracking-tight leading-[1.1] line-clamp-2 break-words">
                  {tile.city || tile.name}
                </div>
              </div>

              {/* Bottom: Monospace Price or Tile Action */}
              <div className="flex items-center justify-between w-full pt-0.5 border-t border-neutral-800 text-[7px] sm:text-[8.5px] font-mono z-10 leading-none">
                {tile.price > 0 ? (
                  <span className="font-semibold text-neutral-200">₹{tile.price.toLocaleString('en-IN')}</span>
                ) : (
                  <span className="text-neutral-400 font-medium uppercase">
                    {tile.type === 'go' ? '+₹2k' : tile.type === 'treasury' ? 'Kosh' : tile.type === 'jail' ? 'Rest' : tile.type}
                  </span>
                )}
                {tile.level > 0 && (
                  <span className="font-bold text-white">
                    ★{tile.level}
                  </span>
                )}
              </div>

              {/* Player Presence Marker (Assigned Color & Token Icon when landed) */}
              {playersHere.length > 0 && (
                <div className="absolute top-1 right-1 z-30 flex items-center gap-1 bg-black/95 p-0.5 rounded shadow-xl border border-neutral-700">
                  {playersHere.map((p) => {
                    const isTurnHere = p.id === currentPlayer?.id;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-transform ${
                          isTurnHere ? 'scale-105' : ''
                        }`}
                        style={{
                          backgroundColor: `${p.color}25`,
                          border: `1px solid ${p.color}`,
                          boxShadow: `0 0 6px ${p.color}80`,
                        }}
                        title={`${p.name} (${p.tokenKey}) landed on this tile`}
                      >
                        <TokenIcon tokenKey={p.tokenKey} size={13} color={p.color} />
                        <span
                          className="text-[7.5px] font-mono font-black uppercase leading-none"
                          style={{ color: p.color }}
                        >
                          {p.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}

        {/* Central 5x5 Command Center — Minimalist Swiss Modernist Arena */}
        <div
          style={{ gridRow: '2 / 7', gridColumn: '2 / 7' }}
          className="relative rounded-lg bg-[#0C0C0C] border border-neutral-800 p-1.5 sm:p-4 flex flex-col justify-between overflow-y-auto overflow-x-hidden shadow-2xl"
        >
          {/* Top Bar: Market Climate Index + Turn Status + Minimalist 3D Dice */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-neutral-800 pb-1.5 sm:pb-2 shrink-0">
            <div className="min-w-0 flex-1">
              {/* Global Market Volatility Index */}
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5 sm:mb-1">
                <span className="text-[8px] sm:text-[9.5px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-white text-black font-bold shrink-0">
                  {marketClimate.tag}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] text-neutral-300 font-mono hidden sm:inline">
                  {marketClimate.description}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5 sm:gap-2">
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded border shadow-xs"
                  style={{
                    borderColor: `${currentPlayer.color}80`,
                    backgroundColor: `${currentPlayer.color}18`,
                  }}
                >
                  <TokenIcon tokenKey={currentPlayer.tokenKey} size={15} color={currentPlayer.color} className="shrink-0" />
                  <span className="truncate font-black" style={{ color: currentPlayer.color }}>
                    {currentPlayer.name.toUpperCase()}
                  </span>
                </div>
                <span className="text-neutral-600 font-normal">|</span>
                <span className="font-mono text-neutral-200 shrink-0 font-bold">₹{Math.round(currentPlayer.cash).toLocaleString('en-IN')}</span>
                {currentPlayer.isBot && (
                  <span className="text-[8px] font-mono uppercase text-neutral-400 border border-neutral-700 px-1 py-0.2 rounded shrink-0">
                    BOT
                  </span>
                )}
              </div>
            </div>

            {/* Tactile B/W Dice Pair */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                aria-label={`Dice roll ${room.lastDice[0]} and ${room.lastDice[1]}`}
                className="flex items-center gap-1.5"
              >
                <MinimalistDie value={room.lastDice[0] || 4} />
                <MinimalistDie value={room.lastDice[1] || 3} />
              </div>
            </div>
          </div>

          {/* Mobile View Toggle */}
          <div className="flex md:hidden items-center justify-center gap-2 pt-1 shrink-0">
            <button
              type="button"
              onClick={() => setCenterMobileTab('dossier')}
              className={`px-2.5 py-0.5 rounded text-[9.5px] font-mono uppercase tracking-wider cursor-pointer ${
                centerMobileTab === 'dossier'
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 text-neutral-400'
              }`}
            >
              Place &amp; Actions
            </button>
            <button
              type="button"
              onClick={() => setCenterMobileTab('overview')}
              className={`px-2.5 py-0.5 rounded text-[9.5px] font-mono uppercase tracking-wider cursor-pointer ${
                centerMobileTab === 'overview'
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 text-neutral-400'
              }`}
            >
              Photo &amp; History
            </button>
          </div>

          {/* Center Stage: Real Architectural Photograph & Heritage Dossier */}
          <div className="my-auto grid grid-cols-1 md:grid-cols-12 gap-1.5 sm:gap-3.5 items-center py-0.5 sm:py-2">
            {/* Left 5 Cols: Large High-Res Architectural Photograph of Inspected Place */}
            <div
              className={`md:col-span-5 flex-col items-center justify-center ${
                centerMobileTab === 'overview' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div className="w-full max-w-[195px] sm:max-w-[210px] aspect-[4/3] rounded-lg overflow-hidden border border-white/20 shadow-md relative">
                <PlacePhoto
                  tile={inspectedTile}
                  className="w-full h-full object-cover"
                  showCaption={true}
                />
              </div>
              <div className="text-[9px] sm:text-[9.5px] font-mono tracking-wider text-neutral-400 mt-1 text-center">
                ARCHITECTURAL ARCHIVE · {inspectedTile.stateOrCountry.toUpperCase()}
              </div>
              <p className="block md:hidden text-[10px] text-neutral-300 text-center mt-1 px-1 line-clamp-3">
                {inspectedTile.historyNote}
              </p>
            </div>

            {/* Right 7 Cols: Detailed Place Information & Unique Heritage Perk */}
            <div
              className={`md:col-span-7 flex-col justify-between space-y-1 sm:space-y-1.5 md:pl-3 md:border-l md:border-neutral-800 ${
                centerMobileTab === 'dossier' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div>
                <div className="text-[9px] sm:text-[9.5px] font-mono uppercase tracking-widest text-neutral-400">
                  {inspectedTile.group} · {inspectedTile.stateOrCountry}
                </div>
                <h2 className="text-xs sm:text-base font-extrabold text-white tracking-tight leading-tight">
                  {inspectedTile.name}
                </h2>
                <p className="hidden md:block text-[11.5px] text-neutral-300 leading-relaxed mt-0.5 line-clamp-2">
                  {inspectedTile.historyNote}
                </p>

                {/* Unique Feature: Heritage Place Perk */}
                {inspectedPerk && (
                  <div className="mt-0.5 sm:mt-1.5 p-1 sm:p-1.5 rounded bg-neutral-900/90 border border-neutral-700/80">
                    <div className="text-[8px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider text-white">
                      HERITAGE PERK: {inspectedPerk.title}
                    </div>
                    <div className="text-[9px] sm:text-[10.5px] text-neutral-300 font-mono mt-0.5 line-clamp-1 sm:line-clamp-none">
                      {inspectedPerk.effect}
                    </div>
                  </div>
                )}

                {/* Financial Ledger Breakdown */}
                {inspectedTile.price > 0 && (
                  <div className="text-[9px] sm:text-[10.5px] font-mono text-neutral-300 pt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>Deed: <strong className="text-white">₹{inspectedTile.price.toLocaleString('en-IN')}</strong></span>
                    <span>Base Rent: <strong className="text-white">₹{inspectedTile.baseRent.toLocaleString('en-IN')}</strong></span>
                    <span>Palace: <strong className="text-white">₹{inspectedTile.rents[4].toLocaleString('en-IN')}</strong></span>
                    <span className="flex items-center gap-1">
                      <span className="text-neutral-400">Owner:</span>
                      {inspectedOwner ? (
                        <span
                          className="font-bold flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border leading-none"
                          style={{
                            color: inspectedOwner.color,
                            borderColor: `${inspectedOwner.color}80`,
                            backgroundColor: `${inspectedOwner.color}20`,
                          }}
                        >
                          <TokenIcon tokenKey={inspectedOwner.tokenKey} size={11} color={inspectedOwner.color} />
                          {inspectedOwner.name}
                        </span>
                      ) : (
                        <span className="text-neutral-500 font-medium">Unclaimed</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Master Minimalist Action Buttons — Crisp, High-Contrast & Unmistakable */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pt-0.5">
                {room.turnPhase === 'roll' && (
                  <button
                    type="button"
                    onClick={onRollDice}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-white hover:bg-neutral-200 text-black font-extrabold text-[11px] sm:text-xs tracking-wider uppercase transition-colors cursor-pointer shadow-md"
                  >
                    Roll Dice [Space]
                  </button>
                )}

                {room.turnPhase === 'action' && currentTile && !currentTile.ownerId && (
                  <>
                    <button
                      type="button"
                      disabled={currentPlayer.cash < currentTile.price}
                      onClick={onBuyProperty}
                      className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md bg-white hover:bg-neutral-200 disabled:opacity-30 text-black font-bold text-[10.5px] sm:text-xs tracking-wider uppercase transition-colors cursor-pointer"
                    >
                      Acquire Deed · ₹{currentTile.price.toLocaleString('en-IN')} [B]
                    </button>
                    <button
                      type="button"
                      onClick={onStartAuction}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-600 text-white font-medium text-[10.5px] sm:text-xs tracking-wider uppercase transition-colors cursor-pointer"
                    >
                      Auction [A]
                    </button>
                  </>
                )}

                {(room.turnPhase === 'end' || room.turnPhase === 'action') && (
                  <button
                    type="button"
                    onClick={onEndTurn}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-neutral-200 hover:bg-white text-black font-bold text-[10.5px] sm:text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    End Turn [E]
                  </button>
                )}

                {inspectedTile.ownerId === humanPlayer?.id && inspectedTile.type === 'property' && (
                  <button
                    type="button"
                    disabled={!buildCheck.allowed}
                    onClick={() => onUpgradeTile(inspectedTile.index)}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 border border-neutral-600 text-white text-[10.5px] sm:text-xs font-mono uppercase tracking-wider cursor-pointer"
                  >
                    Build Haveli (₹{inspectedTile.houseCost})
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenTradeModal}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10.5px] sm:text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  Trade [T]
                </button>

                {onOpenPropertiesModal && (
                  <button
                    type="button"
                    onClick={onOpenPropertiesModal}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10.5px] sm:text-xs font-mono uppercase tracking-wider cursor-pointer"
                  >
                    Properties [P]
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Chronicle Ticker & Direct Action Ledger Trigger */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 border-t border-neutral-800 pt-2 text-[9.5px] sm:text-[10.5px] font-mono">
            <div className="text-neutral-300 flex-1 min-w-0 line-clamp-2 leading-tight">
              {room.activeEventCard ? (
                <span className="text-white font-semibold">
                  <span className="text-amber-400 font-bold">[{room.activeEventCard.year}]</span> {room.activeEventCard.title}: {room.activeEventCard.description}
                </span>
              ) : (
                <span>{room.logs[0]?.text || 'Roll dice to commence match exploration.'}</span>
              )}
            </div>

            {onOpenActionLog && (
              <button
                type="button"
                onClick={onOpenActionLog}
                className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold uppercase tracking-wider cursor-pointer shrink-0 text-[9px] sm:text-[10px] whitespace-nowrap"
              >
                Ledger ({room.logs.length}) [L] →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
