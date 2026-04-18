import { mockFoodOrders } from '@/data/mockData';
import { Clock, Package, CheckCircle } from 'lucide-react';

const FoodOrders = () => {
  const statusIcon = (s: string) => {
    if (s === 'preparing') return <Clock className="w-4 h-4 text-gold-amber" />;
    if (s === 'ready') return <CheckCircle className="w-4 h-4 text-green-neon" />;
    return <Package className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="min-h-screen pb-28 px-4 pt-6">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Food Orders</h1>
      
      <div className="space-y-3">
        {mockFoodOrders.map(order => (
          <div key={order.id} className="glass rounded-2xl p-4 border-glow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-display font-semibold text-foreground">{order.item}</p>
                <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
              </div>
              {statusIcon(order.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary font-semibold">₹{order.price}</span>
              <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                {order.status === 'preparing' && `~${order.estimatedMins} min`}
                {order.status === 'ready' && 'Ready for pickup'}
                {order.status === 'delivered' && 'Delivered'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3.5 rounded-xl font-display font-semibold text-sm bg-primary text-primary-foreground glow-purple flex items-center justify-center gap-2 active:scale-95 transition-transform">
        Browse Menu
      </button>
    </div>
  );
};

export default FoodOrders;
