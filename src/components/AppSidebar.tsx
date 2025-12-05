import { LayoutDashboard, Package, ShoppingCart, Users, Truck, Receipt, TrendingUp, Settings, LogOut, BarChart3, Shield, UserCog, MapPin, DollarSign, Warehouse, Gift, Wallet, FileText, Bell, History, Calculator } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useSettings } from "@/contexts/SettingsContext";

const mainItems = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Articles", url: "/articles", icon: Package },
  { title: "Ventes", url: "/sales", icon: ShoppingCart },
  { title: "Stock", url: "/stock", icon: TrendingUp },
];

const managementItems = [
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Fournisseurs", url: "/suppliers", icon: Truck },
  { title: "Dépenses", url: "/expenses", icon: Receipt },
];

const advancedModules = [
  { title: "Livraisons", url: "/deliveries", icon: MapPin },
  { title: "Livreurs", url: "/drivers", icon: Truck },
  { title: "Achats", url: "/purchases", icon: ShoppingCart },
  { title: "Comptabilité", url: "/accounting", icon: DollarSign },
  { title: "Stock Avancé", url: "/advanced-stock", icon: Warehouse },
];

const analyticsItems = [
  { title: "Statistiques", url: "/statistics", icon: BarChart3 },
  { title: "Prévisions IA", url: "/forecasting", icon: TrendingUp },
  { title: "Journal d'audit", url: "/audit", icon: Shield },
  { title: "Utilisateurs", url: "/users", icon: UserCog },
];

const newFeatures = [
  { title: "Fidélité", url: "/loyalty", icon: Gift },
  { title: "Caisse du jour", url: "/cash-register", icon: Wallet },
  { title: "Rapport journalier", url: "/daily-report", icon: FileText },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Historique clients", url: "/client-history", icon: History },
  { title: "Rentabilité", url: "/profit-calculator", icon: Calculator },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          {settings?.logo ? (
            <img 
              src={settings.logo} 
              alt="Logo" 
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{settings?.company_name || 'GestionPro'}</h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Modules Avancés</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedModules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analyses</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Outils</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {newFeatures.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                activeClassName="bg-accent text-accent-foreground font-medium"
              >
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 mt-2 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
