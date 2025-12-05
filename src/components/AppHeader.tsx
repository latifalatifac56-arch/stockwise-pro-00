import { useSettings } from "@/contexts/SettingsContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export function AppHeader() {
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger className="md:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        
        <div className="flex items-center gap-4 flex-1">
          {settings?.logo && (
            <img 
              src={settings.logo} 
              alt="Logo" 
              className="h-10 w-10 rounded-lg object-contain"
            />
          )}
          <div className="flex flex-col">
            <h1 
              className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent drop-shadow-sm"
              style={{
                fontFamily: "'Playfair Display', 'Georgia', serif",
                letterSpacing: '-0.02em'
              }}
            >
              {settings?.company_name || 'GestionPro'}
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">
              Système de gestion commerciale
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
