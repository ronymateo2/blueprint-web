import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import "./design/global.css";
import { App } from "./App.tsx";

// Auto-update: when new SW is ready, reload the page immediately
registerSW({
	onRegisteredSW(_swUrl, registration) {
		if (registration) {
			// Poll every 60 s to detect new deployments
			setInterval(() => registration.update(), 60_000);
		}
	},
	onNeedRefresh() {
		window.location.reload();
	},
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
