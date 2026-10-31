import React, { useState } from 'react';
import { BoardTile } from '../game/boardData';

interface PlacePhotoProps {
  tile: BoardTile;
  className?: string;
  alt?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  showCaption?: boolean;
}

// Curated authentic full-color architectural photographs of real landmarks
export const LANDMARK_PHOTOS: Record<string, string> = {
  // India Landmarks (Authentic full-color real photography)
  in_go: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80', // India Gate / Bharat Gateway (Golden Sunset)
  in_jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80', // Hawa Mahal Pink City Facade
  in_udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=800&auto=format&fit=crop&q=80', // Lake Palace Pichola Marble
  in_event_1: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', // Ancient Manuscript & Codex
  in_varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80', // Varanasi Ganga Ghats
  in_rail_csmt: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80', // CSMT Heritage Station Victorian Palace
  in_amritsar: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800&auto=format&fit=crop&q=80', // Golden Temple Harmandir Sahib Amritsar
  in_agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80', // Taj Mahal Ivory Marble
  in_jail: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80', // Cellular Heritage Fort
  in_kochi: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80', // Fort Kochi Chinese Fishing Nets Sunset
  in_util_isro: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&auto=format&fit=crop&q=80', // Sriharikota Space Rocket Launch
  in_goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80', // Goa Aguada Fort & Ocean
  in_chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80', // Mahabalipuram Shore Temple
  in_treasury: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80', // Bharat Mandapam Sovereign Treasury
  in_kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&auto=format&fit=crop&q=80', // Victoria Memorial Hall Marble Dome
  in_event_2: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80', // Sovereign Policy Document
  in_hyderabad: 'https://images.unsplash.com/photo-1629814249584-bd4d53cf0e7d?w=800&auto=format&fit=crop&q=80', // Charminar Minarets
  in_air_igi: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&auto=format&fit=crop&q=80', // Aviation Runway Gateway
  in_bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80', // Vidhana Soudha Palace
  in_tax_gst: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80', // Central Excise & Treasury Ledger
  in_ahmedabad: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80', // Ahmedabad Heritage Architecture
  in_util_grid: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&auto=format&fit=crop&q=80', // Bhadla Mega Solar Array
  in_delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80', // New Delhi Kartavya Path
  in_mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80', // Mumbai Gateway of India

  // World Landmarks (Authentic full-color real photography)
  wd_go: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80', // Global Summit Orbit
  wd_cairo: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&auto=format&fit=crop&q=80', // Great Pyramids of Giza
  wd_athens: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&auto=format&fit=crop&q=80', // Parthenon Acropolis
  wd_event_1: 'https://images.unsplash.com/photo-1507842229451-77239c642739?w=800&auto=format&fit=crop&q=80', // World Library & Atlas
  wd_jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80', // Hawa Mahal Pink City
  wd_sea_route: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=800&auto=format&fit=crop&q=80', // Mediterranean Sea Lane
  wd_transit_sea: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=800&auto=format&fit=crop&q=80', // Indo-Mediterranean Sea Lane
  wd_agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80', // Taj Mahal
  wd_mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80', // Gateway of India
  wd_jail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', // Customs Transit Citadel
  wd_singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80', // Marina Bay Sands
  wd_util_orbit: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80', // Satellite in Orbit
  wd_util_space: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80', // ISRO-ESA Orbital Array
  wd_sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80', // Sydney Opera House
  wd_treasury: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80', // Sovereign Development Fund
  wd_tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80', // Tokyo Tower & Skylines
  wd_event_2: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80', // Global Accord
  wd_rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80', // Colosseum Rome
  wd_flight_hub: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80', // Intercontinental Jetway
  wd_transit_air: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80', // Intercontinental Jetway Air
  wd_paris: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop&q=80', // Paris Eiffel Tower
  wd_london: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800&auto=format&fit=crop&q=80', // London Big Ben
  wd_tax: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80', // Global Customs Ledger
  wd_dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80', // Dubai Burj Khalifa
  wd_util_power: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80', // Electrical Grid
  wd_util_solar: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80', // Solar Grid
  wd_delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80', // Delhi India Gate
  wd_newyork: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80', // New York Manhattan
};

/**
 * Editorial Architectural Sketch Fallback (Used if offline)
 */
const ArchitecturalLithograph: React.FC<{ tile: BoardTile }> = ({ tile }) => {
  return (
    <div className="w-full h-full bg-[#121212] flex flex-col items-center justify-center p-2 text-center border border-white/10">
      <svg
        width="36"
        height="36"
        viewBox="0 0 48 48"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        className="opacity-70 mb-1"
      >
        <rect x="6" y="10" width="36" height="28" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="6" y1="24" x2="42" y2="24" stroke="#FFFFFF" strokeDasharray="2 2" />
        <path d="M14 38V20L24 12L34 20V38" stroke="#FFFFFF" />
        <circle cx="24" cy="24" r="4" stroke="#FFFFFF" />
      </svg>
      <div className="text-[9px] uppercase font-mono tracking-wider text-neutral-300 font-bold truncate max-w-full">
        {tile.city || tile.name}
      </div>
      <div className="text-[7.5px] uppercase font-mono text-neutral-500 tracking-wider">
        {tile.stateOrCountry}
      </div>
    </div>
  );
};

export const PlacePhoto: React.FC<PlacePhotoProps> = ({
  tile,
  className = '',
  alt,
  aspectRatio = 'auto',
  showCaption = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const photoUrl =
    tile.photoUrl ||
    LANDMARK_PHOTOS[tile.id] ||
    LANDMARK_PHOTOS[tile.id.replace('in_', 'wd_')] ||
    LANDMARK_PHOTOS[tile.id.replace('wd_', 'in_')];

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
        ? 'aspect-video'
        : aspectRatio === 'portrait'
          ? 'aspect-[3/4]'
          : '';

  if (hasError || !photoUrl) {
    return (
      <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
        <ArchitecturalLithograph tile={tile} />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#0A0A0A] border border-white/10 select-none ${aspectClass} ${className}`}
    >
      {/* Real Full-Color Landmark Photography (Authentic & Non-AI) */}
      <img
        src={photoUrl}
        alt={alt || `${tile.name} in ${tile.stateOrCountry}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Subtle Bottom Vignette for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Editorial Fine Print Caption */}
      {showCaption && (
        <div className="absolute bottom-1.5 left-2 right-2 flex items-baseline justify-between z-10 pointer-events-none drop-shadow-md">
          <span className="text-[10px] font-mono tracking-widest uppercase text-white font-bold bg-black/60 px-1 py-0.5 rounded">
            {tile.city || tile.name}
          </span>
          <span className="text-[9px] font-mono tracking-wider text-neutral-200 bg-black/60 px-1 py-0.5 rounded">
            {tile.stateOrCountry}
          </span>
        </div>
      )}
    </div>
  );
};
