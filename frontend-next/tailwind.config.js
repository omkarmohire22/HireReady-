/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
    './src/app/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      spacing: {
        // 8px system for consistent spacing
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'xl2': '32px',
        'xl3': '40px',
        'xl4': '48px',
      },
      fontSize: {
        // Premium typography scale
        'xs': ['11px', { lineHeight: '16px', letterSpacing: '0.5px' }],
        'sm': ['13px', { lineHeight: '18px', letterSpacing: '0.3px' }],
        'base': ['15px', { lineHeight: '22px', letterSpacing: '0.2px' }],
        'lg': ['17px', { lineHeight: '24px', letterSpacing: '0px' }],
        'xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.3px' }],
        'xl2': ['24px', { lineHeight: '32px', letterSpacing: '-0.4px' }],
        'xl3': ['30px', { lineHeight: '36px', letterSpacing: '-0.5px' }],
        'xl4': ['36px', { lineHeight: '44px', letterSpacing: '-0.6px' }],
        'xl5': ['48px', { lineHeight: '56px', letterSpacing: '-0.8px' }],
      },
      fontWeight: {
        hairline: 100,
        thin: 200,
        extralight: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      },
      boxShadow: {
        // Subtle shadows for SaaS aesthetic
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'xs': '6px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xl2': '24px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}

