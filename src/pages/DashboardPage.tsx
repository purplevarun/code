import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../app/Header";
import { useAuth } from "../auth/AuthProvider";
import { countProblems, problemSets } from "../data/problemSets";
import { supabase, supabaseConfigError } from "../lib/supabase";
import { syncUser, type SyncResultLine } from "../lib/sync";

const tileDescriptions: Record<string, string> = {
	"all-dsa-questions": "Every coding problem, without duplicates.",
	"free-dsa-essentials": "100 free exercises across seven platforms.",
	"neetcode-150": "Core interview patterns, step by step.",
	"top-interview": "Frequently asked coding interview problems.",
	"blind-75": "High-frequency interview fundamentals.",
	cses: "Competitive programming essentials.",
	lld: "Judged class design and concurrency practice.",
	hld: "Amazon, Netflix, BookMyShow, and system design.",
};

const today = () => new Date().toISOString().slice(0, 10);

export const DashboardPage = () => {
	const { user } = useAuth();
	const [solvedCountBySet, setSolvedCountBySet] = useState<
		Record<string, number>
	>({});
	const [syncing, setSyncing] = useState(false);
	const [syncError, setSyncError] = useState("");
	const [syncLines, setSyncLines] = useState<SyncResultLine[]>([]);
	const [syncCount, setSyncCount] = useState<number | null>(null);
	const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
	const [nudgeDismissed, setNudgeDismissed] = useState(true);

	const totalCountBySet = useMemo(() => {
		return problemSets.reduce<Record<string, number>>((acc, set) => {
			acc[set.slug] = countProblems(set);
			return acc;
		}, {});
	}, []);

	const loadProgress = useCallback(async () => {
		if (!user || !supabase) {
			setSolvedCountBySet({});
			return;
		}

		const { data, error } = await supabase
			.from("users")
			.select("problemsSolved")
			.eq("id", user.id)
			.single();

		if (error) {
			setSolvedCountBySet({});
			return;
		}

		const solvedCodeSet = new Set(
			((data?.problemsSolved ?? []) as string[]).filter(Boolean),
		);

		const nextCounts = problemSets.reduce<Record<string, number>>(
			(acc, set) => {
				const uniqueCodes = new Set<string>();
				for (const topic of set.topics) {
					for (const problem of topic.problems) {
						uniqueCodes.add(problem.code);
					}
				}

				let solved = 0;
				for (const code of uniqueCodes) {
					if (solvedCodeSet.has(code)) solved += 1;
				}

				acc[set.slug] = solved;
				return acc;
			},
			{},
		);

		setSolvedCountBySet(nextCounts);
	}, [user]);

	useEffect(() => {
		loadProgress();
	}, [loadProgress]);

	useEffect(() => {
		if (!user) {
			setLastSyncedAt(null);
			setNudgeDismissed(true);
			return;
		}

		const key = `purpledsa-last-synced-at:${user.id}`;
		setLastSyncedAt(localStorage.getItem(key));
	}, [user]);

	// Once-a-day nudge to set a LeetCode handle when none is configured.
	const showLeetcodeNudge = useMemo(() => {
		if (!user || nudgeDismissed) return false;
		return !(user.handles?.leetcode || "").trim();
	}, [user, nudgeDismissed]);

	useEffect(() => {
		if (!user) return;
		const key = `purpledsa-lc-nudge-dismissed:${user.id}`;
		setNudgeDismissed(localStorage.getItem(key) === today());
	}, [user]);

	const dismissNudge = () => {
		if (!user) return;
		localStorage.setItem(
			`purpledsa-lc-nudge-dismissed:${user.id}`,
			today(),
		);
		setNudgeDismissed(true);
	};

	const syncProgress = async (isAuto: boolean) => {
		if (!user) {
			setSyncError("Sign in to sync progress");
			return;
		}

		const configuredHandles = Object.values(user.handles ?? {}).some((h) =>
			(h || "").trim(),
		);
		if (!configuredHandles) {
			setSyncError("Add a platform handle in Settings first");
			return;
		}

		if (!supabase) {
			setSyncError(`Supabase is not configured. ${supabaseConfigError}`);
			return;
		}

		try {
			setSyncing(true);
			setSyncError("");
			setSyncLines([]);
			setSyncCount(null);

			const { lines, written } = await syncUser(user.id, user.handles);

			await loadProgress();

			const syncedAt = new Date().toISOString();
			localStorage.setItem(
				`purpledsa-last-synced-at:${user.id}`,
				syncedAt,
			);
			setLastSyncedAt(syncedAt);

			setSyncLines(lines);
			setSyncCount(written);
			if (!lines.length) {
				setSyncError(
					`${isAuto ? "Auto sync" : "Sync"}: no provider handles configured`,
				);
			}
		} catch (err) {
			setSyncError(
				err instanceof Error ? err.message : "Could not sync progress",
			);
		} finally {
			setSyncing(false);
		}
	};

	useEffect(() => {
		if (!user) return;

		const key = `purpledsa-last-auto-sync-date:${user.id}`;
		const date = today();
		const lastAutoSyncDate = localStorage.getItem(key);
		if (lastAutoSyncDate === date) return;

		localStorage.setItem(key, date);
		syncProgress(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	return (
		<div className="app-shell dashboard-shell">
			<Header
				onSync={() => syncProgress(false)}
				syncing={syncing}
				lastSyncedAt={lastSyncedAt}
			/>

			{showLeetcodeNudge && (
				<div className="dashboard-status" role="status">
					<p className="dashboard-status-success">
						Add your LeetCode username to auto-sync progress.{" "}
						<Link to="/settings">Set it up</Link>{" "}
						<button
							type="button"
							onClick={dismissNudge}
							style={{
								background: "none",
								border: "none",
								color: "inherit",
								cursor: "pointer",
								textDecoration: "underline",
								padding: 0,
								font: "inherit",
							}}
						>
							Remind me tomorrow
						</button>
					</p>
				</div>
			)}

			<div className="dashboard-status" aria-live="polite">
				{syncError && (
					<p className="dashboard-status-error" title={syncError}>
						{syncError}
					</p>
				)}
				{syncCount !== null && (
					<p
						className="dashboard-status-success"
						title="Sync finished"
					>
						Sync complete — {syncCount} problem(s) marked.
						{syncLines.map((line) => (
							<span
								key={line.provider}
								style={{ display: "block" }}
							>
								{line.label}: {line.matched} matched
								{line.note ? ` (${line.note})` : ""}
							</span>
						))}
					</p>
				)}
			</div>

			<div className="grid dashboard-grid">
				{problemSets.map((set) => (
					<Link
						key={set.slug}
						to={`/sets/${set.slug}`}
						className="dashboard-set-link"
					>
						<div className="card dashboard-set-card">
							<h3>{set.title}</h3>
							<p title={set.description}>
								{tileDescriptions[set.slug] ?? set.description}
							</p>
							<small>
								{solvedCountBySet[set.slug] || 0}/
								{totalCountBySet[set.slug]} solved ·{" "}
								{set.topics.length} topics
							</small>
						</div>
					</Link>
				))}
			</div>

			<footer className="dashboard-footer">
				Built by{" "}
				<a
					href="https://github.com/purplevarun"
					target="_blank"
					rel="noreferrer"
				>
					purplevarun
				</a>
			</footer>
		</div>
	);
};
