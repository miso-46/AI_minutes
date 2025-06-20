/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        // デフォルトスタイルを上書き
        DEFAULT: {
          css: {
            h1: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            h2: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            h3: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            hr: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            p: {
              margin: '0.5rem 0',
              lineHeight: '1.5',
            },
            ol: {
              margin: '0rem 0',
              padding: '0rem 1.5rem',
              lineHeight: '1.5',
              whiteSpace: 'normal',
            },
            ul: {
              margin: '0',
              padding: '0rem 1.5rem',
              lineHeight: '1.5',
              whiteSpace: 'normal',
            },
            br: {
              lineHeight: '0', 
            }
            // その他要素も同様に書く
          },
        },
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
