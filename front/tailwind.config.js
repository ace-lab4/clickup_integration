/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {    
    screens: {
    'sm': {'min': '320px', 'max': '767px'},
    // => @media (min-width: 320px and max-width: 767px) { ... }

    'md': {'min': '768px', 'max': '1020px'},
    // => @media (min-width: 768px and max-width: 1023px) { ... }

    'lg': {'min': '1021px', 'max': '1279px'},
    // => @media (min-width: 1024px and max-width: 1279px) { ... }

    'xl': {'min': '1280px', 'max': '1535px'},
    // => @media (min-width: 1280px and max-width: 1535px) { ... }

    '2xl': {'min': '1536px'},
    // => @media (min-width: 1536px) { ... }
  },
    extend: {},
  },
  plugins: [],
}

