import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../app/Header";
import { useAuth } from "../auth/AuthProvider";
import { PROVIDERS } from "../lib/providers";

export const SettingsPage = () => {
	const { user, loading, updateHandles, signOut } = useAuth();
	const [handles, setHandles] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		if (!user) return;
		setHandles(user.handles ?? {});
	}, [user]);

	if (!loading && !user) {
		return <Navigate to="/login" replace />;
	}

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			setSaving(true);
			setError("");
			setSuccess("");
			const cleaned = Object.fromEntries(
				Object.entries(handles)
					.map(([k, v]) => [k, v.trim()])
					.filter(([, v]) => v),
			);
			await updateHandles(cleaned);
			setHandles(cleaned);
			setSuccess("Settings saved.");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not save settings",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="app-shell">
			<Header />
			<main className="settings-content">
				<div className="settings-heading">
					<h1>Settings</h1>
					<p className="selectable">{user?.username}</p>
				</div>

				<section
					className="settings-section"
					aria-labelledby="handles-heading"
				>
					<h2 id="handles-heading">Platform Handles</h2>
					<p style={{ color: "var(--muted)", marginTop: 0 }}>
						Your usernames on each judge — used to auto-sync solved
						problems. LeetCode syncs your ~20 most recent accepted
						submissions; CSES and NeetCode are tracked manually.
					</p>
					<form onSubmit={onSubmit} className="settings-form">
						{PROVIDERS.map((provider) => (
							<div className="settings-field" key={provider.id}>
								<label htmlFor={`handle-${provider.id}`}>
									{provider.label} username
									{provider.mode === "partial" && (
										<span
											style={{
												color: "var(--muted)",
												fontWeight: "normal",
											}}
										>
											{" "}
											(recent only)
										</span>
									)}
								</label>
								<input
									id={`handle-${provider.id}`}
									value={handles[provider.id] ?? ""}
									onChange={(e) =>
										setHandles((prev) => ({
											...prev,
											[provider.id]: e.target.value,
										}))
									}
									disabled={saving}
									placeholder={
										provider.id === "leetcode"
											? (user?.username ?? "")
											: ""
									}
								/>
							</div>
						))}

						{error && (
							<div role="alert" style={{ color: "crimson" }}>
								{error}
							</div>
						)}
						{success && (
							<div role="status" style={{ color: "green" }}>
								{success}
							</div>
						)}

						<div className="settings-actions">
							<button
								type="submit"
								className="primary"
								disabled={saving}
							>
								{saving ? "Saving..." : "Save handles"}
							</button>
						</div>
					</form>
				</section>

				<section
					className="settings-section"
					aria-labelledby="account-heading"
				>
					<h2 id="account-heading">Account</h2>
					<button type="button" onClick={() => signOut()}>
						Sign out
					</button>
				</section>
			</main>
		</div>
	);
};
