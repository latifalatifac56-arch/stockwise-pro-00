import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  id: string;
  company_name: string;
  logo: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  currency: string | null;
  language: string | null;
  receipt_footer: string | null;
  tax_rate: number | null;
}

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const defaultSettings: AppSettings = {
  id: '',
  company_name: 'Mon Entreprise',
  logo: null,
  primary_color: '#3b82f6',
  secondary_color: '#10b981',
  currency: 'FCFA',
  language: 'fr',
  receipt_footer: null,
  tax_rate: 18,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
  updateSettings: async () => {},
});

// Convert hex color to HSL values (without hsl() wrapper)
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  // Return HSL values as "h s% l%" format for CSS variables
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Apply colors to CSS variables
function applyColorsToCSS(primaryColor: string | null, secondaryColor: string | null) {
  if (primaryColor && primaryColor.startsWith('#')) {
    try {
      const primaryHsl = hexToHsl(primaryColor);
      document.documentElement.style.setProperty('--primary', primaryHsl);
      document.documentElement.style.setProperty('--ring', primaryHsl);
      document.documentElement.style.setProperty('--sidebar-primary', primaryHsl);
      document.documentElement.style.setProperty('--sidebar-ring', primaryHsl);
      
      // Create lighter version for glow
      const parts = primaryHsl.split(' ');
      if (parts.length >= 3) {
        const h = parts[0];
        const s = parseInt(parts[1].replace('%', ''));
        const l = parseInt(parts[2].replace('%', ''));
        const lighterL = Math.min(l + 13, 100);
        document.documentElement.style.setProperty('--primary-glow', `${h} ${Math.min(s + 5, 100)}% ${lighterL}%`);
      }
      
      // Update gradient
      document.documentElement.style.setProperty(
        '--gradient-primary', 
        `linear-gradient(135deg, hsl(${primaryHsl}), hsl(${primaryHsl.split(' ')[0]} ${Math.min(parseInt(primaryHsl.split(' ')[1]) + 5, 100)}% ${Math.min(parseInt(primaryHsl.split(' ')[2]) + 13, 100)}%))`
      );
    } catch (e) {
      console.error('Error applying primary color:', e);
    }
  }
  
  if (secondaryColor && secondaryColor.startsWith('#')) {
    try {
      const secondaryHsl = hexToHsl(secondaryColor);
      document.documentElement.style.setProperty('--accent', secondaryHsl);
    } catch (e) {
      console.error('Error applying secondary color:', e);
    }
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      // First try to get existing settings
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setSettings(data);
        applyColorsToCSS(data.primary_color, data.secondary_color);
      } else {
        // No settings exist, try to create default ones
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert({
              company_name: 'Mon Entreprise',
              primary_color: '#3b82f6',
              secondary_color: '#10b981',
              currency: 'FCFA',
              language: 'fr',
              tax_rate: 18,
            })
            .select()
            .single();

          if (!insertError && newSettings) {
            setSettings(newSettings);
            applyColorsToCSS(newSettings.primary_color, newSettings.secondary_color);
          } else if (insertError) {
            console.error('Error creating settings:', insertError);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      // If no settings exist yet, create them
      if (!settings?.id) {
        const { data: newSettings, error: insertError } = await supabase
          .from('settings')
          .insert({
            company_name: updates.company_name || 'Mon Entreprise',
            primary_color: updates.primary_color || '#3b82f6',
            secondary_color: updates.secondary_color || '#10b981',
            currency: updates.currency || 'FCFA',
            language: updates.language || 'fr',
            tax_rate: updates.tax_rate || 18,
            logo: updates.logo || null,
            receipt_footer: updates.receipt_footer || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (newSettings) {
          setSettings(newSettings);
          applyColorsToCSS(newSettings.primary_color, newSettings.secondary_color);
        }
        return;
      }

      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setSettings(data);
        applyColorsToCSS(data.primary_color, data.secondary_color);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, [settings?.id]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    await fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
