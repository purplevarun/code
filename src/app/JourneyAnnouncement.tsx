// remove by end of 2026
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Route, X } from "lucide-react";

const STORAGE_KEY = "purplecode-journeys-announcement-seen";

export default function JourneyAnnouncement() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		try {
			if (window.localStorage.getItem(STORAGE_KEY)) return;
			window.localStorage.setItem(STORAGE_KEY, "shown");
		} catch {
			// Storage can be disabled; the announcement must not block the app.
		}
		setVisible(true);
	}, []);

	if (!visible) return null;

	const dismiss = () => setVisible(false);

	return (
		<aside
			role="status"
			aria-labelledby="journeys-announcement-title"
			className="card"
			style={{
				position: "fixed",
				right: 16,
				bottom: 16,
				zIndex: 50,
				width: "min(400px, calc(100vw - 32px))",
				maxHeight: "calc(100dvh - 32px)",
				overflowY: "auto",
				borderRadius: 8,
				padding: 20,
				boxShadow: "0 8px 28px rgb(0 0 0 / 0.18)",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
				<Route
					size={22}
					aria-hidden="true"
					style={{ flexShrink: 0, color: "var(--journey-accent)" }}
				/>
				<h2
					id="journeys-announcement-title"
					style={{
						margin: 0,
						flex: 1,
						minWidth: 0,
						fontSize: 16,
						lineHeight: 1.5,
						overflowWrap: "anywhere",
					}}
				>
					Introducing Journeys
				</h2>
				<button
					type="button"
					onClick={dismiss}
					aria-label="Dismiss journey announcement"
					title="Dismiss"
					style={{
						display: "grid",
						placeItems: "center",
						width: 32,
						height: 32,
						flexShrink: 0,
						padding: 0,
						borderRadius: 6,
					}}
				>
					<X size={16} aria-hidden="true" />
				</button>
			</div>
			<p
				style={{
					color: "var(--muted)",
					fontSize: 12,
					lineHeight: 1.8,
					margin: "12px 0 16px",
				}}
			>
				Follow the journey of a data structure to learn and understand
				it, one problem at a time.
			</p>
			<Link
				to="/"
				onClick={dismiss}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: 10,
					minHeight: 40,
					padding: "8px 12px",
					borderRadius: 6,
					background: "var(--fg)",
					color: "var(--bg)",
					fontSize: 12,
					textDecoration: "none",
				}}
			>
				Explore journeys <ArrowRight size={16} aria-hidden="true" />
			</Link>
		</aside>
	);
}
