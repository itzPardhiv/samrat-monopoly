import React, { useState } from 'react';
import { MapEdition } from '../game/boardData';
import { AVAILABLE_PLAYER_TOKENS, TokenIcon } from './GameTokens';

interface TitleScreenProps {
  edition: MapEdition;
  onSelectEdition: (ed: MapEdition) => void;
  roomId: string;
  onChangeRoomId: (id: string) => void;
  playerName: string;
  onChangePlayerName?: (name: string) => void;
  equippedToken: string;
  onSelectToken?: (token: string) => void;
  playerCount?: number;
  onChangePlayerCount?: (count: number) => void;
  mudraCoins: number;
  onStartGame: () => void;
  onOpenAuthModal: () => void;
  onOpenRules?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  edition,
  onSelectEdition,
  roomId,
  onChangeRoomId,
  playerName,
  onChangePlayerName,
  equippedToken,
  onSelectToken,
  playerCount = 3,
  onChangePlayerCount,
  mudraCoins,
  onStartGame,
  onOpenAuthModal,
  onOpenRules,
}) => {
  const [selectedTokenKey, setSelectedTokenKey] = useState<string>(equippedToken || 'elephant');
  const [inputName, setInputName] = useState<string>(playerName || 'Pardhiv Samrat');
  const [nameError, setNameError] = useState<string>('');

  const handleNameBlur = () => {
    const trimmed = inputName.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters.');
    } else {
      setNameError('');
      onChangePlayerName?.(trimmed);
    }
  };

  const handleTokenClick = (key: string) => {
    setSelectedTokenKey(key);
    onSelectToken?.(key);
  };

  const currentTokenObj = AVAILABLE_PLAYER_TOKENS.find((t) => t.key === selectedTokenKey) || AVAILABLE_PLAYER_TOKENS[0];

  return (
    <main className="relative w-screen h-screen overflow-y-auto bg-[#0A0A0A] text-[#F5F5F5] flex flex-col justify-between select-none font-sans">
      {/* Minimalist Architectural Blueprint Line Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20" aria-hidden="true">
        <svg viewBox="0 0 1440 900" className="w-full h-full stroke-white/20 fill-none" strokeWidth="1">
          {/* Architectural Elevation Grid Lines */}
          <line x1="0" y1="180" x2="1440" y2="180" strokeDasharray="4 4" />
          <line x1="0" y1="450" x2="1440" y2="450" strokeDasharray="4 4" />
          <line x1="0" y1="720" x2="1440" y2="720" strokeDasharray="4 4" />
          <line x1="360" y1="0" x2="360" y2="900" strokeDasharray="4 4" />
          <line x1="720" y1="0" x2="720" y2="900" strokeDasharray="4 4" />
          <line x1="1080" y1="0" x2="1080" y2="900" strokeDasharray="4 4" />

          {/* Stark Geometric Board Projection */}
          <g transform="translate(1080, 480)">
            <rect x="-180" y="-180" width="360" height="360" stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="-120" y="-120" width="240" height="240" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="60" stroke="#FFFFFF" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* Top Quiet Bar */}
      <header className="relative z-10 px-6 sm:px-12 py-4 flex items-center justify-between border-b border-neutral-900 shrink-0">
        <div className="text-xs font-mono tracking-widest uppercase text-neutral-400">
          EDITION 2026 · ARCHITECTURAL REAL ESTATE
        </div>
        <div className="flex items-center gap-4 text-xs font-mono uppercase">
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Rules &amp; Guide [H]
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            {playerName} ({mudraCoins} MUDRA) →
          </button>
        </div>
      </header>

      {/* Main Content: Stark Swiss Modernist Typography + Identity Setup */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-6 px-4 sm:px-10 lg:px-16">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand Hero Title */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              MINIMALIST MULTIPLAYER PROPERTY STRATEGY
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-white uppercase leading-none">
              SAMRAT<br />MONOPOLY.
            </h1>
            <p className="text-sm text-neutral-400 max-w-md leading-relaxed font-sans pt-1">
              Acquire authentic architectural landmarks across India and the World. Trade sovereign deeds, bid in live auctions, and build empires with photographic fidelity.
            </p>

            {/* Active Selected Player Identity Badge */}
            <div className="p-3.5 rounded-lg bg-black border border-neutral-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#181818] border border-neutral-700 flex items-center justify-center shrink-0">
                <TokenIcon tokenKey={selectedTokenKey} size={24} color="#FFFFFF" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{inputName || playerName}</div>
                <div className="text-[10.5px] font-mono text-neutral-400">
                  {currentTokenObj.label} · Sovereign Player
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Complete Interactive Setup Court */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-xl bg-[#111111] border border-neutral-800 space-y-4 shadow-2xl">
            {/* Territory Map Selector */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5">
                1. Select Territory Map
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectEdition('india')}
                  className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                    edition === 'india'
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-[#181818] border-neutral-800 text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  <div className="text-xs font-bold font-mono uppercase">Bharat Edition</div>
                  <div className={`text-[10px] truncate ${edition === 'india' ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    Jaipur, Agra, Mumbai, Delhi
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectEdition('world')}
                  className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                    edition === 'world'
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-[#181818] border-neutral-800 text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  <div className="text-xs font-bold font-mono uppercase">World Edition</div>
                  <div className={`text-[10px] truncate ${edition === 'world' ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    Tokyo, Paris, London, NYC
                  </div>
                </button>
              </div>
            </div>

            {/* Player Name & Room ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="player-name-input"
                  className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1"
                >
                  2. Sovereign Name
                </label>
                <input
                  id="player-name-input"
                  type="text"
                  maxLength={24}
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    onChangePlayerName?.(e.target.value);
                  }}
                  onBlur={handleNameBlur}
                  placeholder="Enter Player Name"
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
                />
                {nameError && (
                  <p className="text-[10px] text-red-400 mt-1 font-mono">{nameError}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="room-code-input"
                  className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1"
                >
                  Room ID
                </label>
                <input
                  id="room-code-input"
                  type="text"
                  value={roomId}
                  onChange={(e) => onChangeRoomId(e.target.value.toUpperCase())}
                  placeholder="BHARAT-108"
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            {/* Interactive Token Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  3. Select Player Token ({currentTokenObj.label})
                </label>
                <span className="text-[9.5px] font-mono text-neutral-500">
                  {currentTokenObj.desc}
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5">
                {AVAILABLE_PLAYER_TOKENS.map((token) => {
                  const isSelected = selectedTokenKey === token.key;
                  return (
                    <button
                      key={token.key}
                      type="button"
                      onClick={() => handleTokenClick(token.key)}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-sm ring-1 ring-white'
                          : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-[#161616]'
                      }`}
                      title={`${token.label}: ${token.desc}`}
                    >
                      <TokenIcon
                        tokenKey={token.key}
                        size={20}
                        color={isSelected ? '#000000' : '#FFFFFF'}
                      />
                      <span className="text-[9px] font-mono font-bold truncate max-w-full">
                        {token.key.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Competitors Count */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5">
                4. Match Competitors
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 2, label: '2 Players', desc: '1v1 Duel' },
                  { count: 3, label: '3 Players', desc: 'Standard (Default)' },
                  { count: 4, label: '4 Players', desc: 'Grand Quad' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => onChangePlayerCount?.(item.count)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      playerCount === item.count
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <div className="text-xs font-mono uppercase font-bold">{item.label}</div>
                    <div className={`text-[10px] ${playerCount === item.count ? 'text-neutral-700' : 'text-neutral-500'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Action */}
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartGame();
              }}
              className="w-full py-3.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-lg mt-2"
            >
              Enter Table ({edition === 'india' ? 'Bharat Map' : 'World Map'}) →
            </button>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="relative z-10 px-6 sm:px-12 py-3.5 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500 shrink-0">
        <span>SPACE ROLL · B BUY · A AUCTION · T TRADE · P PROPERTIES · L LEDGER</span>
        <span>ENCRYPTED AES-256-GCM REAL ESTATE STORAGE</span>
      </footer>
    </main>
  );
};
