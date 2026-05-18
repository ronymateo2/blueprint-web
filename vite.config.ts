import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		cloudflare(),
		VitePWA({
			registerType: "autoUpdate",
			injectRegister: "auto",
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
				cleanupOutdatedCaches: true,
			},
			manifest: {
				name: "Blueprint Habits",
				short_name: "Blueprint",
				description: "Rastreador de hábitos",
				theme_color: "#faf6ee",
				background_color: "#faf6ee",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				icons: [
					{ src: "/icon-192.png", sizes: "192x192", type: "image/png" },
					{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
				],
			},
		}),
	],
});
