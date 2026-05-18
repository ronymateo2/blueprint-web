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
