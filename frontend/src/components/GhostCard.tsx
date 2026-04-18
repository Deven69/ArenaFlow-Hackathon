import { Plus, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface GhostCardProps {
  onScan: () => void;
}

const GhostCard = ({ onScan }: GhostCardProps) => {
  return (
    <div className="w-[85vw] max-w-[380px] mx-auto">
      <motion.button
        onClick={onScan}
        className="relative w-full rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors group"
        style={{ aspectRatio: '9/14' }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <motion.div
          className="w-20 h-20 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Plus className="w-8 h-8 text-primary" />
        </motion.div>
        
        <div className="text-center px-6">
          <p className="font-display text-lg font-semibold text-foreground mb-1">Digitize Your Ticket</p>
          <p className="text-sm text-muted-foreground">Scan your physical ticket to unlock your digital HypeCard</p>
        </div>

        <div className="flex items-center gap-2 glass rounded-full px-4 py-2 mt-2">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Scan Ticket</span>
        </div>
      </motion.button>
    </div>
  );
};

export default GhostCard;
