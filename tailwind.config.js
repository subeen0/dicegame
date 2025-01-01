// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dosgothic': ['DOSGothic', 'sans-serif'],  // 'DOSGothic' 폰트 설정
      },
    },
  },
  plugins: [],
};
