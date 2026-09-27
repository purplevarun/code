import { useEffect, useMemo, useState } from "react";
import Header from "../app/Header";
import { uniqueSolvedCount } from "../lib/progress";
import { supabase, supabaseConfigError } from "../lib/supabase";

type LeaderboardUser = {
	id: string;
	username: string;
	problemsSolved?: string[] | null;
	otherDetails?: { name?: string } | null;
};

type LeaderboardEntry = {
	id: string;
	username: string;
	name?: string | null;
	solvedCount: number;
};

export const LeaderboardPage = () => {
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const load = async () => {
			try {
				setError("");

				if (!supabase) {
					throw new Error(
						`Supabase is not configured. ${supabaseConfigError}`,
					);
				}

				const { data: users, error: userError } = await supabase
					.from("users")
					.select("id, username, problemsSolved, otherDetails");

				if (userError) throw new Error("Could not load users");

				const next = ((users ?? []) as LeaderboardUser[])
					.map((u) => ({
						id: u.id,
						username: u.username,
						name: u.otherDetails?.name ?? null,
						solvedCount: uniqueSolvedCount(u.problemsSolved ?? []),
					}))
					.sort((a, b) => {
						if (b.solvedCount !== a.solvedCount)
							return b.solvedCount - a.solvedCount;
						return a.username.localeCompare(b.username);
					});

				setEntries(next);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Could not load leaderboard",
				);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	const hasEntries = useMemo(() => entries.length > 0, [entries]);

	return (
		<div className="app-shell">
			<Header />

			<section className="card">
				<h1 style={{ marginTop: 0 }}>Leaderboard</h1>
				<p style={{ color: "var(--muted)" }}>
					Ranking by unique solved problems.
				</p>

				{loading && <p>Loading leaderboard...</p>}
				{error && <p style={{ color: "crimson" }}>{error}</p>}

				{!loading && !error && hasEntries && (
					<div
						className="leaderboard-table selectable"
						role="table"
						aria-label="Leaderboard"
					>
						<div className="leaderboard-head" role="row">
							<div>#</div>
							<div>User</div>
							<div>Solved</div>
						</div>
						{entries.map((entry, index) => (
							<div
								className="leaderboard-row"
								role="row"
								key={entry.id}
							>
								<div>{index + 1}</div>
								<div>{entry.name || entry.username}</div>
								<div>{entry.solvedCount}</div>
							</div>
						))}
					</div>
				)}

				{!loading && !error && !hasEntries && (
					<p>No users found yet.</p>
				)}
			</section>
		</div>
	);
};
