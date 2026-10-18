import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	ArrowUpRight,
	Check,
	ChevronDown,
	Lightbulb,
} from "lucide-react";
import ProblemSetIcon from "../app/ProblemSetIcon";
import { problemSets } from "../data/problemSets";
import {
	DIFFICULTY_LABELS,
	JOURNEY_STEP_PARAM,
} from "../lib/journey.constants";
import { problemPlatformLinks } from "../lib/links";
import { getJourneyProgress } from "../lib/progress";
import type { LearningJourney, ProblemSet } from "../types/problems";
import "./journey-study.css";

type Props = {
	set: ProblemSet;
	journey: LearningJourney;
	solvedCodes: ReadonlySet<string>;
	savingCodes: ReadonlySet<string>;
	onToggle: (code: string) => void;
};

export default function JourneyStudyView({
	set,
	journey,
	solvedCodes,
	savingCodes,
	onToggle,
}: Props) {
	const location = useLocation();
	const navigate = useNavigate();
	const selectedCode = new URLSearchParams(location.search).get(
		JOURNEY_STEP_PARAM,
	);
	const problems = set.topics.flatMap((topic) => topic.problems);
	const stepNumbers = new Map(
		problems.map((problem, index) => [problem.code, index + 1]),
	);
	const progress = getJourneyProgress(
		problems.map((problem) => problem.code),
		solvedCodes,
	);
	const nextProblem = problems.find(
		(problem) => problem.code === progress.nextCode,
	);
	const selectedProblem = problems.find(
		(problem) => problem.code === selectedCode,
	);
	const milestones = set.topics.map((topic) => ({
		...topic,
		progress: getJourneyProgress(
			topic.problems.map((problem) => problem.code),
			solvedCodes,
		),
	}));

	useEffect(() => {
		const target =
			selectedCode && document.getElementById(`step-${selectedCode}`);
		if (target) {
			target.scrollIntoView({ block: "start" });
			target.focus({ preventScroll: true });
		} else {
			window.scrollTo({ top: 0 });
		}
	}, [location.key, selectedCode, set.slug]);

	return (
		<main className="journey-reader">
			<div className="journey-navigation">
				<Link to="/" className="journey-back">
					<ArrowLeft size={16} aria-hidden="true" /> All collections
				</Link>
				<div className="journey-switcher">
					<label htmlFor="learning-journey">Journey</label>
					<div className="journey-switcher-control">
						<ProblemSetIcon slug={set.slug} />
						<select
							id="learning-journey"
							value={set.slug}
							onChange={(event) =>
								navigate(`/sets/${event.target.value}`)
							}
						>
							{problemSets
								.filter((collection) => collection.journey)
								.map((collection) => (
									<option
										key={collection.slug}
										value={collection.slug}
									>
										{collection.title}
									</option>
								))}
						</select>
					</div>
				</div>
			</div>

			<header className="journey-intro">
				<div>
					<p className="journey-eyebrow">
						{progress.total} steps / {milestones.length} milestones
					</p>
					<h1>
						<ProblemSetIcon slug={set.slug} size={28} />
						<span>{set.title}</span>
					</h1>
					<p className="journey-outcome selectable">
						{journey.outcome}
					</p>
					<h2 className="journey-prerequisite-title">
						Before you start
					</h2>
					<ul className="journey-prerequisites">
						{journey.prerequisites.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
				<div className="journey-progress">
					<div className="journey-progress-label" role="status">
						<span>
							{progress.solved} / {progress.total} completed
						</span>
						<strong>{progress.percent}%</strong>
					</div>
					<progress
						value={progress.solved}
						max={progress.total || 1}
						aria-label={`${set.title} progress`}
					/>
					{nextProblem ? (
						<Link
							className="journey-continue"
							to={`?${JOURNEY_STEP_PARAM}=${nextProblem.code}`}
						>
							{progress.solved
								? "Continue journey"
								: "Start journey"}
							<ArrowRight size={18} aria-hidden="true" />
						</Link>
					) : (
						<p className="journey-complete" role="status">
							<Check size={18} aria-hidden="true" /> Journey
							complete
						</p>
					)}
					{nextProblem && (
						<p className="journey-next">Next: {nextProblem.name}</p>
					)}
				</div>
			</header>

			{selectedCode && !selectedProblem && (
				<p role="status" className="journey-invalid-step">
					That step is not in this journey.
				</p>
			)}

			<div className="journey-layout">
				<nav className="journey-milestones" aria-label="Milestones">
					<h2>Milestones</h2>
					<ol>
						{milestones.map((topic, index) => (
							<li key={topic.name}>
								<Link
									to={`?${JOURNEY_STEP_PARAM}=${topic.problems[0].code}`}
									aria-current={
										topic.problems.some(
											(problem) =>
												problem.code ===
												progress.nextCode,
										)
											? "step"
											: undefined
									}
								>
									<span className="journey-milestone-number">
										{String(index + 1).padStart(2, "0")}
									</span>
									<span>
										{topic.name}
										<small>
											{topic.progress.solved} /{" "}
											{topic.progress.total} completed
										</small>
									</span>
								</Link>
							</li>
						))}
					</ol>
				</nav>

				<div className="journey-curriculum">
					{milestones.map((topic, topicIndex) => (
						<section
							key={topic.name}
							className="journey-milestone"
							aria-labelledby={`milestone-${topicIndex}`}
						>
							<header className="journey-milestone-heading">
								<p className="journey-eyebrow">
									Milestone {topicIndex + 1} /{" "}
									{milestones.length}
								</p>
								<h2 id={`milestone-${topicIndex}`}>
									{topic.name}
								</h2>
								<p>{topic.description}</p>
							</header>
							<ol className="journey-steps">
								{topic.problems.map((problem) => (
									<li
										key={problem.code}
										id={`step-${problem.code}`}
										tabIndex={-1}
										className="journey-step"
										aria-current={
											problem.code === progress.nextCode
												? "step"
												: undefined
										}
									>
										<div className="journey-step-heading">
											<span
												className="journey-step-number"
												aria-label={`Step ${stepNumbers.get(problem.code)}`}
											>
												{String(
													stepNumbers.get(
														problem.code,
													),
												).padStart(2, "0")}
											</span>
											<button
												type="button"
												className={`problem-check ${solvedCodes.has(problem.code) ? "checked" : ""}`}
												role="checkbox"
												aria-checked={solvedCodes.has(
													problem.code,
												)}
												aria-label={`Mark ${problem.name} as ${solvedCodes.has(problem.code) ? "not solved" : "solved"}`}
												disabled={savingCodes.has(
													problem.code,
												)}
												onClick={() =>
													onToggle(problem.code)
												}
											/>
											<h3>
												<a
													href={problem.url}
													target="_blank"
													rel="noopener noreferrer"
													className="selectable"
												>
													{problem.name}
												</a>
											</h3>
											<span
												className="journey-difficulty"
												data-difficulty={
													problem.difficulty
												}
											>
												{
													DIFFICULTY_LABELS[
														problem.difficulty
													]
												}
											</span>
										</div>
										<p className="journey-connection selectable">
											{journey.connections[problem.code]}
										</p>
										<div className="journey-practice-links">
											{problemPlatformLinks(problem).map(
												(link) => (
													<a
														key={link.label}
														href={link.url}
														target="_blank"
														rel="noopener noreferrer"
														aria-label={`Practice ${problem.name} on ${link.label}`}
													>
														{link.label}
														<ArrowUpRight
															size={14}
															aria-hidden="true"
														/>
													</a>
												),
											)}
										</div>
										<details className="journey-hints">
											<summary
												aria-label={`Hints for ${problem.name}`}
											>
												<Lightbulb
													size={16}
													aria-hidden="true"
												/>
												<span>Hints</span>
												<ChevronDown
													size={15}
													aria-hidden="true"
												/>
											</summary>
											<div className="journey-hint-list">
												{problem.hints.map(
													(hint, hintIndex) => (
														<details
															key={hint}
															open={
																hintIndex === 0
															}
														>
															<summary>
																Hint{" "}
																{hintIndex + 1}
															</summary>
															<p className="selectable">
																{hint}
															</p>
														</details>
													),
												)}
											</div>
										</details>
									</li>
								))}
							</ol>
						</section>
					))}
				</div>
			</div>
		</main>
	);
}
