import type { Problem, ProblemSet, StudyGuide } from "@/types/problems";

import problemsRaw from "./dsa_problems.json?raw";
import allDsaRaw from "./problem_sets/all-dsa-questions.json?raw";
import blind75Raw from "./problem_sets/blind-75.json?raw";
import csesRaw from "./problem_sets/cses.json?raw";
import freeEssentialsRaw from "./problem_sets/free-dsa-essentials.json?raw";
import hldRaw from "./problem_sets/hld.json?raw";
import lldRaw from "./problem_sets/lld.json?raw";
import neetcode150Raw from "./problem_sets/neetcode-150.json?raw";
import topInterviewRaw from "./problem_sets/top-interview.json?raw";

export const ALL_DSA_SET_SLUG = "all-dsa-questions";
export const FREE_PRACTICE_SET_SLUG = "free-dsa-essentials";

type ProblemRecord = {
	id: string;
	code: string;
	slug?: string;
	name: string;
	difficulty: "E" | "M" | "H";
	url: string;
	locked: boolean;
	hints: string[];
	gfgUrl?: string;
};

type ProblemSetReference = {
	slug: string;
	title: string;
	description: string;
	guides?: Record<string, StudyGuide>;
	topics: Array<{
		name: string;
		problemCodes: string[];
	}>;
};

const problemRecords = JSON.parse(problemsRaw) as ProblemRecord[];
const problemSetReferences = [
	JSON.parse(allDsaRaw),
	JSON.parse(freeEssentialsRaw),
	JSON.parse(neetcode150Raw),
	JSON.parse(topInterviewRaw),
	JSON.parse(blind75Raw),
	JSON.parse(csesRaw),
	JSON.parse(lldRaw),
	JSON.parse(hldRaw),
] as ProblemSetReference[];

const problemByCode = new Map<string, ProblemRecord>(
	problemRecords.map((problem) => [problem.code, problem]),
);

const buildProblem = (
	problem: ProblemRecord,
	order: number,
	studyGuide?: StudyGuide,
): Problem => {
	return {
		id: problem.id,
		code: problem.code,
		order,
		slug: problem.slug || problem.code,
		name: problem.name,
		difficulty: problem.difficulty,
		url: problem.url,
		locked: problem.locked,
		hints: problem.hints,
		gfgUrl: problem.gfgUrl,
		studyGuide,
	};
};

export const problemSets: ProblemSet[] = problemSetReferences.map((setRef) => ({
	slug: setRef.slug,
	title: setRef.title,
	description: setRef.description,
	topics: setRef.topics.map((topic) => ({
		name: topic.name,
		problems: topic.problemCodes
			.map((code, index) => {
				const match = problemByCode.get(code);
				if (!match) {
					return null;
				}
				return buildProblem(match, index + 1, setRef.guides?.[code]);
			})
			.filter((problem): problem is Problem => Boolean(problem)),
	})),
}));

export const getProblemSet = (slug: string): ProblemSet | undefined => {
	return problemSets.find((s) => s.slug === slug);
};

export const countProblems = (set: ProblemSet): number => {
	return set.topics.reduce((sum, t) => sum + t.problems.length, 0);
};

export const totalProblemCount = (): number => {
	return problemSets.reduce((sum, s) => sum + countProblems(s), 0);
};
