import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'neon-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(168,85,247,0.4), 0 0 15px rgba(168,85,247,0.2)' },
          '50%': { boxShadow: '0 0 10px rgba(168,85,247,0.8), 0 0 25px rgba(168,85,247,0.5), 0 0 50px rgba(168,85,247,0.3)' },
        },
        'neon-pulse-cyan': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(6,182,212,0.4), 0 0 15px rgba(6,182,212,0.2)' },
          '50%': { boxShadow: '0 0 10px rgba(6,182,212,0.8), 0 0 30px rgba(6,182,212,0.5)' },
        },
        'card-appear': {
          from: { transform: 'scale(0.3) rotate(-15deg)', opacity: '0' },
          to: { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '15%': { transform: 'translateX(-6px) rotate(-2deg)' },
          '30%': { transform: 'translateX(6px) rotate(2deg)' },
          '45%': { transform: 'translateX(-5px) rotate(-1deg)' },
          '60%': { transform: 'translateX(5px) rotate(1deg)' },
          '75%': { transform: 'translateX(-3px)' },
          '90%': { transform: 'translateX(3px)' },
        },
        'event-popup': {
          '0%': { opacity: '0', transform: 'scale(0.4) translateY(20px)' },
          '15%': { opacity: '1', transform: 'scale(1.08) translateY(-5px)' },
          '30%': { transform: 'scale(1) translateY(0)' },
          '70%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9) translateY(-10px)' },
        },
        'score-flash': {
          '0%, 100%': { color: 'rgb(234, 179, 8)' },
          '50%': { color: '#ffffff' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100px) rotate(720deg)', opacity: '0' },
        },
        'float-in': {
          from: { opacity: '0', transform: 'translateY(15px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'title-glow': {
          '0%, 100%': { textShadow: '0 0 10px rgba(168,85,247,0.5), 0 0 30px rgba(168,85,247,0.3)' },
          '50%': { textShadow: '0 0 20px rgba(168,85,247,1), 0 0 60px rgba(168,85,247,0.6), 0 0 100px rgba(236,72,153,0.3)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'neon-pulse-cyan': 'neon-pulse-cyan 2s ease-in-out infinite',
        'card-appear': 'card-appear 0.3s ease-out both',
        shake: 'shake 0.4s ease-in-out',
        'event-popup': 'event-popup 2.5s ease-in-out forwards',
        'score-flash': 'score-flash 0.6s ease',
        'confetti-fall': 'confetti-fall 1.5s ease-in forwards',
        'float-in': 'float-in 0.4s ease-out both',
        'title-glow': 'title-glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
