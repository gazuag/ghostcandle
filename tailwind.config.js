export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'hsl(220, 13%, 9%)',
        bg: 'hsl(220, 15%, 6%)',
        fg: 'hsl(180, 10%, 90%)',
        neon: 'hsl(150, 80%, 45%)',
        ghost: 'hsl(195, 80%, 60%)',
        bull: 'hsl(142, 70%, 45%)',
        bear: 'hsl(0, 70%, 50%)',
      },
      boxShadow: {
        glow: '0 0 24px rgba(56, 248, 148, 0.22), 0 0 48px rgba(56, 248, 148, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'fade-in-up': 'fadeInUp 0.8s ease forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
