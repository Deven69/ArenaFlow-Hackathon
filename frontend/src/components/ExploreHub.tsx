import { motion } from 'framer-motion';
import { ArrowRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { mockGates, optimizedGate } from '@/data/mockData';

const ExploreHub = () => {
  const congestionColor = (c: string) => {
    if (c === 'low') return 'text-green-neon';
    if (c === 'medium') return 'text-gold-amber';
    return 'text-destructive';
  };
  const congestionBg = (c: string) => {
    if (c === 'low') return 'bg-green-neon/10';
    if (c === 'medium') return 'bg-gold-amber/10';
    return 'bg-destructive/10';
  };

  return (
    <div className="min-h-screen pb-28 px-4 pt-6">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Explore</h1>

      {/* Stadium Map SVG */}
      <div className="glass rounded-2xl p-4 mb-6 border-glow">
        <svg viewBox="0 0 300 200" className="w-full h-auto">
          <ellipse cx="150" cy="100" rx="140" ry="90" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
          <ellipse cx="150" cy="100" rx="100" ry="60" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
          <rect x="110" y="75" width="80" height="50" rx="4" fill="hsl(var(--muted))" opacity="0.3" />
          {/* Heatmap zones */}
          <ellipse cx="80" cy="60" rx="30" ry="20" fill="hsl(0, 84%, 60%)" opacity="0.2" />
          <ellipse cx="220" cy="60" rx="30" ry="20" fill="hsl(0, 84%, 60%)" opacity="0.15" />
          <ellipse cx="150" cy="170" rx="35" ry="18" fill="hsl(120, 100%, 50%)" opacity="0.15" />
          <ellipse cx="60" cy="130" rx="25" ry="20" fill="hsl(40, 100%, 55%)" opacity="0.15" />
          <ellipse cx="240" cy="130" rx="25" ry="20" fill="hsl(120, 100%, 50%)" opacity="0.12" />
          {/* Gate labels */}
          {[
            { x: 70, y: 30, label: 'A' },
            { x: 230, y: 30, label: 'D' },
            { x: 150, y: 190, label: 'B' },
            { x: 30, y: 110, label: 'C' },
            { x: 270, y: 110, label: 'E' },
          ].map(g => (
            <g key={g.label}>
              <circle cx={g.x} cy={g.y} r="10" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1" />
              <text x={g.x} y={g.y + 4} textAnchor="middle" fill="hsl(var(--primary))" fontSize="9" fontFamily="Space Grotesk">
                {g.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-neon" />Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold-amber" />Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />High</span>
        </div>
      </div>

      {/* Optimized Route Card */}
      <motion.div
        className="glass rounded-2xl p-4 mb-6 border border-primary/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-neon" />
          <span className="font-display text-sm font-semibold text-foreground">Smart Routing</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground font-display font-bold text-lg">Use {optimizedGate.gate}</p>
            <p className="text-sm text-muted-foreground">Saves {optimizedGate.savedMinutes} mins • {optimizedGate.distance}</p>
          </div>
          <motion.div
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight className="w-6 h-6 text-primary" />
          </motion.div>
        </div>
      </motion.div>

      {/* Gate Analytics */}
      <h2 className="font-display text-lg font-semibold text-foreground mb-3">Gate Wait Times</h2>
      <div className="space-y-2">
        {mockGates.map(gate => (
          <div key={gate.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${congestionBg(gate.congestion)}`}>
                {gate.congestion === 'high' ? (
                  <AlertTriangle className={`w-4 h-4 ${congestionColor(gate.congestion)}`} />
                ) : (
                  <CheckCircle className={`w-4 h-4 ${congestionColor(gate.congestion)}`} />
                )}
              </div>
              <span className="font-display font-semibold text-foreground">{gate.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={`font-mono text-sm font-semibold ${congestionColor(gate.congestion)}`}>
                {gate.waitMinutes} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreHub;
