import { Home, Map, Utensils, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabId = 'home' | 'explore' | 'food' | 'profile';

interface BottomDockProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Tickets' },
  { id: 'explore', icon: Map, label: 'Explore' },
  { id: 'food', icon: Utensils, label: 'Food' },
  { id: 'profile', icon: User, label: 'Profile' },
];

const BottomDock = ({ activeTab, onTabChange }: BottomDockProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
      <nav className="glass-heavy rounded-2xl px-2 py-2 flex items-center justify-around max-w-md mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="dock-glow"
                  className="absolute -bottom-0.5 w-8 h-1 rounded-full bg-primary"
                  style={{ boxShadow: '0 0 12px hsl(var(--electric-purple))' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomDock;
