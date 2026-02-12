/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#5b13ec",
                "primary-hover": "#4a0ec4",
                "background-light": "#f6f6f8",
                "background-dark": "#161022",
                "surface-dark": "#1e162e",
                "gold": "#fbbf24",
                "puzzle-red": "#ef4444",
                "puzzle-blue": "#3b82f6",
                "puzzle-green": "#22c55e",
                "puzzle-yellow": "#eab308",
                "puzzle-purple": "#a855f7",
                "puzzle-pink": "#ec4899",
            },
            fontFamily: {
                "display": ["Spline Sans", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px" },
            boxShadow: {
                "glow": "0 0 15px -3px rgba(91, 19, 236, 0.5)",
            },
        },
    },
    plugins: [],
}
