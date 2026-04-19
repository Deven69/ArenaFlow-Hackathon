import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/notifications';

const App = () => {
  useEffect(() => {
    const saved = localStorage.getItem('arenaflow_language') ?? 'en';
    document.documentElement.lang = saved;

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        requestNotificationPermission().catch(console.error);
      }
    });

    const channel = supabase.channel('nudges')
      .on('broadcast', { event: 'nudge' }, payload => {
        sendLocalNotification('ArenaFlow Update', payload.payload?.message || 'New stadium update');
      })
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <div 
          id="sr-live-region"
          aria-live="assertive" 
          aria-atomic="true"
          className="sr-only"
          style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
        />
        <div id="main-content" tabIndex={-1} className="outline-none">
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
