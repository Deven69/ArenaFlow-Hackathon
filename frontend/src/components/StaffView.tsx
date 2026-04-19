import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Users, CheckCircle, Shield, ArrowLeft, X } from 'lucide-react';

interface StaffViewProps {
  onExit?: () => void;
}

const StaffView = ({ onExit }: StaffViewProps) => {
  const [scanResult, setScanResult] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#000' }}>
      {/* Tactical grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(hsl(120 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(120 100% 50%) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b" style={{ borderColor: 'hsl(120, 100%, 63%, 0.2)' }}>
        <div className="flex items-center gap-3">
          {onExit && (
            <button onClick={onExit} className="mr-2" aria-label="Exit staff view">
              <ArrowLeft className="w-5 h-5" style={{ color: 'hsl(120, 100%, 63%)' }} />
            </button>
          )}
          <Shield className="w-5 h-5" style={{ color: 'hsl(120, 100%, 63%)' }} />
          <h1 className="font-mono text-sm font-bold tracking-widest uppercase" style={{ color: 'hsl(120, 100%, 63%)' }}>Staff Scanner</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'hsl(120, 100%, 63%)' }} />
          <span className="font-mono text-xs" style={{ color: 'hsl(120, 100%, 63%, 0.6)' }}>LIVE</span>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative flex items-center justify-center" style={{ height: '60vh' }}>
        {[
          'top-8 left-8 border-t-2 border-l-2 rounded-tl-lg',
          'top-8 right-8 border-t-2 border-r-2 rounded-tr-lg',
          'bottom-8 left-8 border-b-2 border-l-2 rounded-bl-lg',
          'bottom-8 right-8 border-b-2 border-r-2 rounded-br-lg',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-16 h-16 ${cls}`} style={{ borderColor: 'hsl(120, 100%, 63%, 0.6)' }} />
        ))}

        <motion.div
          className="absolute left-12 right-12 h-0.5"
          style={{ background: 'hsl(120, 100%, 63%)', boxShadow: '0 0 15px hsl(120, 100%, 63%)' }}
          animate={{ top: ['15%', '85%', '15%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <Camera className="w-16 h-16 opacity-20" style={{ color: 'hsl(120, 100%, 63%)' }} />
      </div>

      {/* Scan button */}
      <div className="relative px-6 mb-4">
        <button
          onClick={() => setScanResult(true)}
          className="w-full py-3.5 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          style={{ background: 'hsl(120, 100%, 63%, 0.1)', color: 'hsl(120, 100%, 63%)', border: '1px solid hsl(120, 100%, 63%, 0.3)' }}
        >
          SCAN TICKET
        </button>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 rounded-t-3xl p-6"
            style={{ background: '#0a0a0a', border: '1px solid hsl(120, 100%, 63%, 0.2)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: 'hsl(120, 100%, 63%)' }} />
                <span className="font-mono font-bold text-sm tracking-wider" style={{ color: 'hsl(120, 100%, 63%)' }}>VERIFIED</span>
              </div>
              <button onClick={() => setScanResult(false)} aria-label="Close scan result">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'hsl(120, 100%, 63%, 0.08)' }}>
                <Users className="w-6 h-6" style={{ color: 'hsl(120, 100%, 63%)' }} />
              </div>
              <div>
                <p className="font-mono font-bold text-foreground">Arjun Mehta</p>
                <p className="font-mono text-xs text-muted-foreground">TKT-2024-FINALE-001</p>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4" style={{ background: 'hsl(120, 100%, 63%, 0.05)', border: '1px solid hsl(120, 100%, 63%, 0.15)' }}>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Members</p>
                  <p className="font-mono text-xl font-bold" style={{ color: 'hsl(120, 100%, 63%)' }}>3</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Block</p>
                  <p className="font-mono text-xl font-bold text-foreground">B3</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Tier</p>
                  <p className="font-mono text-xl font-bold text-gold-amber">Gold</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setScanResult(false);
                import('@/lib/accessibility').then(({ announceToScreenReader }) => {
                  const count = 3;
                  announceToScreenReader(`Check-in complete. ${count} ticket${count > 1 ? 's' : ''} validated successfully.`);
                });
              }}
              className="w-full py-3.5 rounded-xl font-mono font-bold text-sm active:scale-95 transition-transform glow-green"
              style={{ background: 'hsl(120, 100%, 63%, 0.1)', color: 'hsl(120, 100%, 63%)', border: '1px solid hsl(120, 100%, 63%, 0.3)' }}
            >
              CHECK IN ALL (3 MEMBERS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffView;
