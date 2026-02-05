import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0f17',
        surface: '#121826',
        surfaceGlow: '#1b2436',
        accent: '#7dd3fc',
        muted: '#94a3b8',
        nba: '#F58426',
        nfl: '#013369',
        mlb: '#CE1141',
        nhl: '#111111'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(125,211,252,0.2), 0 18px 40px rgba(15,23,42,0.6)'
      },
      keyframes: {
        pulseLow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.04)', opacity: '0.7' }
        },
        pop: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        shake: {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '50%': { transform: 'translateX(6px)' },
          '75%': { transform: 'translateX(-4px)' },
          '100%': { transform: 'translateX(0)' }
        }
      },
      animation: {
        pulseLow: 'pulseLow 1s ease-in-out infinite',
        pop: 'pop 0.35s ease-out',
        shake: 'shake 0.25s ease-in-out'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
