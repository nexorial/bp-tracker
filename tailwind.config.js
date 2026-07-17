/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Design Tokens from UI Research Brief
      colors: {
        // Background colors
        'bg-primary': '#0A0A0F',
        'bg-secondary': '#13131A',
        'bg-tertiary': '#1A1A24',
        'bg-elevated': '#27272A',
        
        // Border colors
        'border-subtle': '#2A2A35',
        'border-default': '#3A3A48',
        'border-light': '#52525B',
        
        // Text colors
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1AA',
        'text-tertiary': '#71717A',
        'text-muted': '#D4D4D8',
        'text-placeholder': '#A1A1AA',
        
        // Semantic health colors
        'health-normal': '#10B981',
        'health-elevated': '#F59E0B',
        'health-high-1': '#F97316',
        'health-high-2': '#F43F5E',
        'health-crisis': '#DC2626',
        'health-info': '#3B82F6',
        'health-success': '#14B8A6',
        
        // Accent colors
        'accent-primary': '#3B82F6',
        'accent-primary-hover': '#2563EB',
        'accent-success': '#10B981',
        'accent-success-hover': '#059669',
        'accent-warning': '#F59E0B',
        'accent-danger': '#F43F5E',
        'accent-danger-hover': '#DC2626',
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
      },
      
      fontSize: {
        'hero': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'tiny': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
        // BP Reading display sizes
        'bp-display': ['4rem', { lineHeight: '1', fontWeight: '700' }],
        'bp-separator': ['3rem', { lineHeight: '1', fontWeight: '300' }],
        'bp-unit': ['1rem', { lineHeight: '1', fontWeight: '500' }],
        'bp-pulse': ['2.25rem', { lineHeight: '1', fontWeight: '600' }],
      },
      
      // Spacing scale (8px base)
      spacing: {
        'micro': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '40px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '80px',
        '6xl': '96px',
      },
      
      // Border radius
      borderRadius: {
        'card': '16px',
        'input': '10px',
        'button': '10px',
        'badge': '9999px',
        'table': '12px',
      },
      
      // Box shadows
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'card-elevated': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'input-focus': '0 0 0 3px rgba(59, 130, 246, 0.15)',
      },
      
      // Transitions
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      transitionDuration: {
        'instant': '0ms',
        'fast': '100ms',
        'normal': '150ms',
        'slow': '250ms',
        'page': '300ms',
        'number': '800ms',
        'chart': '1000ms',
      },
      
      // Letter spacing
      letterSpacing: {
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.02em',
        'wider': '0.05em',
      },
      
      // Animation
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
