import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

/** Brand colors configuration */
export interface BrandColors {
  primaryColor: string;
  secondaryColor: string;
}

/** Default brand colors */
const DEFAULT_BRAND_COLORS: BrandColors = {
  primaryColor: "#155FD9",
  secondaryColor: "#489BFA",
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  // Branding
  brandColors: BrandColors;
  setBrandColors: (colors: BrandColors) => void;
  saveBrandColors: (colors: BrandColors) => Promise<void>;
  loadBrandColors: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/** Helper to generate color shades from a base color */
function generateColorShades(hex: string): Record<string, string> {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Generate shades
  const shades: Record<string, string> = {};
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  
  levels.forEach((level) => {
    const factor = (500 - level) / 500;
    const newR = Math.round(Math.min(255, Math.max(0, r + (255 - r) * factor * 0.8)));
    const newG = Math.round(Math.min(255, Math.max(0, g + (255 - g) * factor * 0.8)));
    const newB = Math.round(Math.min(255, Math.max(0, b + (255 - b) * factor * 0.8)));
    
    if (level < 500) {
      // Lighter shades
      shades[level] = `rgb(${newR}, ${newG}, ${newB})`;
    } else if (level === 500) {
      // Base color
      shades[level] = hex;
    } else {
      // Darker shades
      const darkFactor = (level - 500) / 400;
      const darkR = Math.round(r * (1 - darkFactor * 0.6));
      const darkG = Math.round(g * (1 - darkFactor * 0.6));
      const darkB = Math.round(b * (1 - darkFactor * 0.6));
      shades[level] = `rgb(${darkR}, ${darkG}, ${darkB})`;
    }
  });
  
  return shades;
}

/** Apply brand colors to CSS variables */
function applyBrandColorsToCss(colors: BrandColors) {
  const root = document.documentElement;
  
  // Set primary color and shades
  root.style.setProperty("--brand-primary", colors.primaryColor);
  root.style.setProperty("--brand-secondary", colors.secondaryColor);
  
  // Generate and set primary shades
  const primaryShades = generateColorShades(colors.primaryColor);
  Object.entries(primaryShades).forEach(([shade, color]) => {
    root.style.setProperty(`--brand-primary-${shade}`, color);
  });
  
  // Generate and set secondary shades
  const secondaryShades = generateColorShades(colors.secondaryColor);
  Object.entries(secondaryShades).forEach(([shade, color]) => {
    root.style.setProperty(`--brand-secondary-${shade}`, color);
  });
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [brandColors, setBrandColorsState] = useState<BrandColors>(() => {
    // Check localStorage first
    const saved = localStorage.getItem("brandColors");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_BRAND_COLORS;
      }
    }
    return DEFAULT_BRAND_COLORS;
  });

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const setTheme = (theme: "light" | "dark") => {
    setIsDark(theme === "dark");
  };

  /** Update brand colors in state and localStorage */
  const setBrandColors = useCallback((colors: BrandColors) => {
    setBrandColorsState(colors);
    localStorage.setItem("brandColors", JSON.stringify(colors));
    applyBrandColorsToCss(colors);
  }, []);

  /** Save brand colors to Supabase tenant metadata */
  const saveBrandColors = useCallback(async (colors: BrandColors) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) return;

      // Get current metadata first to merge with new branding
      const { data: tenant } = await supabase
        .from("tenants")
        .select("metadata")
        .eq("id", tenantId)
        .single();

      if (tenant) {
        const currentMetadata = (tenant.metadata as Record<string, unknown>) || {};
        await supabase
          .from("tenants")
          .update({
            metadata: {
              ...currentMetadata,
              branding: {
                primaryColor: colors.primaryColor,
                secondaryColor: colors.secondaryColor,
              }
            }
          })
          .eq("id", tenantId);
      }

      // Update local state
      setBrandColors(colors);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error saving brand colors:", err);
    }
  }, [setBrandColors]);

  /** Load brand colors from Supabase tenant metadata */
  const loadBrandColors = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) return;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("metadata")
        .eq("id", tenantId)
        .single();

      if (tenant?.metadata?.branding) {
        const branding = tenant.metadata.branding;
        if (branding.primaryColor && branding.secondaryColor) {
          setBrandColors({
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
          });
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error loading brand colors:", err);
    }
  }, [setBrandColors]);

  // Apply brand colors on mount and when they change
  useEffect(() => {
    applyBrandColorsToCss(brandColors);
  }, [brandColors]);

  // Load brand colors when authenticated
  useEffect(() => {
    const loadColors = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadBrandColors();
      }
    };
    loadColors();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        loadBrandColors();
      } else if (event === "SIGNED_OUT") {
        setBrandColors(DEFAULT_BRAND_COLORS);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadBrandColors, setBrandColors]);

  useEffect(() => {
    // Update localStorage
    localStorage.setItem("theme", isDark ? "dark" : "light");

    // Update document class
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const value = {
    isDark,
    toggleTheme,
    setTheme,
    brandColors,
    setBrandColors,
    saveBrandColors,
    loadBrandColors,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
