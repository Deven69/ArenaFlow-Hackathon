import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

import { ErrorBoundary } from '@/components/ErrorBoundary';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
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

export default App;
