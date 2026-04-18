import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Utensils, Users, Sparkles } from 'lucide-react';
import { Loader } from "@googlemaps/js-api-loader";
import { logEvent } from '@/lib/analytics';
import './HypeCard.css';
import matchPoster from '@/assets/match-poster.jpg';
import captainPopout from '@/assets/captain-popout.png';
import type { Ticket } from '@/data/mockData';

interface HypeCardProps {
  ticket?: Ticket;
}

const HypeCard: React.FC<HypeCardProps> = ({ ticket }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Fallback demo data so the card renders even without a ticket prop
  const data = ticket ?? {
    matchTitle: 'IPL 2024: The Finale',
    section: 'Premium Lounge',
    block: 'B3',
    row: '12',
    seat: '18',
    tier: 'Gold' as const,
    userName: 'Arjun Mehta',
    qrCode: 'ARENAFLOW-TKT-2024-FINALE-001',
  };

  const tierLabel =
    data.tier === 'Gold' ? 'LEGENDARY' : data.tier === 'Silver' ? 'PREMIUM' : 'STANDARD';

  return (
    <div className="flex items-center justify-center min-h-[520px] w-full">
      {/* The Container that holds the 'Pop' + flip */}
      <motion.div
        className="relative w-[340px] h-[460px]"
        style={{ perspective: 1400 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Layer 1: Ambient glow behind everything */}
        <div className="absolute inset-0 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />

        {/* Flipper */}
        <motion.div
          className="relative w-full h-full cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.9, type: 'spring', stiffness: 60, damping: 14 }}
          onClick={() => setIsFlipped((f) => !f)}
        >
          {/* ======================= FRONT ======================= */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {/* Layer 2: The Main Card Body (Clip-path/Border) */}
            <div className="card-body-frame relative w-full h-full rounded-[30px] p-[3px] bg-gradient-to-b from-purple-400 via-blue-500 to-purple-600 overflow-hidden">
              <div className="w-full h-full bg-[#0d1117] rounded-[28px] relative overflow-hidden">
                {/* Full-bleed match poster */}
                <img
                  src={matchPoster}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="Match poster"
                />

                {/* Subtle gradient for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                {/* Holographic shimmer sweep */}
                <div className="card-shimmer-sweep" />

                {/* Card Content */}
                <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-white tracking-widest text-xs drop-shadow-lg">IPL FINALE</div>
                    <div className="bg-yellow-500 text-black px-2 py-1 rounded text-[10px] font-black">
                      {tierLabel}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h2 className="text-white font-black text-2xl leading-tight drop-shadow-lg">
                      {data.matchTitle}
                    </h2>
                    <p className="text-purple-300 text-xs font-semibold drop-shadow">
                      Section: {data.section}
                    </p>
                    <p className="text-white/60 text-[10px] mt-2 tracking-wider uppercase">
                      Tap to flip · View Pass
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================= BACK ======================= */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="card-body-frame relative w-full h-full rounded-[30px] p-[3px] bg-gradient-to-b from-yellow-400 via-amber-500 to-yellow-600 overflow-hidden">
              <div className="w-full h-full bg-[#0d1117] rounded-[28px] relative overflow-hidden flex flex-col items-center justify-between p-5">
                {/* Golden radial glow behind QR */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[260px] h-[260px] rounded-full bg-yellow-500/25 blur-[60px]" />
                </div>

                {/* Header */}
                <div className="relative z-10 w-full flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black tracking-[0.25em] uppercase">
                      Entry Pass
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50">#{data.qrCode.slice(-6)}</span>
                </div>

                {/* QR Code generated from the ticket's scanned barcode */}
                <div className="relative z-10 flex flex-col items-center gap-2 mt-1">
                  <div className="bg-white p-3 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.35)]">
                    <QRCodeSVG
                      value={data.qrCode}
                      size={160}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#0d1117"
                    />
                  </div>
                  <p className="font-mono text-[10px] text-yellow-400 tracking-[0.18em]">
                    SCAN AT GATE
                  </p>
                </div>

                {/* Seat info */}
                <div className="relative z-10 w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-2.5 flex justify-around">
                  {[
                    { label: 'BLOCK', value: data.block },
                    { label: 'ROW', value: data.row },
                    { label: 'SEAT', value: data.seat },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center">
                      <span className="text-[9px] tracking-[0.15em] text-white/40 font-semibold">
                        {s.label}
                      </span>
                      <span className="font-mono text-lg font-bold text-white">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="relative z-10 w-full flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-400/25 text-xs font-bold hover:bg-blue-500/25 transition"
                    onClick={async (e) => {
                          e.stopPropagation();
                          const loader = new Loader({
                            apiKey: "MOCK_API_KEY_OR_PROCESS_ENV", 
                            version: "weekly",
                            libraries: ["places"]
                          });
                          logEvent("navigate", "view_directions");
                          try {
                              await loader.importLibrary('routes');
                              alert("Fetching dynamic walking directions via Google Maps API...");
                          } catch (err) {
                              console.error("Maps integration pending API KEY:", err);
                          }
                    }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Navigate
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-500/15 text-yellow-300 border border-yellow-400/25 text-xs font-bold hover:bg-yellow-500/25 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Order Food
                  </button>
                </div>

                <button
                  className="relative z-10 flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white/80 transition px-3 py-1 rounded-full border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Users className="w-3 h-3" />
                  View Group Passes
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HypeCard;
