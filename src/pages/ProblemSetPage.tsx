import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "../app/Header";
import { useAuth } from "../auth/AuthProvider";
import { problemSets } from "../data/problemSets";
import {
	getPracticePlatform,
	practicePlatforms,
	problemPlatformLinks,
} from "../lib/links";
import { supabase, supabaseConfigError } from "../lib/supabase";

const HldStudyView = lazy(() => import("./HldStudyView"));

export const ProblemSetPage = () => {
	const { slug } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const { user } = useAuth();
	const set = problemSets.find((item) => item.slug === slug);
	const [solvedCodes, setSolvedCodes] = useState<Set<string>>(new Set());
	const [savingCodes, setSavingCodes] = useState<Set<string>>(new Set());
	const [error, setError] = useState("");

	useEffect(() => {
		const loadSolved = async () => {
			if (!set || !user || !supabase) {
				setSolvedCodes(new Set());
				return;
			}

			const { data, error } = await supabase
				.from("users")
				.select("problemsSolved")
				.eq("id", user.id)
				.single();

			if (error) {
				setSolvedCodes(new Set());
				setError("Could not load saved progress");
				return;
			}

			setError("");
			setSolvedCodes(new Set((data?.problemsSolved ?? []) as string[]));
		};

		loadSolved();
	}, [set, user]);

	const toggleSolved = async (problemCode: string) => {
		if (!user) {
			setError("Sign in to track your progress");
			return;
		}
		if (!supabase) {
			setError(`Supabase is not configured. ${supabaseConfigError}`);
			return;
		}

		const currentlySolved = solvedCodes.has(problemCode);
		setError("");
		setSavingCodes((prev) => new Set(prev).add(problemCode));

		setSolvedCodes((prev) => {
			const next = new Set(prev);
			if (currentlySolved) next.delete(problemCode);
			else next.add(problemCode);
			return next;
		});

		const { error: rpcError } = await supabase.rpc(
			currentlySolved ? "remove_solved" : "add_solved",
			{ p_user_id: user.id, p_slug: problemCode },
		);

		const requestError = rpcError ? "Could not update progress" : null;

		if (requestError) {
			setSolvedCodes((prev) => {
				const next = new Set(prev);
				if (currentlySolved) next.add(problemCode);
				else next.delete(problemCode);
				return next;
			});
			setError(requestError);
		}

		setSavingCodes((prev) => {
			const next = new Set(prev);
			next.delete(problemCode);
			return next;
		});
	};

	if (!set) {
		return (
			<div className="app-shell">
				<Header />
				<h1>Problem set not found</h1>
				<Link to="/">Browse problem sets</Link>
			</div>
		);
	}

	if (set.slug === "hld") {
		return (
			<div className="app-shell hld-shell">
				<Header />
				{error && (
					<p role="alert" className="study-error">
						{error}
					</p>
				)}
				<Suspense
					fallback={<p role="status">Loading study guides...</p>}
				>
					<HldStudyView
						set={set}
						solvedCodes={solvedCodes}
						savingCodes={savingCodes}
						onToggle={toggleSolved}
					/>
				</Suspense>
			</div>
		);
	}

	const availablePlatforms = practicePlatforms.filter((platform) =>
		set.topics.some((topic) =>
			topic.problems.some(
				(problem) =>
					getPracticePlatform(problem.url)?.id === platform.id,
			),
		),
	);
	const requestedPlatform = searchParams.get("platform") ?? "";
	const selectedPlatform = availablePlatforms.some(
		(platform) => platform.id === requestedPlatform,
	)
		? requestedPlatform
		: "";
	const visibleTopics = set.topics
		.map((topic) => ({
			...topic,
			problems: topic.problems.filter(
				(problem) =>
					!selectedPlatform ||
					getPracticePlatform(problem.url)?.id === selectedPlatform,
			),
		}))
		.filter((topic) => topic.problems.length);
	const visibleCount = visibleTopics.reduce(
		(total, topic) => total + topic.problems.length,
		0,
	);

	return (
		<div className="app-shell">
			<Header />
			<h1>{set.title}</h1>
			<p style={{ color: "var(--muted)" }}>{set.description}</p>
			{error && <p style={{ color: "crimson" }}>{error}</p>}
			{availablePlatforms.length > 1 && (
				<div className="problem-set-toolbar">
					<label htmlFor="problem-platform">Platform</label>
					<select
						id="problem-platform"
						value={selectedPlatform}
						onChange={(event) => {
							const next = new URLSearchParams(searchParams);
							if (event.target.value)
								next.set("platform", event.target.value);
							else next.delete("platform");
							setSearchParams(next);
						}}
					>
						<option value="">All platforms</option>
						{availablePlatforms.map((platform) => (
							<option key={platform.id} value={platform.id}>
								{platform.name}
							</option>
						))}
					</select>
					<span role="status">{visibleCount} exercises</span>
				</div>
			)}
			<div className="problem-topics">
				{visibleTopics.map((topic) => (
					<div key={topic.name} style={{ marginBottom: 16 }}>
						<h3>{topic.name}</h3>
						<div style={{ display: "grid", gap: 8 }}>
							{topic.problems.map((problem) => (
								<div key={problem.id} className="problem-row">
									<button
										type="button"
										className={`problem-check ${solvedCodes.has(problem.code) ? "checked" : ""}`}
										role="checkbox"
										aria-checked={solvedCodes.has(
											problem.code,
										)}
										onClick={() =>
											toggleSolved(problem.code)
										}
										disabled={savingCodes.has(problem.code)}
										aria-label={`Mark ${problem.name} as solved`}
									/>
									<a
										className="problem-name selectable"
										href={problem.url}
										target="_blank"
										rel="noreferrer"
									>
										{problem.name}
									</a>
									<div className="platform-links">
										{problemPlatformLinks(problem).map(
											(link) => (
												<a
													key={link.label}
													href={link.url}
													target="_blank"
													rel="noreferrer"
												>
													{link.label}
												</a>
											),
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
