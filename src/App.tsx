/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { MapEdition } from './game/boardData';
import {
  GameRoomState,
  calculatePlayerNetWorth,
  createInitialRoomState,
  executePropertyPurchase,
} from './game/rules';
import { TitleScreen } from './components/TitleScreen';
import { GameBoard } from './components/GameBoard';
import { TokenIcon } from './components/GameTokens';
import {
  ActionLogDrawer,
  AuctionModal,
  ChallengesAndStoreModal,
  ChatDrawer,
  ClientUserProfile,
  LeaderboardEntry,
  ProfileAndLeaderboardModal,
  PropertyLedgerModal,
  RulesAndGuideModal,
  StatusModal,
  TradeModal,
} from './components/ModalsAndDrawers';
import { soundFX } from './utils/sound';

type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

const DEFAULT_USER: ClientUserProfile = {
  id: 'usr_pardhiv',
  username: 'pardhiv_samrat',
  displayName: 'Pardhiv Samrat',
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
    rolls: 3,
    properties_bought: 2,
    auctions_won: 1,
    trades_completed: 1,
    rent_collected: 36000,
    landmarks_upgraded: 3,
  },
  paymentHistory: [],
  encryptionBadge: 'AES-256-GCM + Scrypt KDF Verified',
};

export default function App() {
  const [shellState, setShellState] = useState<ShellState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });

  const [edition, setEdition] = useState<MapEdition>('india');
  const [roomId, setRoomId] = useState<string>('BHARAT-108');
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [authToken, setAuthToken] = useState<string>('');
  const [user, setUser] = useState<ClientUserProfile>(DEFAULT_USER);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    {
      id: 'usr_pardhiv',
      displayName: 'Pardhiv Samrat',
      username: 'pardhiv_samrat',
      totalWealth: 160500,
      gamesWon: 9,
      citiesMonopolized: 27,
      mudraCoins: 640,
      equippedToken: 'elephant',
    },
    {
      id: 'usr_ananya',
      displayName: 'Ananya Deshmukh',
      username: 'ananya_mumbai',
      totalWealth: 132400,
      gamesWon: 7,
      citiesMonopolized: 21,
      mudraCoins: 520,
      equippedToken: 'peacock',
    },
    {
      id: 'usr_rohan',
      displayName: 'Rohan Krishnamurthy',
      username: 'rohan_bengaluru',
      totalWealth: 119800,
      gamesWon: 6,
      citiesMonopolized: 18,
      mudraCoins: 490,
      equippedToken: 'rocket',
    },
  ]);

  const [room, setRoom] = useState<GameRoomState>(() =>
    createInitialRoomState(
      'BHARAT-108',
      'india',
      { id: 'usr_pardhiv', name: 'Pardhiv Samrat', tokenKey: 'elephant' },
      true
    )
  );
  const [chatMessages, setChatMessages] = useState<
    { id: string; senderId: string; senderName: string; senderColor: string; text: string; timestamp: number }[]
  >([
    {
      id: 'chat_1',
      senderId: 'bot_ahilya',
      senderName: 'Rani Ahilya (AI)',
      senderColor: '#10B981',
      text: 'Namaste! Ready to bid for Jaipur and Varanasi deeds in Room BHARAT-108.',
      timestamp: Date.now() - 25000,
    },
  ]);

  const [selectedTileIndex, setSelectedTileIndex] = useState<number>(1);
  const [activeDrawer, setActiveDrawer] = useState<
    'none' | 'trade' | 'chat' | 'store' | 'profile' | 'log' | 'rules' | 'properties'
  >('none');
  const [muted, setMuted] = useState<boolean>(false);
  const [pushToast, setPushToast] = useState<{ title: string; body: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Sync shell state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  const fetchProfileAndLeaderboard = useCallback(async (token?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const [meRes, lbRes] = await Promise.all([
        fetch('/api/auth/me', { headers }),
        fetch('/api/leaderboard'),
      ]);
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.user) setUser(data.user);
      }
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        if (Array.isArray(lbData.leaderboard)) setLeaderboard(lbData.leaderboard);
      }
    } catch {
      // Keep resilient initial state
    }
  }, []);

  useEffect(() => {
    fetchProfileAndLeaderboard(authToken);
  }, [authToken, fetchProfileAndLeaderboard]);

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket?.send(
          JSON.stringify({
            type: 'room:join',
            roomId,
            playerId: user.id,
            playerName: user.displayName,
            tokenKey: user.equippedToken,
            edition,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room:state' && data.room) {
            setRoom(data.room);
            setEdition(data.room.edition);
            if (Array.isArray(data.chat)) {
              setChatMessages(data.chat);
            }
            if (data.room.status === 'gameover') {
              setShellState('gameover');
              soundFX.playVictory();
              try {
                confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
              } catch {
                // Ignore in headless environments
              }
            }
          } else if (data.type === 'notification:push' && data.notification) {
            setPushToast({
              title: data.notification.title,
              body: data.notification.body,
            });
            setTimeout(() => setPushToast(null), 4500);
          }
        } catch {
          // Ignore malformed WS packets
        }
      };

      socket.onclose = () => {
        reconnectTimer = setTimeout(connect, 2500);
      };
    }

    connect();
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [roomId]);

  const sendWsAction = useCallback(
    (payload: Record<string, unknown>) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            ...payload,
            roomId,
            playerId: user.id,
            playerName: user.displayName,
          })
        );
        return true;
      }
      return false;
    },
    [roomId, user.id, user.displayName]
  );

  const handleStartGame = useCallback(() => {
    document.body.dataset.state = 'playing';
    setShellState('playing');
    setRoom(
      createInitialRoomState(
        roomId,
        edition,
        { id: user.id, name: user.displayName, tokenKey: user.equippedToken },
        true,
        playerCount
      )
    );
    sendWsAction({
      type: 'room:join',
      edition,
      tokenKey: user.equippedToken,
      playerName: user.displayName,
      playerCount,
    });
  }, [edition, playerCount, roomId, sendWsAction, user.displayName, user.equippedToken, user.id]);

  const handleSwitchEdition = useCallback(
    (newEd: MapEdition) => {
      setEdition(newEd);
      if (!sendWsAction({ type: 'game:switch_edition', edition: newEd })) {
        setRoom(
          createInitialRoomState(
            roomId,
            newEd,
            { id: user.id, name: user.displayName, tokenKey: user.equippedToken },
            true,
            playerCount
          )
        );
      }
    },
    [playerCount, roomId, sendWsAction, user.displayName, user.equippedToken, user.id]
  );

  const handleRollDice = useCallback(() => {
    soundFX.playDiceRoll();
    if (!sendWsAction({ type: 'game:roll' })) {
      // Fallback local roll if WS still connecting
      setRoom((prev) => {
        const copy: GameRoomState = JSON.parse(JSON.stringify(prev));
        const p = copy.players[copy.currentTurnIndex];
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        copy.lastDice = [d1, d2];
        p.position = (p.position + d1 + d2) % copy.tiles.length;
        copy.turnPhase = 'action';
        return copy;
      });
    }
    setTimeout(() => fetchProfileAndLeaderboard(authToken), 350);
  }, [authToken, fetchProfileAndLeaderboard, sendWsAction]);

  const handleBuyProperty = useCallback(() => {
    soundFX.playBuyDeed();
    if (!sendWsAction({ type: 'game:buy' })) {
      setRoom((prev) => {
        const copy: GameRoomState = JSON.parse(JSON.stringify(prev));
        const p = copy.players[copy.currentTurnIndex];
        executePropertyPurchase(copy, p.id, p.position);
        return copy;
      });
    }
    setTimeout(() => fetchProfileAndLeaderboard(authToken), 350);
  }, [authToken, fetchProfileAndLeaderboard, sendWsAction]);

  const handleStartAuction = useCallback(() => {
    soundFX.playAuctionBid();
    sendWsAction({ type: 'game:start_auction' });
  }, [sendWsAction]);

  const handleAuctionBid = useCallback(
    (amount: number) => {
      soundFX.playAuctionBid();
      sendWsAction({ type: 'game:auction_bid', amount });
    },
    [sendWsAction]
  );

  const handleAuctionFinalize = useCallback(() => {
    soundFX.playBuyDeed();
    sendWsAction({ type: 'game:auction_finalize' });
    setTimeout(() => fetchProfileAndLeaderboard(authToken), 350);
  }, [authToken, fetchProfileAndLeaderboard, sendWsAction]);

  const handleUpgradeTile = useCallback(
    (tileIndex: number) => {
      soundFX.playBuyDeed();
      sendWsAction({ type: 'game:upgrade_tile', tileIndex });
      setTimeout(() => fetchProfileAndLeaderboard(authToken), 350);
    },
    [authToken, fetchProfileAndLeaderboard, sendWsAction]
  );

  const handleEndTurn = useCallback(() => {
    sendWsAction({ type: 'game:end_turn' });
  }, [sendWsAction]);

  const handleRestartGame = useCallback(() => {
    setShellState('playing');
    sendWsAction({ type: 'game:restart' });
  }, [sendWsAction]);

  // Global Keyboard Shortcuts (Title + Playing)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (shellState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (activeDrawer !== 'none') {
          setActiveDrawer('none');
        } else {
          setShellState((s) => (s === 'paused' ? 'playing' : 'paused'));
        }
        return;
      }

      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setActiveDrawer((d) => (d === 'properties' ? 'none' : 'properties'));
        return;
      }

      if (shellState !== 'playing') return;

      if (e.key === ' ' && room.turnPhase === 'roll') {
        e.preventDefault();
        handleRollDice();
      } else if (e.key.toLowerCase() === 'b' && room.turnPhase === 'action') {
        e.preventDefault();
        handleBuyProperty();
      } else if (e.key.toLowerCase() === 'a' && room.turnPhase === 'action') {
        e.preventDefault();
        handleStartAuction();
      } else if (e.key.toLowerCase() === 'e' && (room.turnPhase === 'end' || room.turnPhase === 'action')) {
        e.preventDefault();
        handleEndTurn();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveDrawer((d) => (d === 'trade' ? 'none' : 'trade'));
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setActiveDrawer((d) => (d === 'chat' ? 'none' : 'chat'));
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setActiveDrawer((d) => (d === 'log' ? 'none' : 'log'));
      } else if (e.key.toLowerCase() === 'h' || e.key === '?') {
        e.preventDefault();
        setActiveDrawer((d) => (d === 'rules' ? 'none' : 'rules'));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setMuted((m) => {
          soundFX.muted = !m;
          return !m;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeDrawer,
    handleBuyProperty,
    handleEndTurn,
    handleRollDice,
    handleStartAuction,
    handleStartGame,
    room.turnPhase,
    shellState,
  ]);

  // Keep selected tile synced to current player position when they move
  const currentPlayer = room.players[room.currentTurnIndex] || room.players[0];
  useEffect(() => {
    if (currentPlayer) {
      setSelectedTileIndex(currentPlayer.position);
    }
  }, [currentPlayer?.position]);

  if (shellState === 'title') {
    return (
      <>
        <TitleScreen
          edition={edition}
          onSelectEdition={handleSwitchEdition}
          roomId={roomId}
          onChangeRoomId={setRoomId}
          playerName={user.displayName}
          onChangePlayerName={(name) => {
            setUser((u) => ({ ...u, displayName: name }));
            setRoom((r) => {
              const updated = [...r.players];
              if (updated[0] && !updated[0].isBot) {
                updated[0] = { ...updated[0], name };
              }
              return { ...r, players: updated };
            });
          }}
          equippedToken={user.equippedToken}
          onSelectToken={(tokenKey) => {
            setUser((u) => ({ ...u, equippedToken: tokenKey }));
            setRoom((r) => {
              const updated = [...r.players];
              if (updated[0] && !updated[0].isBot) {
                updated[0] = { ...updated[0], tokenKey };
              }
              return { ...r, players: updated };
            });
          }}
          playerCount={playerCount}
          onChangePlayerCount={setPlayerCount}
          mudraCoins={user.mudraCoins}
          onStartGame={handleStartGame}
          onOpenAuthModal={() => setActiveDrawer('profile')}
          onOpenRules={() => setActiveDrawer('rules')}
        />
        {activeDrawer === 'rules' && (
          <RulesAndGuideModal onClose={() => setActiveDrawer('none')} />
        )}
        {activeDrawer === 'profile' && (
          <ProfileAndLeaderboardModal
            user={user}
            leaderboard={leaderboard}
            onLogin={async (username, password) => {
              const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
              });
              if (res.ok) {
                const d = await res.json();
                setAuthToken(d.token);
                setUser(d.user);
              }
            }}
            onRegister={async (username, displayName, password) => {
              const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, displayName, password }),
              });
              if (res.ok) {
                const d = await res.json();
                setAuthToken(d.token);
                setUser(d.user);
              }
            }}
            onToggleNotifications={async (enabled) => {
              const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pushNotificationsEnabled: enabled }),
              });
              if (res.ok) {
                const d = await res.json();
                setUser(d.user);
              }
            }}
            onClose={() => setActiveDrawer('none')}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0A0A] text-[#F5F5F5] flex flex-col justify-between select-none font-sans">
      {/* Real-Time Push Notification Toast */}
      {pushToast && (
        <div
          role="status"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#141E36] border border-amber-400/70 shadow-2xl flex items-center gap-3"
        >
          <span className="text-xs font-bold text-amber-300">{pushToast.title}:</span>
          <span className="text-xs text-slate-200">{pushToast.body}</span>
        </div>
      )}

      {/* Unified Top Perimeter HUD Dock — Minimalist Swiss Black & White */}
      <section
        aria-label="Game HUD Dock"
        className="w-full px-3 sm:px-6 h-11 bg-[#0A0A0A] border-b border-neutral-800 flex items-center justify-between gap-3 overflow-x-auto shrink-0 select-none font-mono"
      >
        {/* Left Cluster: Brand + Minimalist Atlas Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="font-bold text-xs tracking-widest text-white uppercase whitespace-nowrap">
            SAMRAT MONOPOLY
          </div>
          <div className="flex items-center bg-[#141414] border border-neutral-800 p-0.5 rounded">
            <button
              type="button"
              onClick={() => handleSwitchEdition('india')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer whitespace-nowrap ${
                room.edition === 'india'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              India
            </button>
            <button
              type="button"
              onClick={() => handleSwitchEdition('world')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer whitespace-nowrap ${
                room.edition === 'world'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              World
            </button>
          </div>
        </div>

        {/* Center Cluster: Clean Color-Coded Player Identifiers with Unique Icons */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full text-xs py-0.5">
          {room.players.map((p, idx) => {
            const isTurn = idx === room.currentTurnIndex;
            const deedsCount = room.tiles.filter((t) => t.ownerId === p.id).length;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all shrink-0 border ${
                  isTurn ? 'ring-1 shadow-xs font-bold' : 'opacity-75 hover:opacity-100'
                }`}
                style={{
                  borderColor: isTurn ? p.color : 'rgba(255,255,255,0.1)',
                  backgroundColor: isTurn ? `${p.color}22` : '#121212',
                  boxShadow: isTurn ? `0 0 10px ${p.color}40` : 'none',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
                  style={{
                    borderColor: p.color,
                    backgroundColor: `${p.color}25`,
                  }}
                  title={`${p.name} · ${p.tokenKey}`}
                >
                  <TokenIcon tokenKey={p.tokenKey} size={12} color={p.color} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-sans font-bold whitespace-nowrap text-[11px]"
                    style={{ color: p.color }}
                  >
                    {p.name.split(' ')[0]}
                  </span>
                  <span className="font-mono font-bold text-white whitespace-nowrap text-[11px]">
                    ₹{Math.round(p.cash).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                    [{deedsCount}d]
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Cluster: Clean Text Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-[11px] font-mono uppercase">
          <button
            type="button"
            onClick={() => setActiveDrawer((d) => (d === 'properties' ? 'none' : 'properties'))}
            className={`cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeDrawer === 'properties' ? 'text-white font-bold underline' : 'text-neutral-300 hover:text-white'
            }`}
            title="Open Property Ledger & Ownership Directory [P]"
          >
            <span>Properties [P]</span>
          </button>
          <span className="text-neutral-700" aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setActiveDrawer('store')}
            className="text-neutral-300 hover:text-white cursor-pointer whitespace-nowrap"
          >
            {user.mudraCoins} Mudra
          </button>
          <span className="text-neutral-700" aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setActiveDrawer('profile')}
            className="text-neutral-300 hover:text-white cursor-pointer whitespace-nowrap"
          >
            Profile
          </button>
          <span className="text-neutral-700" aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setActiveDrawer((d) => (d === 'chat' ? 'none' : 'chat'))}
            className="text-neutral-300 hover:text-white cursor-pointer whitespace-nowrap"
          >
            Chat ({chatMessages.length})
          </button>
          <span className="text-neutral-700" aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setActiveDrawer((d) => (d === 'log' ? 'none' : 'log'))}
            className={`cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeDrawer === 'log' ? 'text-white font-bold underline' : 'text-neutral-300 hover:text-white'
            }`}
            title="Open Match Ledger [L]"
          >
            <span>Ledger</span>
            <span className="text-[10px] text-neutral-400">
              ({room.logs.length})
            </span>
          </button>
          <span className="text-neutral-700" aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setActiveDrawer((d) => (d === 'rules' ? 'none' : 'rules'))}
            className={`cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeDrawer === 'rules' ? 'text-white font-bold underline' : 'text-neutral-300 hover:text-white'
            }`}
            title="Strategic Rulebook & Perks [H]"
          >
            <span>Rules [H]</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            onClick={(e) => {
              e.currentTarget.blur();
              setMuted((m) => {
                soundFX.muted = !m;
                return !m;
              });
            }}
            className="w-7 h-7 rounded bg-[#141414] hover:bg-[#202020] border border-neutral-800 flex items-center justify-center text-neutral-300 cursor-pointer shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {muted ? (
                <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
              ) : (
                <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              )}
            </svg>
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game [Esc]"
            onClick={(e) => {
              e.currentTarget.blur();
              setShellState('paused');
            }}
            className="w-7 h-7 rounded bg-[#141414] hover:bg-[#202020] border border-neutral-800 flex items-center justify-center text-neutral-300 cursor-pointer shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>
      </section>

      {/* Main Playfield (>85% Viewport Dedicated to the 24-Tile Board) */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
        <GameBoard
          room={room}
          selectedTileIndex={selectedTileIndex}
          onSelectTile={setSelectedTileIndex}
          onRollDice={handleRollDice}
          onBuyProperty={handleBuyProperty}
          onStartAuction={handleStartAuction}
          onUpgradeTile={handleUpgradeTile}
          onEndTurn={handleEndTurn}
          onOpenTradeModal={() => setActiveDrawer('trade')}
          onOpenActionLog={() => setActiveDrawer('log')}
          onOpenPropertiesModal={() => setActiveDrawer('properties')}
        />
      </main>

      {/* Active Modals & Drawers */}
      <AuctionModal
        room={room}
        onBid={handleAuctionBid}
        onFinalize={handleAuctionFinalize}
      />

      {activeDrawer === 'properties' && (
        <PropertyLedgerModal
          room={room}
          onClose={() => setActiveDrawer('none')}
          onSelectTile={(tileIdx) => {
            setSelectedTileIndex(tileIdx);
            setActiveDrawer('none');
          }}
          onOpenTradeWithPartner={() => {
            setActiveDrawer('trade');
          }}
          onUpgradeTile={(tileIdx) => {
            handleUpgradeTile(tileIdx);
          }}
        />
      )}

      {activeDrawer === 'trade' && (
        <TradeModal
          room={room}
          onClose={() => setActiveDrawer('none')}
          onProposeTrade={(offer) => {
            soundFX.playBuyDeed();
            sendWsAction({
              type: 'game:propose_trade',
              ...offer,
            });
            setTimeout(() => fetchProfileAndLeaderboard(authToken), 350);
          }}
        />
      )}

      {activeDrawer === 'chat' && (
        <ChatDrawer
          roomId={room.roomId}
          messages={chatMessages}
          onSendMessage={(text) => {
            if (!sendWsAction({ type: 'chat:send', text })) {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `local_${Date.now()}`,
                  senderId: user.id,
                  senderName: user.displayName,
                  senderColor: '#F59E0B',
                  text,
                  timestamp: Date.now(),
                },
              ]);
            }
          }}
          onClose={() => setActiveDrawer('none')}
        />
      )}

      {activeDrawer === 'log' && (
        <ActionLogDrawer
          room={room}
          onClose={() => setActiveDrawer('none')}
        />
      )}

      {activeDrawer === 'store' && (
        <ChallengesAndStoreModal
          user={user}
          onClaimChallenge={async (challengeId) => {
            const res = await fetch('/api/challenges/claim', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify({ challengeId }),
            });
            if (res.ok) {
              const d = await res.json();
              if (d.user) setUser(d.user);
              soundFX.playVictory();
            }
          }}
          onPurchaseCosmetic={async (itemId, paymentMode, paymentMethod) => {
            const res = await fetch('/api/store/purchase', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify({ itemId, paymentMode, paymentMethod }),
            });
            if (res.ok) {
              const d = await res.json();
              if (d.user) {
                setUser(d.user);
                sendWsAction({
                  type: 'room:join',
                  tokenKey: d.user.equippedToken,
                });
              }
              soundFX.playBuyDeed();
            }
          }}
          onClose={() => setActiveDrawer('none')}
        />
      )}

      {activeDrawer === 'profile' && (
        <ProfileAndLeaderboardModal
          user={user}
          leaderboard={leaderboard}
          onLogin={async (username, password) => {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
              const d = await res.json();
              setAuthToken(d.token);
              setUser(d.user);
            }
          }}
          onRegister={async (username, displayName, password) => {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, displayName, password }),
            });
            if (res.ok) {
              const d = await res.json();
              setAuthToken(d.token);
              setUser(d.user);
            }
          }}
          onToggleNotifications={async (enabled) => {
            const res = await fetch('/api/profile/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pushNotificationsEnabled: enabled }),
            });
            if (res.ok) {
              const d = await res.json();
              setUser(d.user);
            }
          }}
          onClose={() => setActiveDrawer('none')}
        />
      )}

      {activeDrawer === 'rules' && (
        <RulesAndGuideModal onClose={() => setActiveDrawer('none')} />
      )}

      {(shellState === 'paused' || shellState === 'gameover') && (
        <StatusModal
          mode={shellState}
          room={room}
          onResume={() => setShellState('playing')}
          onRestart={handleRestartGame}
          onOpenRules={() => setActiveDrawer('rules')}
          onSwitchEdition={(ed) => {
            handleSwitchEdition(ed);
            setShellState('playing');
          }}
          onReturnTitle={() => setShellState('title')}
        />
      )}
    </div>
  );
}
