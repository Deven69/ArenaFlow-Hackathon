import { mockTicket } from '@/data/mockData';
import { User, Settings, LogOut, Bell, CreditCard, ChevronRight } from 'lucide-react';

const ProfileView = () => {
  return (
    <div className="min-h-screen pb-28 px-4 pt-6">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Profile</h1>
      
      <div className="glass rounded-2xl p-6 border-glow mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="font-display text-lg font-bold text-foreground">{mockTicket.userName}</p>
          <p className="text-sm text-muted-foreground">{mockTicket.tier} Member</p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: Bell, label: 'Notifications', desc: 'Match alerts & updates' },
          { icon: CreditCard, label: 'Payment Methods', desc: 'Manage cards & wallets' },
          { icon: Settings, label: 'Settings', desc: 'App preferences' },
          { icon: LogOut, label: 'Sign Out', desc: 'Log out of ArenaFlow' },
        ].map(({ icon: Icon, label, desc }) => (
          <button key={label} className="w-full glass rounded-xl px-4 py-3 flex items-center gap-3 text-left">
            <Icon className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-display text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileView;
