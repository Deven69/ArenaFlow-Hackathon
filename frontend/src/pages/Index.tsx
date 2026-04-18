import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoginScreen from '@/components/LoginScreen';
import HypeCard from '@/components/HypeCard';
import GhostCard from '@/components/GhostCard';
import CameraScanner from '@/components/CameraScanner';
import BottomDock, { type TabId } from '@/components/BottomDock';
import ExploreHub from '@/components/ExploreHub';
import FoodOrders from '@/components/FoodOrders';
import ProfileView from '@/components/ProfileView';
import StaffView from '@/components/StaffView';
import { mockTicket } from '@/data/mockData';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isStaffMode, setIsStaffMode] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  if (isStaffMode) {
    return <StaffView onExit={() => setIsStaffMode(false)} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="min-h-screen pb-28 flex flex-col relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Floating orbs */}
              <div className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-primary/5 blur-3xl animate-float-slow" />
              <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full bg-secondary/5 blur-3xl animate-float-delayed" />
              <div className="absolute bottom-40 left-1/4 w-40 h-40 rounded-full bg-gold-amber/5 blur-3xl animate-float-slow" />
              
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }} />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 pt-6 pb-2">
              <div>
                <p className="text-xs text-muted-foreground font-body tracking-wide uppercase">Welcome back</p>
                <h1 className="font-display text-2xl font-bold text-foreground mt-0.5">{mockTicket.userName}</h1>
              </div>
              <div className="w-11 h-11 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                <span className="font-display text-sm font-bold text-primary">AM</span>
              </div>
            </div>

            {/* Match info strip */}
            {hasTicket && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mx-5 mt-2 mb-2 glass rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-neon animate-pulse" />
                  <span className="text-xs font-display font-semibold text-foreground">Match Day Live</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{mockTicket.time}</span>
              </motion.div>
            )}

            {/* Card area */}
            <div className="flex-1 flex items-center justify-center px-4">
              <AnimatePresence mode="wait">
                {hasTicket ? (
                  <motion.div
                    key="hype"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                  >
                    <HypeCard ticket={mockTicket} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="ghost"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <GhostCard onScan={() => setShowScanner(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick actions when ticket exists */}
            {hasTicket && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative px-5 pb-4 flex gap-3"
              >
                <button
                  onClick={() => setActiveTab('explore')}
                  className="flex-1 glass rounded-xl px-4 py-3 flex items-center gap-2 border-glow active:scale-95 transition-transform"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                    <span className="text-secondary text-sm">🗺️</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-display font-semibold text-foreground">Navigate</p>
                    <p className="text-[10px] text-muted-foreground">Find your gate</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('food')}
                  className="flex-1 glass rounded-xl px-4 py-3 flex items-center gap-2 border-glow active:scale-95 transition-transform"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold-amber/15 flex items-center justify-center">
                    <span className="text-sm">🍔</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-display font-semibold text-foreground">Order Food</p>
                    <p className="text-[10px] text-muted-foreground">Skip the queue</p>
                  </div>
                </button>
              </motion.div>
            )}
          </div>
        );
      case 'explore':
        return <ExploreHub />;
      case 'food':
        return <FoodOrders />;
      case 'profile':
        return <ProfileView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      <BottomDock activeTab={activeTab} onTabChange={setActiveTab} />

      <CameraScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={() => {
          setShowScanner(false);
          setHasTicket(true);
        }}
      />
    </div>
  );
};

export default Index;
