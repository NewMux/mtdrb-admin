/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // macOS neutral grays (no blue cast, unlike Tailwind's default gray).
        // Light: window #F6F6F6, separators #E0E0E0, label #1D1D1F.
        // Dark: window #1D1D1F, content #2C2C2E, separators #3A3A3C.
        gray: {
          50: '#F6F6F6',
          100: '#EDEDED',
          200: '#E0E0E0',
          300: '#C8C8C8',
          400: '#A3A3A3',
          500: '#66666B',
          600: '#505054',
          700: '#3A3A3C',
          800: '#2C2C2E',
          900: '#1D1D1F',
          950: '#141414',
        },
        // Some screens were written against slate; alias it to the same
        // neutral scale so they don't pick up a blue cast.
        slate: {
          50: '#F6F6F6',
          100: '#EDEDED',
          200: '#E0E0E0',
          300: '#C8C8C8',
          400: '#A3A3A3',
          500: '#66666B',
          600: '#505054',
          700: '#3A3A3C',
          800: '#2C2C2E',
          900: '#1D1D1F',
          950: '#141414',
        },
        // System blue accent (light #007AFF, dark #0A84FF).
        blue: {
          50: '#EEF5FF',
          100: '#DCEBFF',
          200: '#B8D7FF',
          300: '#85BBFF',
          400: '#4D9DFF',
          500: '#0A84FF',
          600: '#0062C4',
          700: '#004FA8',
          800: '#003F85',
          900: '#00306A',
        },
        // The 600 shades are what text and links use on light backgrounds, so they are
        // dark enough for 4.5:1 contrast on white and the light grays (WCAG AA).
        green: { 500: '#34C759', 600: '#1B7A31', 700: '#145A25' },
        red: { 500: '#FF3B30', 600: '#C8281F', 700: '#A31F18' },
        orange: { 500: '#FF9500', 600: '#A85800' },
        amber: { 600: '#A64B08', 700: '#8A3F06' },
        yellow: { 500: '#FFCC00', 600: '#8A6500' },
        purple: { 500: '#AF52DE', 600: '#9A3FC9' },
        indigo: { 500: '#5856D6', 600: '#4B49C0' },
        pink: { 500: '#FF2D55', 600: '#C71F43' },
        teal: { 500: '#30B0C7', 600: '#1A7185' },
        // Luna Design System (Pre-Launch)
        luna: {
          navy: '#011C40',
          cyan: '#54ACBF',
          light: '#A7EBF2',
          mid: '#26658C',
          white: '#FFFFFF',
        },
        lunaNavy: '#011C40',
        lunaCyan: '#54ACBF',
        lunaLight: '#A7EBF2',
        lunaMid: '#26658C',
        // Apple-style Backgrounds
        apple: {
          light: '#F5F5F7',
          dark: '#000000',
          gray: {
            50: '#F5F5F7',
            100: '#E5E5E7',
            200: '#D2D2D7',
            300: '#86868B',
            400: '#6E6E73',
            500: '#515154',
            600: '#424245',
            700: '#1D1D1F',
            800: '#000000',
          },
        },
        // Apple Blue
        appleBlue: {
          DEFAULT: '#0071E3',
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CBFF',
          300: '#66B1FF',
          400: '#3397FF',
          500: '#0071E3',
          600: '#005AB8',
          700: '#00438C',
          800: '#002C61',
          900: '#001535',
        },
        // Background & Surface
        background: '#FAFAFA',
        surface: '#F2F2F5',
        'surface-hover': '#E8E8EB',
        
        // Text
        primary: '#1A1A1A',
        secondary: '#6B6B6B',
        tertiary: '#9CA3AF',
        
        // MTDRB Brand Colors
        mtdrb: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#7DCCFF',
          600: '#0E5EF2',
          700: '#002D9C',
          800: '#001f6b',
          900: '#00123a',
        },
        
        // Accents
        sky: {
          50: '#EEF5FF',
          100: '#DCEBFF',
          200: '#B8D7FF',
          300: '#85BBFF',
          400: '#4D9DFF',
          500: '#0A84FF',
          600: '#0062C4',
          700: '#004FA8',
          800: '#003F85',
          900: '#00306A',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#F472B6',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#34D399',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FBBF24',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        // Semantic colors with full scales
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Brand colors (alias for mtdrb)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#7DCCFF',
          600: '#0E5EF2',
          700: '#002D9C',
          800: '#001f6b',
          900: '#00123a',
        },
        
        // Light theme colors
        light: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        
        // Dark theme colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      
      // macOS-native type, radii and elevation. The admin app is meant to
      // feel like a Mac app (Finder/Mail/System Settings), so these mirror
      // AppKit metrics rather than marketing-site proportions.
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        arabic: ['"SF Arabic"', '"Geeza Pro"', 'Cairo', 'system-ui', 'sans-serif'],
        apple: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.015em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        '3xl': '18px',
        full: '9999px',
      },

      boxShadow: {
        sm: '0 0 0 0.5px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)',
        DEFAULT: '0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
        md: '0 0 0 0.5px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.08)',
        lg: '0 0 0 0.5px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)',
        xl: '0 0 0 0.5px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.16)',
        '2xl': '0 0 0 0.5px rgba(0,0,0,0.12), 0 22px 70px 4px rgba(0,0,0,0.28)',
        // Accent focus halo, as drawn around focused AppKit controls.
        focus: '0 0 0 3px rgba(0,122,255,0.4)',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'scaleIn 0.2s ease-out',
        'window-in': 'fadeIn 0.18s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 