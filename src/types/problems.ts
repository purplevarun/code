export type Difficulty = "E" | "M" | "H";

export interface StudyGuide {
	summary: string;
	aliases?: string[];
	reviewedAt: string;
	prerequisites: string[];
	clarifyingQuestions: string[];
	deepDives: Array<{
		title: string;
		paragraphs: string[];
		invariant: string;
		followUp: { question: string; answer: string };
	}>;
	operations: {
		signals: Array<{ name: string; measure: string; response: string }>;
		security: string[];
		validation: string[];
	};
	requirements: {
		functional: string[];
		nonFunctional: string[];
		outOfScope: string[];
	};
	capacity: {
		assumptions: string[];
		estimates: Array<{
			label: string;
			calculation: string;
			implication: string;
		}>;
	};
	api: Array<{ signature: string; purpose: string }>;
	dataModel: Array<{ entity: string; fields: string; notes: string }>;
	architecture: {
		diagram: string;
		flows: Array<{ name: string; steps: string[] }>;
	};
	decisions: Array<{ topic: string; choice: string; tradeOff: string }>;
	failureModes: Array<{ scenario: string; handling: string }>;
	selfCheck: Array<{ question: string; answer: string }>;
	resources: Array<{
		kind: "article" | "video";
		title: string;
		author: string;
		url: string;
		why: string;
	}>;
}

export interface Problem {
	id: string;
	code: string;
	order: number;
	slug: string;
	name: string;
	difficulty: Difficulty;
	url: string;
	locked: boolean;
	hints: string[];
	gfgUrl?: string;
	studyGuide?: StudyGuide;
}

export interface ProblemTopic {
	name: string;
	description?: string;
	problems: Problem[];
}

export interface LearningJourney {
	prerequisites: string[];
	outcome: string;
	connections: Record<string, string>;
}

export interface ProblemSet {
	slug: string;
	title: string;
	description: string;
	featured?: boolean;
	journey?: LearningJourney;
	topics: ProblemTopic[];
}
