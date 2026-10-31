import React from 'react';
import { BoardTile, MapEdition } from '../game/boardData';
import { PlayerState } from '../game/rules';

/**
 * 16-bit Crisp Pixel Art Flag for countries and regions.
 * Rendered using SVG shape-rendering="crispEdges".
 */
export const PixelCountryFlag: React.FC<{
  countryOrState: string;
  width?: number;
  height?: number;
  className?: string;
}> = ({ countryOrState, width = 20, height = 14, className = '' }) => {
  const norm = countryOrState.trim().toLowerCase();

  const renderFlagPixels = () => {
    if (
      norm.includes('india') ||
      norm.includes('rajasthan') ||
      norm.includes('uttar pradesh') ||
      norm.includes('maharashtra') ||
      norm.includes('punjab') ||
      norm.includes('kerala') ||
      norm.includes('andhra') ||
      norm.includes('goa') ||
      norm.includes('tamil') ||
      norm.includes('bengal') ||
      norm.includes('telangana') ||
      norm.includes('karnataka') ||
      norm.includes('gujarat') ||
      norm.includes('delhi') ||
      norm.includes('andaman')
    ) {
      // Tiranga: Saffron, White with Ashoka Chakra, Green
      return (
        <g>
          <rect x="0" y="0" width="16" height="4" fill="#FF9933" />
          <rect x="0" y="4" width="16" height="4" fill="#FFFFFF" />
          <rect x="0" y="8" width="16" height="4" fill="#138808" />
          <rect x="7" y="5" width="2" height="2" fill="#000080" />
        </g>
      );
    }
    if (norm.includes('japan')) {
      // White field with Rising Sun
      return (
        <g>
          <rect x="0" y="0" width="16" height="12" fill="#FFFFFF" />
          <rect x="6" y="3" width="4" height="6" fill="#DC2626" />
          <rect x="5" y="4" width="6" height="4" fill="#DC2626" />
        </g>
      );
    }
    if (norm.includes('france')) {
      // Blue, White, Red vertical tricolor
      return (
        <g>
          <rect x="0" y="0" width="5" height="12" fill="#1E3A8A" />
          <rect x="5" y="0" width="6" height="12" fill="#FFFFFF" />
          <rect x="11" y="0" width="5" height="12" fill="#EF4444" />
        </g>
      );
    }
    if (norm.includes('italy')) {
      // Green, White, Red vertical tricolor
      return (
        <g>
          <rect x="0" y="0" width="5" height="12" fill="#15803D" />
          <rect x="5" y="0" width="6" height="12" fill="#FFFFFF" />
          <rect x="11" y="0" width="5" height="12" fill="#DC2626" />
        </g>
      );
    }
    if (norm.includes('egypt')) {
      // Red, White with Golden Eagle, Black
      return (
        <g>
          <rect x="0" y="0" width="16" height="4" fill="#DC2626" />
          <rect x="0" y="4" width="16" height="4" fill="#FFFFFF" />
          <rect x="0" y="8" width="16" height="4" fill="#0F172A" />
          <rect x="7" y="5" width="2" height="2" fill="#F59E0B" />
        </g>
      );
    }
    if (norm.includes('greece')) {
      // Greek Blue and White stripes + canton cross
      return (
        <g>
          <rect x="0" y="0" width="16" height="12" fill="#0284C7" />
          <rect x="0" y="2" width="16" height="2" fill="#FFFFFF" />
          <rect x="0" y="6" width="16" height="2" fill="#FFFFFF" />
          <rect x="0" y="10" width="16" height="2" fill="#FFFFFF" />
          <rect x="0" y="0" width="7" height="6" fill="#0284C7" />
          <rect x="2" y="0" width="2" height="6" fill="#FFFFFF" />
          <rect x="0" y="2" width="6" height="2" fill="#FFFFFF" />
        </g>
      );
    }
    if (norm.includes('united kingdom') || norm.includes('uk')) {
      // Union Jack
      return (
        <g>
          <rect x="0" y="0" width="16" height="12" fill="#1E3A8A" />
          <line x1="0" y1="0" x2="16" y2="12" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="16" y1="0" x2="0" y2="12" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="0" y1="0" x2="16" y2="12" stroke="#DC2626" strokeWidth="1" />
          <line x1="16" y1="0" x2="0" y2="12" stroke="#DC2626" strokeWidth="1" />
          <rect x="6" y="0" width="4" height="12" fill="#FFFFFF" />
          <rect x="0" y="4" width="16" height="4" fill="#FFFFFF" />
          <rect x="7" y="0" width="2" height="12" fill="#DC2626" />
          <rect x="0" y="5" width="16" height="2" fill="#DC2626" />
        </g>
      );
    }
    if (norm.includes('united states') || norm.includes('usa')) {
      // Stars & Stripes
      return (
        <g>
          <rect x="0" y="0" width="16" height="12" fill="#DC2626" />
          <rect x="0" y="2" width="16" height="2" fill="#FFFFFF" />
          <rect x="0" y="5" width="16" height="2" fill="#FFFFFF" />
          <rect x="0" y="8" width="16" height="2" fill="#FFFFFF" />
          <rect x="0" y="11" width="16" height="1" fill="#FFFFFF" />
          <rect x="0" y="0" width="7" height="6" fill="#1E3A8A" />
          <rect x="2" y="2" width="2" height="2" fill="#FFFFFF" />
        </g>
      );
    }
    if (norm.includes('uae')) {
      // UAE flag
      return (
        <g>
          <rect x="0" y="0" width="16" height="4" fill="#16A34A" />
          <rect x="0" y="4" width="16" height="4" fill="#FFFFFF" />
          <rect x="0" y="8" width="16" height="4" fill="#0F172A" />
          <rect x="0" y="0" width="5" height="12" fill="#DC2626" />
        </g>
      );
    }
    if (norm.includes('singapore')) {
      // Singapore red over white with crescent/stars
      return (
        <g>
          <rect x="0" y="0" width="16" height="6" fill="#DC2626" />
          <rect x="0" y="6" width="16" height="6" fill="#FFFFFF" />
          <rect x="2" y="2" width="2" height="2" fill="#FFFFFF" />
        </g>
      );
    }
    if (norm.includes('australia')) {
      // Australia: Navy with Union Jack canton and stars
      return (
        <g>
          <rect x="0" y="0" width="16" height="12" fill="#1E3A8A" />
          <rect x="0" y="0" width="7" height="6" fill="#EF4444" />
          <rect x="11" y="2" width="2" height="2" fill="#FFFFFF" />
          <rect x="12" y="7" width="2" height="2" fill="#FFFFFF" />
          <rect x="9" y="8" width="1" height="1" fill="#FFFFFF" />
        </g>
      );
    }

    // Default Gold Sovereign Standard
    return (
      <g>
        <rect x="0" y="0" width="16" height="12" fill="#D97706" />
        <rect x="5" y="3" width="6" height="6" fill="#FBBF24" />
      </g>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 12"
      shapeRendering="crispEdges"
      className={`rounded-xs border border-white/20 shrink-0 shadow-xs ${className}`}
      aria-label={`Flag of ${countryOrState}`}
    >
      {renderFlagPixels()}
    </svg>
  );
};

/**
 * 16-bit Crisp Pixel Art Landmark Sprite.
 * High-detail, iconic representation on 16x16 grid with crisp edges.
 */
export const PixelLandmarkSprite: React.FC<{
  tile: BoardTile;
  size?: number;
  className?: string;
}> = ({ tile, size = 26, className = '' }) => {
  const id = tile.id.toLowerCase();
  const stateOrCountry = (tile.stateOrCountry || '').toLowerCase();

  const renderMonuments = () => {
    // 1. Taj Mahal (Agra)
    if (id.includes('agra') || id.includes('taj')) {
      return (
        <g fill="#F8FAFC">
          {/* Main Dome */}
          <rect x="7" y="2" width="2" height="2" fill="#FDE68A" />
          <rect x="6" y="4" width="4" height="3" fill="#FFFFFF" />
          <rect x="5" y="7" width="6" height="2" fill="#FFFFFF" />
          {/* Central Arch */}
          <rect x="4" y="9" width="8" height="6" fill="#F1F5F9" />
          <rect x="6" y="10" width="4" height="5" fill="#0F172A" />
          {/* Minarets */}
          <rect x="2" y="5" width="1" height="10" fill="#E2E8F0" />
          <rect x="1" y="4" width="3" height="1" fill="#FDE68A" />
          <rect x="13" y="5" width="1" height="10" fill="#E2E8F0" />
          <rect x="12" y="4" width="3" height="1" fill="#FDE68A" />
        </g>
      );
    }

    // 2. Hawa Mahal / Amber Fort (Jaipur / Udaipur)
    if (id.includes('jaipur') || id.includes('udaipur')) {
      return (
        <g fill="#F472B6">
          <rect x="7" y="2" width="2" height="2" fill="#FBBF24" />
          <rect x="6" y="4" width="4" height="2" fill="#FB7185" />
          <rect x="4" y="6" width="8" height="2" fill="#F43F5E" />
          <rect x="3" y="8" width="10" height="3" fill="#E11D48" />
          <rect x="2" y="11" width="12" height="4" fill="#BE123C" />
          {/* Windows / Jharokhas */}
          <rect x="5" y="9" width="1" height="1" fill="#FDE68A" />
          <rect x="8" y="9" width="1" height="1" fill="#FDE68A" />
          <rect x="10" y="9" width="1" height="1" fill="#FDE68A" />
          <rect x="7" y="12" width="2" height="3" fill="#0F172A" />
        </g>
      );
    }

    // 3. Gateway of India / CSMT (Mumbai)
    if (id.includes('mumbai') || id.includes('csmt')) {
      return (
        <g fill="#F59E0B">
          <rect x="3" y="4" width="10" height="2" fill="#FDE68A" />
          <rect x="2" y="6" width="12" height="9" fill="#D97706" />
          <rect x="5" y="8" width="6" height="7" fill="#0F172A" />
          <rect x="6" y="7" width="4" height="1" fill="#0F172A" />
          <rect x="3" y="2" width="2" height="2" fill="#FDE68A" />
          <rect x="11" y="2" width="2" height="2" fill="#FDE68A" />
        </g>
      );
    }

    // 4. Red Fort / Qutub Minar (Delhi)
    if (id.includes('delhi')) {
      return (
        <g fill="#EF4444">
          <rect x="3" y="3" width="2" height="2" fill="#FDE68A" />
          <rect x="11" y="3" width="2" height="2" fill="#FDE68A" />
          <rect x="2" y="5" width="12" height="10" fill="#B91C1C" />
          <rect x="5" y="9" width="6" height="6" fill="#0F172A" />
          <rect x="7" y="1" width="2" height="4" fill="#FDE68A" />
        </g>
      );
    }

    // 5. Golden Temple (Amritsar)
    if (id.includes('amritsar')) {
      return (
        <g fill="#FBBF24">
          <rect x="7" y="3" width="2" height="2" fill="#FEF08A" />
          <rect x="5" y="5" width="6" height="3" fill="#F59E0B" />
          <rect x="4" y="8" width="8" height="5" fill="#D97706" />
          <rect x="6" y="10" width="4" height="3" fill="#0F172A" />
          {/* Sacred Sarovar reflection */}
          <rect x="2" y="13" width="12" height="2" fill="#38BDF8" />
        </g>
      );
    }

    // 6. Charminar (Hyderabad)
    if (id.includes('hyderabad')) {
      return (
        <g fill="#A78BFA">
          {/* 4 Minarets */}
          <rect x="2" y="2" width="2" height="13" fill="#DDD6FE" />
          <rect x="12" y="2" width="2" height="13" fill="#DDD6FE" />
          <rect x="2" y="1" width="2" height="1" fill="#FDE68A" />
          <rect x="12" y="1" width="2" height="1" fill="#FDE68A" />
          {/* Central Arch */}
          <rect x="4" y="6" width="8" height="9" fill="#8B5CF6" />
          <rect x="6" y="9" width="4" height="6" fill="#0F172A" />
        </g>
      );
    }

    // 7. Tokyo / Shinjuku / Kyoto (Japan)
    if (stateOrCountry.includes('japan') || id.includes('tokyo') || id.includes('kyoto')) {
      // Vermilion Torii Gate + Pagoda Roof
      return (
        <g fill="#EF4444">
          <rect x="1" y="3" width="14" height="2" fill="#DC2626" />
          <rect x="3" y="5" width="10" height="1" fill="#DC2626" />
          <rect x="4" y="5" width="2" height="10" fill="#991B1B" />
          <rect x="10" y="5" width="2" height="10" fill="#991B1B" />
          <rect x="7" y="1" width="2" height="2" fill="#FDE68A" />
        </g>
      );
    }

    // 8. Cairo / Alexandria / Pyramids (Egypt)
    if (stateOrCountry.includes('egypt') || id.includes('cairo') || id.includes('alexandria')) {
      // Great Pyramid of Giza
      return (
        <g fill="#F59E0B">
          <rect x="7" y="4" width="2" height="1" fill="#FEF08A" />
          <rect x="6" y="5" width="4" height="2" fill="#FBBF24" />
          <rect x="5" y="7" width="6" height="2" fill="#F59E0B" />
          <rect x="4" y="9" width="8" height="2" fill="#D97706" />
          <rect x="3" y="11" width="10" height="2" fill="#B45309" />
          <rect x="2" y="13" width="12" height="2" fill="#92400E" />
          {/* Pyramid shadow side */}
          <rect x="8" y="7" width="3" height="8" fill="#78350F" opacity="0.45" />
        </g>
      );
    }

    // 9. Rome (Italy) - Colosseum
    if (stateOrCountry.includes('italy') || id.includes('rome')) {
      return (
        <g fill="#F97316">
          <rect x="3" y="5" width="10" height="2" fill="#FDBA74" />
          <rect x="2" y="7" width="12" height="8" fill="#EA580C" />
          {/* Arches */}
          <rect x="4" y="8" width="1" height="2" fill="#0F172A" />
          <rect x="7" y="8" width="1" height="2" fill="#0F172A" />
          <rect x="10" y="8" width="1" height="2" fill="#0F172A" />
          <rect x="4" y="12" width="2" height="3" fill="#0F172A" />
          <rect x="7" y="12" width="2" height="3" fill="#0F172A" />
          <rect x="10" y="12" width="2" height="3" fill="#0F172A" />
        </g>
      );
    }

    // 10. Paris (France) - Eiffel Tower
    if (stateOrCountry.includes('france') || id.includes('paris')) {
      return (
        <g fill="#94A3B8">
          <rect x="7" y="1" width="2" height="4" fill="#FDE68A" />
          <rect x="6" y="5" width="4" height="3" fill="#64748B" />
          <rect x="5" y="8" width="6" height="2" fill="#475569" />
          <rect x="4" y="10" width="8" height="2" fill="#334155" />
          <rect x="3" y="12" width="10" height="3" fill="#1E293B" />
          <rect x="6" y="13" width="4" height="2" fill="#0F172A" />
        </g>
      );
    }

    // 11. London (United Kingdom) - Big Ben Clock Tower
    if (stateOrCountry.includes('united kingdom') || id.includes('london')) {
      return (
        <g fill="#E2E8F0">
          <rect x="7" y="1" width="2" height="3" fill="#FDE68A" />
          <rect x="6" y="4" width="4" height="4" fill="#CBD5E1" />
          {/* Golden Clock Face */}
          <rect x="7" y="5" width="2" height="2" fill="#F59E0B" />
          <rect x="5" y="8" width="6" height="7" fill="#94A3B8" />
          <rect x="7" y="11" width="2" height="4" fill="#0F172A" />
        </g>
      );
    }

    // 12. New York / San Francisco (United States) - Empire / Liberty
    if (stateOrCountry.includes('united states') || id.includes('york') || id.includes('francisco')) {
      return (
        <g fill="#38BDF8">
          {/* Tower Needle */}
          <rect x="7" y="1" width="2" height="3" fill="#FDE68A" />
          <rect x="6" y="4" width="4" height="3" fill="#0284C7" />
          <rect x="5" y="7" width="6" height="4" fill="#0369A1" />
          <rect x="4" y="11" width="8" height="4" fill="#075985" />
          {/* Windows */}
          <rect x="6" y="8" width="1" height="1" fill="#FEF08A" />
          <rect x="8" y="8" width="1" height="1" fill="#FEF08A" />
          <rect x="6" y="12" width="1" height="1" fill="#FEF08A" />
          <rect x="8" y="12" width="1" height="1" fill="#FEF08A" />
        </g>
      );
    }

    // 13. Dubai (UAE) - Burj Khalifa
    if (stateOrCountry.includes('uae') || id.includes('dubai')) {
      return (
        <g fill="#38BDF8">
          <rect x="7" y="1" width="2" height="4" fill="#FDE68A" />
          <rect x="6" y="5" width="3" height="4" fill="#0284C7" />
          <rect x="5" y="9" width="4" height="4" fill="#0369A1" />
          <rect x="4" y="13" width="6" height="2" fill="#075985" />
        </g>
      );
    }

    // 14. Singapore - Marina Bay Sands
    if (stateOrCountry.includes('singapore')) {
      return (
        <g fill="#10B981">
          {/* SkyPark cantilever */}
          <rect x="2" y="4" width="12" height="2" fill="#34D399" />
          {/* 3 Towers */}
          <rect x="3" y="6" width="2" height="9" fill="#059669" />
          <rect x="7" y="6" width="2" height="9" fill="#059669" />
          <rect x="11" y="6" width="2" height="9" fill="#059669" />
        </g>
      );
    }

    // 15. Sydney (Australia) - Opera House
    if (stateOrCountry.includes('australia') || id.includes('sydney')) {
      return (
        <g fill="#F8FAFC">
          {/* White Shells */}
          <polygon points="4,12 7,5 9,12" fill="#F8FAFC" />
          <polygon points="8,12 11,6 13,12" fill="#E2E8F0" />
          {/* Blue Harbor */}
          <rect x="2" y="12" width="12" height="3" fill="#1D4ED8" />
        </g>
      );
    }

    // 16. Transport (Trains / Flight Hubs)
    if (tile.type === 'transport') {
      return (
        <g>
          <rect x="2" y="7" width="12" height="5" fill="#38BDF8" />
          <rect x="4" y="5" width="8" height="2" fill="#E0F2FE" />
          <rect x="4" y="12" width="2" height="2" fill="#F59E0B" />
          <rect x="10" y="12" width="2" height="2" fill="#F59E0B" />
        </g>
      );
    }

    // 17. Utilities (ISRO Rocket / Nuclear / Satellite)
    if (tile.type === 'utility') {
      return (
        <g>
          <rect x="7" y="2" width="2" height="8" fill="#F8FAFC" />
          <rect x="5" y="7" width="2" height="4" fill="#A855F7" />
          <rect x="9" y="7" width="2" height="4" fill="#A855F7" />
          <rect x="7" y="10" width="2" height="4" fill="#F97316" />
        </g>
      );
    }

    // 18. Corners & Treasury
    if (tile.type === 'go' || tile.type === 'treasury') {
      return (
        <g>
          <rect x="5" y="4" width="6" height="2" fill="#FEF08A" />
          <rect x="4" y="6" width="8" height="6" fill="#F59E0B" />
          <rect x="7" y="7" width="2" height="2" fill="#FEF08A" />
          <rect x="6" y="12" width="4" height="2" fill="#D97706" />
        </g>
      );
    }

    // Default Palace Arch
    return (
      <g fill={tile.groupColor || '#F59E0B'}>
        <rect x="7" y="3" width="2" height="2" fill="#FDE68A" />
        <rect x="5" y="5" width="6" height="3" fill="#F59E0B" />
        <rect x="4" y="8" width="8" height="5" fill="#D97706" />
        <rect x="6" y="10" width="4" height="3" fill="#0F172A" />
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {renderMonuments()}
    </svg>
  );
};

/**
 * PixelTileSprite retains backward compatibility while rendering the crisp landmark sprite.
 */
export const PixelTileSprite: React.FC<{
  tile: BoardTile;
  size?: number;
  className?: string;
}> = ({ tile, size = 26, className = '' }) => {
  return <PixelLandmarkSprite tile={tile} size={size} className={className} />;
};

/**
 * Pixel-Art Map of India / World with real-time Property Ownership Density Overlays.
 * Visualizes regional ownership control and property value heat at a glance.
 */
export const PixelMapDensityCanvas: React.FC<{
  edition: MapEdition;
  tiles: BoardTile[];
  players: PlayerState[];
}> = ({ edition, tiles, players }) => {
  // Compute dominant color and ownership density for a slice of tile indices
  const getZoneOverlay = (indices: number[]) => {
    const zoneTiles = indices.map((i) => tiles[i]).filter(Boolean);
    const owned = zoneTiles.filter((t) => t.ownerId !== null);
    if (owned.length === 0) {
      const avgPrice =
        zoneTiles.reduce((acc, t) => acc + (t.price || 1000), 0) / Math.max(1, zoneTiles.length);
      const heatAlpha = Math.min(0.32, Math.max(0.1, avgPrice / 12000));
      return { fill: '#F59E0B', opacity: heatAlpha, densityPct: 0, ownerName: 'Unclaimed' };
    }
    const counts: Record<string, number> = {};
    for (const t of owned) {
      if (t.ownerId) {
        counts[t.ownerId] = (counts[t.ownerId] || 0) + 1 + t.level * 0.5;
      }
    }
    const dominantOwnerId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const owner = players.find((p) => p.id === dominantOwnerId) || players[0];
    const densityPct = Math.round((owned.length / zoneTiles.length) * 100);
    const opacity = Math.min(0.65, 0.22 + (densityPct / 100) * 0.4);
    return { fill: owner.color, opacity, densityPct, ownerName: owner.name.split(' ')[0] };
  };

  if (edition === 'india') {
    const northZone = getZoneOverlay([1, 2, 3]);
    const westZone = getZoneOverlay([4, 5, 7]);
    const southZone = getZoneOverlay([8, 10, 11]);
    const eastZone = getZoneOverlay([13, 14, 16]);

    return (
      <div className="relative w-full max-w-[210px] aspect-[4/3] bg-slate-950/90 rounded-xl p-2 border border-slate-800 shadow-inner flex flex-col items-center justify-center">
        <svg
          viewBox="0 0 100 80"
          className="w-full h-full max-h-[110px]"
          shapeRendering="crispEdges"
        >
          {/* Subtle outline of Indian subcontinent in 8-bit stepped pixels */}
          {/* Kashmir & North */}
          <rect x="42" y="4" width="16" height="12" fill={northZone.fill} fillOpacity={northZone.opacity} />
          {/* West (Rajasthan / Gujarat / Maharashtra) */}
          <rect x="22" y="20" width="22" height="24" fill={westZone.fill} fillOpacity={westZone.opacity} />
          {/* Central & East (UP / Bihar / Bengal) */}
          <rect x="44" y="18" width="30" height="22" fill={eastZone.fill} fillOpacity={eastZone.opacity} />
          {/* Deccan & South (Karnataka / AP / Tamil Nadu / Kerala) */}
          <rect x="36" y="42" width="22" height="28" fill={southZone.fill} fillOpacity={southZone.opacity} />
          {/* Peninsula tip */}
          <rect x="42" y="70" width="10" height="6" fill={southZone.fill} fillOpacity={southZone.opacity} />

          {/* India Grid Borders & Coastlines */}
          <path
            d="M 42 4 H 58 V 16 H 74 V 40 H 58 V 70 H 42 V 44 H 22 V 20 H 42 Z"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.45"
          />

          {/* Landmark Anchor Pins */}
          <circle cx="50" cy="18" r="2" fill="#FDE68A" />
          <circle cx="28" cy="32" r="2" fill="#FDE68A" />
          <circle cx="46" cy="56" r="2" fill="#FDE68A" />
          <circle cx="64" cy="28" r="2" fill="#FDE68A" />
        </svg>

        <div className="text-[10px] text-amber-300 font-mono-num font-semibold mt-1">
          Bharat Empire Territory Control
        </div>
      </div>
    );
  }

  // World Edition Map
  const americas = getZoneOverlay([13, 14, 15]);
  const europe = getZoneOverlay([7, 8, 9, 10]);
  const africaMidEast = getZoneOverlay([4, 5, 16, 17]);
  const asiaPacific = getZoneOverlay([1, 2, 3, 19, 21]);

  return (
    <div className="relative w-full max-w-[210px] aspect-[4/3] bg-slate-950/90 rounded-xl p-2 border border-slate-800 shadow-inner flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 100 65"
        className="w-full h-full max-h-[110px]"
        shapeRendering="crispEdges"
      >
        {/* Americas */}
        <rect x="6" y="8" width="20" height="22" fill={americas.fill} fillOpacity={americas.opacity} />
        <rect x="14" y="30" width="14" height="26" fill={americas.fill} fillOpacity={americas.opacity} />

        {/* Europe */}
        <rect x="38" y="10" width="18" height="16" fill={europe.fill} fillOpacity={europe.opacity} />

        {/* Africa & Middle East */}
        <rect x="36" y="26" width="20" height="26" fill={africaMidEast.fill} fillOpacity={africaMidEast.opacity} />
        <rect x="56" y="24" width="12" height="14" fill={africaMidEast.fill} fillOpacity={africaMidEast.opacity} />

        {/* Asia */}
        <rect x="58" y="8" width="32" height="22" fill={asiaPacific.fill} fillOpacity={asiaPacific.opacity} />

        {/* Australia / Oceania */}
        <rect x="74" y="38" width="18" height="16" fill={asiaPacific.fill} fillOpacity={asiaPacific.opacity} />

        {/* Latitude / Equator Line */}
        <line x1="2" y1="32" x2="98" y2="32" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.4" />
      </svg>

      <div className="text-[10px] text-sky-300 font-mono-num font-semibold mt-1">
        Global Tycoon Sovereign Control
      </div>
    </div>
  );
};
