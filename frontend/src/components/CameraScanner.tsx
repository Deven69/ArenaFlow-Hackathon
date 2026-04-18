import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Scan } from 'lucide-react';
import { logEvent } from '@/lib/analytics';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: () => void;
}

const CameraScanner = ({ isOpen, onClose, onScanComplete }: CameraScannerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'hsl(0 0% 2%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Scan Ticket</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Camera viewfinder */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="relative w-full max-w-[300px] aspect-square">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary rounded-br-lg" />

              {/* Scan line */}
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-primary"
                style={{ boxShadow: '0 0 10px hsl(var(--electric-purple))' }}
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-muted-foreground/30" />
              </div>
            </div>
          </div>

          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-6">Position your ticket inside the frame</p>
            <motion.button
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display font-semibold flex items-center justify-center gap-2 glow-purple"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                logEvent("scan", "ticket_scanned");
                onScanComplete();
              }}
            >
              <Scan className="w-5 h-5" />
              Simulate Scan
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraScanner;
