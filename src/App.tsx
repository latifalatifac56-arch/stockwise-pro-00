import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { SettingsProvider } from "@/contexts/SettingsContext";

import Dashboard from "./pages/Dashboard";
import Articles from "./pages/Articles";
import Sales from "./pages/Sales";
import Stock from "./pages/Stock";
import Clients from "./pages/Clients";
import Suppliers from "./pages/Suppliers";
import Expenses from "./pages/Expenses";
import Statistics from "./pages/Statistics";
import AuditLog from "./pages/AuditLog";
import Forecasting from "./pages/Forecasting";
import SettingsPage from "./pages/Settings";
import Users from "./pages/Users";
import Auth from "./pages/Auth";
import Deliveries from "./pages/Deliveries";
import Drivers from "./pages/Drivers";
import Purchases from "./pages/Purchases";
import Accounting from "./pages/Accounting";
import AdvancedStock from "./pages/AdvancedStock";
import Loyalty from "./pages/Loyalty";
import CashRegister from "./pages/CashRegister";
import DailyReport from "./pages/DailyReport";
import Notifications from "./pages/Notifications";
import ClientHistory from "./pages/ClientHistory";
import ProfitCalculator from "./pages/ProfitCalculator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col bg-background">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <AuthRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </AuthRoute>
              }
            />
            <Route path="/articles" element={<AuthRoute><AppLayout><Articles /></AppLayout></AuthRoute>} />
            <Route path="/sales" element={<AuthRoute><AppLayout><Sales /></AppLayout></AuthRoute>} />
            <Route path="/stock" element={<AuthRoute><AppLayout><Stock /></AppLayout></AuthRoute>} />
            <Route path="/clients" element={<AuthRoute><AppLayout><Clients /></AppLayout></AuthRoute>} />
            <Route path="/suppliers" element={<AuthRoute><AppLayout><Suppliers /></AppLayout></AuthRoute>} />
            <Route path="/expenses" element={<AuthRoute><AppLayout><Expenses /></AppLayout></AuthRoute>} />
            <Route path="/deliveries" element={<AuthRoute><AppLayout><Deliveries /></AppLayout></AuthRoute>} />
            <Route path="/drivers" element={<AuthRoute><AppLayout><Drivers /></AppLayout></AuthRoute>} />
            <Route path="/purchases" element={<AuthRoute><AppLayout><Purchases /></AppLayout></AuthRoute>} />
            <Route path="/accounting" element={<AuthRoute><AppLayout><Accounting /></AppLayout></AuthRoute>} />
            <Route path="/advanced-stock" element={<AuthRoute><AppLayout><AdvancedStock /></AppLayout></AuthRoute>} />
            <Route path="/statistics" element={<AuthRoute><AppLayout><Statistics /></AppLayout></AuthRoute>} />
            <Route path="/forecasting" element={<AuthRoute><AppLayout><Forecasting /></AppLayout></AuthRoute>} />
            <Route path="/audit" element={<AuthRoute><AppLayout><AuditLog /></AppLayout></AuthRoute>} />
            <Route path="/settings" element={<AuthRoute><AppLayout><SettingsPage /></AppLayout></AuthRoute>} />
<Route path="/users" element={<AuthRoute><AppLayout><Users /></AppLayout></AuthRoute>} />
            <Route path="/loyalty" element={<AuthRoute><AppLayout><Loyalty /></AppLayout></AuthRoute>} />
            <Route path="/cash-register" element={<AuthRoute><AppLayout><CashRegister /></AppLayout></AuthRoute>} />
            <Route path="/daily-report" element={<AuthRoute><AppLayout><DailyReport /></AppLayout></AuthRoute>} />
            <Route path="/notifications" element={<AuthRoute><AppLayout><Notifications /></AppLayout></AuthRoute>} />
            <Route path="/client-history" element={<AuthRoute><AppLayout><ClientHistory /></AppLayout></AuthRoute>} />
            <Route path="/profit-calculator" element={<AuthRoute><AppLayout><ProfitCalculator /></AppLayout></AuthRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
