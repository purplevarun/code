import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export const LoginPage = () => {
	const [step, setStep] = useState<
		"username" | "password-signin" | "password-signup"
	>("username");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [leetcodeUsername, setLeetcodeUsername] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { checkUsernameExists, signIn, signUp, user } = useAuth();
	const navigate = useNavigate();

	if (user) {
		return <Navigate to="/" replace />;
	}

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			setLoading(true);
			setError("");

			if (step === "username") {
				const exists = await checkUsernameExists(username);
				setPassword("");
				setStep(exists ? "password-signin" : "password-signup");
			} else if (step === "password-signin") {
				await signIn(username, password);
				navigate("/");
			} else {
				if (password.length < 6) {
					throw new Error("Password must be at least 6 characters");
				}
				await signUp(username, password, leetcodeUsername);
				navigate("/");
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Authentication failed",
			);
		} finally {
			setLoading(false);
		}
	};

	const isUsernameStep = step === "username";
	const isSigninStep = step === "password-signin";
	const isSignupStep = step === "password-signup";

	return (
		<div className="app-shell">
			<div
				className="card"
				style={{ maxWidth: 480, margin: "120px auto 0" }}
			>
				<h1 style={{ marginTop: 0 }}>Login</h1>
				<p style={{ color: "var(--muted)" }}>
					{isUsernameStep && "Enter your username first."}
					{isSigninStep &&
						`Welcome back ${username.trim()}. Enter your password.`}
					{isSignupStep &&
						`${username.trim()} is new. Create a password.`}
				</p>
				<form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
					<div style={{ display: "grid", gap: 6 }}>
						<label htmlFor="username">Username</label>
						<input
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={!isUsernameStep || loading}
						/>
					</div>

					{!isUsernameStep && (
						<div style={{ display: "grid", gap: 6 }}>
							<label htmlFor="password">Password</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={loading}
							/>
						</div>
					)}

					{isSignupStep && (
						<div style={{ display: "grid", gap: 6 }}>
							<label htmlFor="leetcode-username">
								LeetCode username{" "}
								<span style={{ color: "var(--muted)" }}>
									(optional)
								</span>
							</label>
							<input
								id="leetcode-username"
								value={leetcodeUsername}
								onChange={(e) =>
									setLeetcodeUsername(e.target.value)
								}
								disabled={loading}
								placeholder="for automatic progress sync"
							/>
						</div>
					)}

					{error && <div style={{ color: "crimson" }}>{error}</div>}
					<button
						type="submit"
						className="primary"
						disabled={loading}
					>
						{isUsernameStep &&
							(loading ? "Checking..." : "Continue")}
						{isSigninStep &&
							(loading ? "Signing in..." : "Sign in")}
						{isSignupStep &&
							(loading
								? "Creating account..."
								: "Create account")}
					</button>

					{!isUsernameStep && (
						<button
							type="button"
							disabled={loading}
							onClick={() => {
								setError("");
								setPassword("");
								setStep("username");
							}}
						>
							Use different username
						</button>
					)}
				</form>
			</div>
		</div>
	);
};
