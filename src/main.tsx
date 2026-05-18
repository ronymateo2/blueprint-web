import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import "./design/global.css";
import { App } from "./App.tsx";

if (import.meta.env.PROD) {
	registerSW({
		onRegisteredSW(_swUrl, registration) {
			if (registration) {
				setInterval(() => registration.update(), 60_000);
			}
		},
		onNeedRefresh() {
			window.location.reload();
		},
	});
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

requestAnimationFrame(() => {
	requestAnimationFrame(() => {
		const splash = document.getElementById("splash");
		const root = document.getElementById("root");

		// Splash: scale up + fade out (like iOS app open)
		if (splash) {
			splash.style.transition = "opacity 0.5s cubic-bezier(0.4,0,1,1), transform 0.5s cubic-bezier(0.4,0,1,1)";
			splash.style.opacity = "0";
			splash.style.transform = "scale(1.06)";
			setTimeout(() => splash.remove(), 500);
		}

		// Content: slide up + fade in, starts 80ms after splash begins exiting
		setTimeout(() => {
			if (root) {
				root.style.transition = "opacity 0.5s cubic-bezier(0,0,0.2,1), transform 0.5s cubic-bezier(0,0,0.2,1)";
				root.style.opacity = "1";
				root.style.transform = "translateY(0)";
			}
		}, 80);
	});
});
