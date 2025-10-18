/** @type {import('tailwindcss').Config} */
export default {
      content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
      darkMode: 'class',
      theme: {
            extend: {
                  colors: {
                        telegram: {
                              blue: '#27a2e1',
                              'blue-dark': '#1e8bc4',
                              'light-blue': '#e8f4fd',
                              bg: '#ffffff',
                              'dark-bg': '#17212b',
                              'sidebar-bg': '#f5f5f5',
                              'dark-sidebar-bg': '#2b5278',
                        }
                  }
            },
      },
      plugins: [],
}


