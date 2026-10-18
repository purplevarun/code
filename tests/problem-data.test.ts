import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PROBLEM_SET_ICONS } from "../src/lib/problem-set.constants.ts";
import type {
	LearningJourney,
	ProblemSet,
	StudyGuide,
} from "../src/types/problems.ts";
import { createSearchIndex, searchCatalog } from "../src/lib/search.ts";

import {
	getPracticePlatform,
	practicePlatforms,
	problemPlatformLinks,
} from "../src/lib/links.ts";

type ProblemRecord = {
	id: string;
	code: string;
	name: string;
	url: string;
	locked: boolean;
	hints: string[];
	gfgUrl?: string;
};

type SheetReference = {
	slug: string;
	title: string;
	access?: string;
	journey?: LearningJourney;
	topics: Array<{
		name: string;
		description?: string;
		problemCodes: string[];
	}>;
	guides?: Record<string, StudyGuide>;
};

const problems: ProblemRecord[] = JSON.parse(
	readFileSync(
		new URL("../src/data/dsa_problems.json", import.meta.url),
		"utf8",
	),
);
const essentials: SheetReference = JSON.parse(
	readFileSync(
		new URL(
			"../src/data/problem_sets/free-dsa-essentials.json",
			import.meta.url,
		),
		"utf8",
	),
);
const hld: SheetReference = JSON.parse(
	readFileSync(
		new URL("../src/data/problem_sets/hld.json", import.meta.url),
		"utf8",
	),
);
const lld: SheetReference = JSON.parse(
	readFileSync(
		new URL("../src/data/problem_sets/lld.json", import.meta.url),
		"utf8",
	),
);
const hldCodes = hld.topics.flatMap((topic) => topic.problemCodes);
const lldCodes = lld.topics.flatMap((topic) => topic.problemCodes);
const byCode = new Map(problems.map((problem) => [problem.code, problem]));
const essentialsCodes = essentials.topics.flatMap(
	(topic) => topic.problemCodes,
);

const searchDirectory = new URL("../src/data/problem_sets/", import.meta.url);
const journeys: SheetReference[] = readdirSync(searchDirectory)
	.filter((filename) => filename.endsWith("-journey.json"))
	.map((filename) =>
		JSON.parse(readFileSync(new URL(filename, searchDirectory), "utf8")),
	);
const journeyCodes = journeys.flatMap((journey) =>
	journey.topics.flatMap((topic) => topic.problemCodes),
);

test(`interview curriculum covers ${journeys.length} journeys, ${journeyCodes.length} steps and ${new Set(journeyCodes).size} unique problems`, () => {
	const coverage: Record<string, string[][]> = {
		"stack-journey": [
			[
				"evaluate-reverse-polish-notation",
				"infix-to-postfix-conversion",
				"decode-string",
			],
			["insert-at-bottom-of-stack", "reverse-a-stack", "sort-a-stack"],
			[
				"nearest-greater-to-left",
				"next-greater-element",
				"nearest-smaller-to-left",
				"next-smaller-element",
			],
			[
				"stock-span",
				"largest-rectangle-in-histogram",
				"trapping-rain-water",
			],
			["remove-k-digits", "asteroid-collision"],
		],
		"queue-journey": [
			["design-circular-queue", "design-circular-deque"],
			["sliding-window-maximum", "design-minmax-queue"],
			["course-schedule", "course-schedule-ii", "word-ladder"],
		],
		"heap-journey": [
			["min-heap-implementation", "heap-sort"],
			["kth-smallest-element-in-an-array", "top-k-frequent-words"],
			["merge-k-sorted-arrays", "find-k-pairs-with-smallest-sums"],
			["find-median-from-data-stream", "sliding-window-median"],
			["reorganize-string", "task-scheduler", "dijkstras-algorithm"],
		],
		"dynamic-programming-journey": [
			["climbing-stairs", "house-robber", "maximum-product-subarray"],
			["cses-1158", "subset-sum-equals-to-target", "target-sum"],
			[
				"unbounded-knapsack",
				"rod-cutting",
				"coin-change",
				"coin-change-ii",
			],
			["unique-paths-ii", "minimum-falling-path-sum", "ninjas-training"],
			[
				"longest-increasing-subsequence",
				"longest-common-subsequence",
				"distinct-subsequences",
			],
			["edit-distance", "interleaving-string", "wildcard-matching"],
			[
				"best-time-to-buy-and-sell-stock-ii",
				"best-time-to-buy-and-sell-stock-with-cooldown",
				"best-time-to-buy-and-sell-stock-with-transaction-fee",
			],
			[
				"matrix-chain-multiplication",
				"burst-balloons",
				"palindrome-partitioning-ii",
			],
			["longest-increasing-path-in-a-matrix"],
		],
		"arrays-strings-journey": [
			["two-sum", "group-anagrams"],
			[
				"encode-and-decode-strings",
				"find-the-index-of-the-first-occurrence-in-a-string",
			],
			["count-subarrays-with-given-sum", "largest-subarray-with-sum-0"],
			["valid-palindrome", "3sum"],
			["maximum-average-subarray-i", "minimum-window-substring"],
			["rotate-image", "set-matrix-zeroes", "game-of-life"],
		],
		"searching-sorting-journey": [
			["merge-sort", "quick-sort", "sort-colors"],
			[
				"search-insert-position",
				"find-first-and-last-position-of-element-in-sorted-array",
			],
			["search-in-rotated-sorted-array", "search-a-2d-matrix-ii"],
			["koko-eating-bananas", "book-allocation-problem"],
			["cses-1646", "cses-1648", "cses-1649"],
		],
		"linked-list-journey": [
			["middle-of-linked-list", "reverse-linked-list"],
			["linked-list-cycle-ii", "intersection-of-two-linked-lists"],
			[
				"sort-list",
				"copy-list-with-random-pointer",
				"reverse-nodes-in-k-group",
			],
			["reverse-doubly-linked-list", "lru-cache"],
		],
		"trees-journey": [
			[
				"binary-tree-preorder-traversal",
				"binary-tree-inorder-traversal",
				"binary-tree-postorder-traversal",
			],
			["diameter-of-binary-tree", "binary-tree-maximum-path-sum"],
			[
				"serialize-and-deserialize-binary-tree",
				"lowest-common-ancestor-of-a-binary-tree",
			],
			[
				"validate-binary-search-tree",
				"insert-into-a-binary-search-tree",
				"delete-node-in-a-bst",
				"binary-search-tree-iterator",
			],
		],
		"tries-journey": [
			[
				"implement-trie-prefix-tree",
				"count-words-in-trie",
				"delete-word-from-trie",
			],
			["replace-words", "design-add-and-search-words-data-structure"],
			["word-search", "word-search-ii"],
		],
		"graphs-journey": [
			["number-of-islands", "clone-graph", "is-graph-bipartite"],
			["redundant-connection", "accounts-merge"],
			["course-schedule-ii", "alien-dictionary"],
			["rotting-oranges", "word-ladder"],
			["dijkstras-algorithm", "bellman-ford", "floyd-warshall"],
			["prims-algorithm", "min-cost-to-connect-all-points"],
		],
		"backtracking-journey": [
			["subsets", "combinations", "permutations"],
			["subsets-ii", "combination-sum", "combination-sum-ii"],
			["word-search", "palindrome-partitioning"],
			["n-queens", "sudoku-solver"],
		],
		"greedy-intervals-journey": [
			["jump-game", "gas-station", "candy"],
			["fractional-knapsack", "job-sequencing"],
			["merge-intervals", "insert-interval", "non-overlapping-intervals"],
			[
				"meeting-rooms",
				"meeting-rooms-ii",
				"minimum-interval-to-include-each-query",
			],
		],
		"bits-math-journey": [
			["plus-one", "reverse-integer", "multiply-strings"],
			["gcd-of-two-numbers", "codechef-prb01", "count-primes", "powx-n"],
			["number-of-1-bits", "single-number", "counting-bits"],
			[
				"reverse-bits",
				"sum-of-two-integers",
				"bitwise-and-of-numbers-range",
			],
		],
	};
	for (const [slug, families] of Object.entries(coverage)) {
		const journey = journeys.find((entry) => entry.slug === slug);
		assert.ok(journey, `${slug}: missing interview journey`);
		for (const family of families) {
			assert.ok(
				journey.topics.some((topic) =>
					family.every((code) => topic.problemCodes.includes(code)),
				),
				`${slug}: missing connected family ${family.join(", ")}`,
			);
		}
	}
});

for (const journey of journeys) {
	test(`${journey.title} has complete, ordered learning steps and free practice with GFG options`, () => {
		assert.equal(journey.access, "free");
		assert.ok(journey.journey);
		assert.ok(journey.journey.prerequisites.length >= 2);
		assert.ok(journey.journey.outcome.length >= 40);
		const codes = journey.topics.flatMap((topic) => topic.problemCodes);
		assert.equal(new Set(codes).size, codes.length);
		assert.deepEqual(Object.keys(journey.journey.connections), codes);
		assert.ok(
			codes.some((code) =>
				problemPlatformLinks(byCode.get(code)!).some(
					(link) => link.label === "GFG",
				),
			),
			`${journey.slug}: missing GFG practice`,
		);
		for (const topic of journey.topics) {
			assert.ok(topic.description && topic.description.length >= 30);
			assert.ok(topic.problemCodes.length > 0);
			for (const code of topic.problemCodes) {
				const problem = byCode.get(code);
				assert.ok(problem, code);
				assert.equal(problem.locked, false, code);
				assert.ok(getPracticePlatform(problem.url), code);
				assert.ok(journey.journey.connections[code].length >= 80, code);
				assert.equal(problem.hints.length, 3, code);
				assert.equal(new Set(problem.hints).size, 3, code);
				assert.ok(
					problem.hints.every((hint) => hint.length >= 40),
					code,
				);
			}
		}
		const registration = readFileSync(
			new URL("../src/data/problemSets.ts", import.meta.url),
			"utf8",
		);
		assert.ok(
			registration.includes(`./problem_sets/${journey.slug}.json?raw`),
		);
	});
}

test("Stack Journey preserves the nearest-neighbor to rainwater learning sequence", () => {
	const stack = journeys.find((journey) => journey.slug === "stack-journey")!;
	const coreSequence = [
		"implement-stack-using-array",
		"reverse-a-string-using-stack",
		"valid-parentheses",
		"min-stack",
		"nearest-greater-to-left",
		"next-greater-element",
		"nearest-smaller-to-left",
		"next-smaller-element",
		"stock-span",
		"largest-rectangle-in-histogram",
		"trapping-rain-water",
		"maximal-rectangle",
		"next-greater-element-ii",
		"sum-of-subarray-minimums",
	];
	assert.deepEqual(
		stack.topics
			.flatMap((topic) => topic.problemCodes)
			.filter((code) => coreSequence.includes(code)),
		coreSequence,
	);
	const exactGfgSlugs = {
		"nearest-greater-to-left": "previous-greater-element",
		"next-greater-element": "next-larger-element-1587115620",
		"nearest-smaller-to-left": "previous-smaller-element",
		"next-smaller-element": "immediate-smaller-element1142",
		"stock-span": "stock-span-problem-1587115621",
		"largest-rectangle-in-histogram":
			"maximum-rectangular-area-in-a-histogram-1587115620",
		"trapping-rain-water": "trapping-rain-water-1587115621",
		"maximal-rectangle": "max-rectangle",
		"next-greater-element-ii": "next-greater-element",
		"sum-of-subarray-minimums": "sum-of-subarray-minimum",
	};
	for (const [code, slug] of Object.entries(exactGfgSlugs)) {
		assert.ok(
			problemPlatformLinks(byCode.get(code)!).some(
				(link) =>
					link.url ===
					`https://www.geeksforgeeks.org/problems/${slug}/1`,
			),
			code,
		);
	}
});

test("Queue and Heap Journeys preserve prerequisite-first sequences and reviewed GFG destinations", () => {
	const sequences = {
		"queue-journey": [
			["implement-queue-using-array", "implement-queue-using-array"],
			[
				"implement-queue-using-linked-list",
				"implement-queue-using-linked-list",
			],
			["queue-reversal", "queue-reversal"],
			[
				"reverse-first-k-elements-of-queue",
				"reverse-first-k-elements-of-queue",
			],
			[
				"interleave-queue-halves",
				"interleave-the-first-half-of-the-queue-with-second-half",
			],
			["implement-queue-using-stacks", "queue-using-stack"],
			["generate-binary-numbers", "generate-binary-numbers-1587115620"],
			[
				"first-non-repeating-in-a-stream",
				"first-non-repeating-character-in-a-stream1216",
			],
			[
				"first-negative-in-every-window",
				"first-negative-integer-in-every-window-of-size-k3345",
			],
			[
				"sliding-window-maximum",
				"maximum-of-all-subarrays-of-size-k3101",
			],
			["binary-tree-level-order-traversal", "level-order-traversal"],
			["rotting-oranges", "rotten-oranges2536"],
		],
		"heap-journey": [
			["check-array-is-max-heap", "does-array-represent-heap4345"],
			["min-heap-implementation", "min-heap-implementation"],
			["heap-sort", "heap-sort"],
			["kth-smallest-element-in-an-array", "kth-smallest-element5635"],
			["kth-largest-element-in-an-array", "kth-largest-element5034"],
			["sort-a-nearly-sorted-array", "nearly-sorted-1587115620"],
			[
				"k-closest-points-to-origin",
				"k-closest-points-to-origin--172242",
			],
			["top-k-frequent-elements", "top-k-frequent-elements-in-array"],
			[
				"kth-largest-element-in-a-stream",
				"kth-largest-element-in-a-stream2220",
			],
			["merge-k-sorted-arrays", "merge-k-sorted-arrays"],
			["merge-k-sorted-lists", "merge-k-sorted-linked-lists"],
			[
				"minimum-cost-to-connect-ropes",
				"minimum-cost-of-ropes-1587115620",
			],
			[
				"find-median-from-data-stream",
				"find-median-in-a-stream-1587115620",
			],
			["task-scheduler", "task-scheduler"],
		],
	};
	for (const [slug, entries] of Object.entries(sequences)) {
		const journey = journeys.find((entry) => entry.slug === slug)!;
		const coreSequence = entries.map(([code]) => code);
		assert.deepEqual(
			journey.topics
				.flatMap((topic) => topic.problemCodes)
				.filter((code) => coreSequence.includes(code)),
			coreSequence,
		);
		for (const [code, gfgSlug] of entries) {
			assert.ok(
				problemPlatformLinks(byCode.get(code)!).some(
					(link) =>
						link.url ===
						`https://www.geeksforgeeks.org/problems/${gfgSlug}/1`,
				),
				code,
			);
		}
	}
});

test("Journeys retain the original UUID-backed additions as the catalog grows", () => {
	const codes = journeyCodes;
	assert.ok(new Set(codes).size >= 40);
	const originalAdditions = [
		"implement-stack-using-array",
		"reverse-a-string-using-stack",
		"nearest-greater-to-left",
		"next-greater-element",
		"nearest-smaller-to-left",
		"next-smaller-element",
		"stock-span",
		"maximal-rectangle",
		"next-greater-element-ii",
		"sum-of-subarray-minimums",
		"implement-queue-using-array",
		"implement-queue-using-linked-list",
		"queue-reversal",
		"reverse-first-k-elements-of-queue",
		"interleave-queue-halves",
		"generate-binary-numbers",
		"first-non-repeating-in-a-stream",
		"first-negative-in-every-window",
		"check-array-is-max-heap",
		"min-heap-implementation",
		"heap-sort",
		"kth-smallest-element-in-an-array",
		"sort-a-nearly-sorted-array",
		"merge-k-sorted-arrays",
		"minimum-cost-to-connect-ropes",
	];
	const additions = originalAdditions.map((code) => {
		assert.ok(codes.includes(code), code);
		const problem = byCode.get(code);
		assert.ok(problem, code);
		assert.equal(getPracticePlatform(problem.url)?.id, "gfg", code);
		return problem;
	});
	assert.equal(new Set(additions.map((problem) => problem.url)).size, 25);
	for (const problem of additions) {
		assert.match(
			problem.id,
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			problem.code,
		);
	}
});

test("LLD entries are unlocked judge problems with direct practice links", () => {
	assert.equal(lld.access, "free");
	assert.equal(lldCodes.length, 25);
	assert.equal(lld.topics.length, 5);
	assert.equal(new Set(lldCodes).size, lldCodes.length);
	const urls = new Set<string>();
	for (const code of lldCodes) {
		const problem = byCode.get(code);
		assert.ok(problem, `${code}: missing problem`);
		assert.equal(problem.locked, false, code);
		const platform = getPracticePlatform(problem.url);
		assert.ok(
			platform,
			`${code}: expected a supported online judge, got ${problem.url}`,
		);
		if (platform.id === "codezym") {
			assert.equal(
				problem.url,
				"https://codezym.com/question/6-design-hit-counter-multithreaded",
				`${code}: only CodeZym question 6 has verified free submissions (type=0)`,
			);
		}
		assert.equal(new URL(problem.url).search, "", code);
		assert.ok(
			problemPlatformLinks(problem).some(
				(link) =>
					link.label === platform.label && link.url === problem.url,
			),
			`${code}: missing judge button`,
		);
		urls.add(problem.url);
	}
	assert.equal(urls.size, lldCodes.length);
});

test("LLD retains the reviewed class-design and concurrency judge mappings", () => {
	const leetcodeCodes = [
		"design-parking-system",
		"design-hashmap",
		"design-circular-queue",
		"design-browser-history",
		"design-lru-cache",
		"design-lfu-cache",
		"time-based-key-value-store",
		"snapshot-array",
		"design-authentication-manager",
		"simple-bank-system",
		"design-an-atm-machine",
		"seat-reservation-manager",
		"my-calendar-i",
		"my-calendar-ii",
		"design-underground-system",
		"design-twitter",
		"design-a-food-rating-system",
		"design-movie-rental-system",
		"design-a-text-editor",
		"print-in-order",
		"print-foobar-alternately",
		"print-zero-even-odd",
		"building-h2o",
		"the-dining-philosophers",
	];
	assert.deepEqual(lldCodes, [
		...leetcodeCodes,
		"design-hit-counter-multithreaded",
	]);
	const legacySlugs: Record<string, string> = {
		"design-lru-cache": "lru-cache",
		"design-lfu-cache": "lfu-cache",
	};
	for (const code of leetcodeCodes) {
		assert.equal(
			byCode.get(code)?.url,
			`https://leetcode.com/problems/${legacySlugs[code] ?? code}/`,
			code,
		);
	}
	for (const [code, id] of [
		["design-lru-cache", "dsa-0229"],
		["design-lfu-cache", "dsa-0230"],
		["design-an-atm-machine", "dsa-0239"],
	]) {
		assert.equal(byCode.get(code)?.id, id, code);
	}
});

test("HLD covers popular named interview systems", () => {
	for (const [code, name] of [
		["design-amazon-marketplace", "Amazon"],
		["design-netflix", "Netflix"],
		["design-bookmyshow", "BookMyShow"],
		["design-instagram", "Instagram"],
		["design-google-drive", "Google Drive"],
		["design-real-time-chat", "WhatsApp"],
		["design-video-streaming-platform", "YouTube"],
		["design-ride-sharing-platform", "Uber"],
		["design-news-feed", "Twitter"],
	]) {
		assert.ok(hldCodes.includes(code), `${name}: missing HLD topic`);
		assert.ok(
			byCode.get(code)?.name.includes(name),
			`${name}: missing title`,
		);
		assert.ok(hld.guides?.[code], `${name}: missing study guide`);
	}
});

test("HLD entries use direct system-design resources with website labels", () => {
	const resources: Array<[string, string, string]> = [
		[
			"design-amazon-marketplace",
			"AWS Builders' Library",
			"https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/",
		],
		[
			"design-netflix",
			"GFG",
			"https://www.geeksforgeeks.org/system-design/system-design-netflix-a-complete-architecture/",
		],
		[
			"design-bookmyshow",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster",
		],
		[
			"design-instagram",
			"GFG",
			"https://www.geeksforgeeks.org/system-design/design-instagram-a-system-design-interview-question/",
		],
		[
			"design-google-drive",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox",
		],
		[
			"design-url-shortener",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly",
		],
		[
			"design-rate-limiter-at-scale",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter",
		],
		[
			"design-distributed-cache",
			"GFG",
			"https://www.geeksforgeeks.org/system-design/design-distributed-cache-system-design/",
		],
		[
			"design-api-gateway",
			"GFG",
			"https://www.geeksforgeeks.org/system-design/what-is-api-gateway-system-design/",
		],
		[
			"design-real-time-chat",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp",
		],
		[
			"design-notification-system",
			"GFG",
			"https://www.geeksforgeeks.org/system-design/design-notification-services-system-design/",
		],
		[
			"design-pub-sub-messaging-platform",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/deep-dives/kafka",
		],
		[
			"design-search-autocomplete",
			"GFG",
			"https://www.geeksforgeeks.org/system-design/googles-search-autocomplete-high-level-designhld/",
		],
		[
			"design-news-feed",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed",
		],
		[
			"design-recommendation-system",
			"Hello Interview",
			"https://www.hellointerview.com/learn/ml-system-design/problem-breakdowns/video-recommendations",
		],
		[
			"design-analytics-event-pipeline",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator",
		],
		[
			"design-ride-sharing-platform",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber",
		],
		[
			"design-food-delivery-platform",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff",
		],
		[
			"design-video-streaming-platform",
			"Hello Interview",
			"https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube",
		],
		[
			"design-payment-system",
			"Stripe",
			"https://stripe.dev/blog/payment-api-design",
		],
	];
	assert.equal(hldCodes.length, 20);
	assert.deepEqual(
		hldCodes,
		resources.map(([code]) => code),
	);
	const urls = new Set<string>();
	for (const [code, label, expectedUrl] of resources) {
		const problem = byCode.get(code);
		assert.ok(problem, code);
		assert.equal(problem.url, expectedUrl, code);
		const url = new URL(problem.url);
		assert.equal(url.protocol, "https:", code);
		assert.equal(url.search, "", code);
		assert.notEqual(url.pathname, "/", code);
		assert.doesNotMatch(url.pathname, /\/(search|problemset)\/?$/i, code);
		assert.equal(getPracticePlatform(problem.url), undefined, code);
		assert.deepEqual(
			problemPlatformLinks(problem),
			[{ label, url: expectedUrl }],
			code,
		);
		urls.add(problem.url);
	}
	assert.equal(urls.size, hldCodes.length);
});

test("every HLD topic has a complete illustrated study guide and direct resources", () => {
	assert.ok(hld.guides, "HLD study guides are missing");
	assert.deepEqual(Object.keys(hld.guides).sort(), [...hldCodes].sort());
});

for (const code of hldCodes) {
	test(`HLD study guide: ${code}`, () => {
		const guide = hld.guides?.[code];
		assert.ok(guide, `${code}: guide is missing`);
		assert.ok(guide.summary.length >= 100, `${code}: summary`);
		assert.match(guide.reviewedAt, /^\d{4}-\d{2}-\d{2}$/, code);
		assert.ok(guide.prerequisites.length >= 2, `${code}: prerequisites`);
		assert.ok(
			guide.clarifyingQuestions?.length >= 3,
			`${code}: interview scope`,
		);
		assert.ok(
			guide.deepDives?.length >= 3,
			`${code}: detailed design analysis`,
		);
		assert.equal(
			new Set(guide.deepDives.map((dive) => dive.title)).size,
			guide.deepDives.length,
			code,
		);
		for (const dive of guide.deepDives) {
			assert.ok(
				dive.title && dive.paragraphs.length >= 3,
				`${code}: ${dive.title}`,
			);
			assert.ok(
				dive.paragraphs.every((paragraph) => paragraph.length >= 120),
				`${code}: shallow deep dive`,
			);
			assert.ok(
				dive.invariant.length >= 40,
				`${code}: correctness invariant`,
			);
			assert.ok(
				dive.followUp.question && dive.followUp.answer.length >= 100,
				`${code}: answered follow-up`,
			);
		}
		assert.ok(
			guide.operations?.signals.length >= 3,
			`${code}: operational signals`,
		);
		for (const signal of guide.operations.signals) {
			assert.ok(
				signal.name && signal.measure && signal.response,
				`${code}: actionable monitoring`,
			);
		}
		assert.ok(
			guide.operations.security.length >= 3,
			`${code}: security and privacy`,
		);
		assert.ok(
			guide.operations.validation.length >= 3,
			`${code}: testing and rollout`,
		);
		assert.ok(
			guide.requirements.functional.length >= 3,
			`${code}: functional requirements`,
		);
		assert.ok(
			guide.requirements.nonFunctional.length >= 3,
			`${code}: quality requirements`,
		);
		assert.ok(guide.requirements.outOfScope.length >= 1, `${code}: scope`);
		assert.ok(
			guide.capacity.assumptions.length >= 2,
			`${code}: sizing assumptions`,
		);
		assert.ok(guide.capacity.estimates.length >= 2, `${code}: estimates`);
		assert.ok(guide.api.length >= 2, `${code}: API`);
		assert.ok(guide.dataModel.length >= 2, `${code}: data model`);
		assert.match(
			guide.architecture.diagram,
			/^flowchart (TD|LR)\n/,
			`${code}: diagram`,
		);
		assert.doesNotMatch(
			guide.architecture.diagram,
			/%%\{|\bclick\b|<script/i,
			code,
		);
		assert.ok(
			guide.architecture.flows.length >= 2,
			`${code}: request flows`,
		);
		for (const flow of guide.architecture.flows) {
			assert.ok(
				flow.name && flow.steps.length >= 3,
				`${code}: ${flow.name}`,
			);
		}
		assert.ok(guide.decisions.length >= 3, `${code}: trade-offs`);
		assert.ok(guide.failureModes.length >= 3, `${code}: failure handling`);
		assert.ok(guide.selfCheck.length >= 3, `${code}: self-check`);
		for (const check of guide.selfCheck) {
			assert.ok(
				check.question && check.answer.length >= 80,
				`${code}: ${check.question}`,
			);
		}
		assert.ok(
			guide.resources.filter((resource) => resource.kind === "article")
				.length >= 2,
			`${code}: readings`,
		);
		assert.ok(
			guide.resources.some((resource) => resource.kind === "video"),
			`${code}: video`,
		);
		assert.ok(
			guide.resources.some(
				(resource) => resource.url === byCode.get(code)?.url,
			),
			`${code}: primary reading`,
		);
		assert.equal(
			new Set(guide.resources.map((resource) => resource.url)).size,
			guide.resources.length,
			`${code}: duplicate resource`,
		);
		for (const resource of guide.resources) {
			assert.ok(
				resource.title && resource.author && resource.why,
				`${code}: resource context`,
			);
			const url = new URL(resource.url);
			assert.equal(url.protocol, "https:", code);
			assert.notEqual(url.pathname, "/", code);
			assert.doesNotMatch(url.pathname, /\/(search|results)\/?$/i, code);
			if (resource.kind === "video") {
				assert.equal(url.hostname, "www.youtube.com", code);
				assert.equal(url.pathname, "/watch", code);
				assert.match(
					url.searchParams.get("v") ?? "",
					/^[a-zA-Z0-9_-]{11}$/,
					code,
				);
				assert.equal(url.searchParams.size, 1, code);
			} else {
				assert.equal(url.search, "", code);
			}
		}
	});
}

test("HLD video selections retain their reviewed topic mappings", () => {
	const videoIds: Record<string, string> = {
		"design-amazon-marketplace": "GAe5oB742dw",
		"design-netflix": "IUrQ5_g3XKs",
		"design-bookmyshow": "fhdPyoO6aXI",
		"design-instagram": "Qj4-GruzyDU",
		"design-google-drive": "_UZ1ngy-kOI",
		"design-url-shortener": "iUU4O1sWtJA",
		"design-rate-limiter-at-scale": "MIJFyUPG4Z4",
		"design-distributed-cache": "fmT5nlEkl3U",
		"design-api-gateway": "fyTxwIa-1U0",
		"design-real-time-chat": "cr6p0n0N-VA",
		"design-notification-system": "DU8o-OTeoCc",
		"design-pub-sub-messaging-platform": "DU8o-OTeoCc",
		"design-search-autocomplete": "PuZvF2EyfBM",
		"design-news-feed": "Qj4-GruzyDU",
		"design-recommendation-system": "jz0-satrmrA",
		"design-analytics-event-pipeline": "Zcv_899yqhI",
		"design-ride-sharing-platform": "lsKU38RKQSo",
		"design-food-delivery-platform": "lsKU38RKQSo",
		"design-video-streaming-platform": "IUrQ5_g3XKs",
		"design-payment-system": "GAe5oB742dw",
	};
	assert.deepEqual(Object.keys(videoIds), hldCodes);
	for (const [code, videoId] of Object.entries(videoIds)) {
		assert.deepEqual(
			hld.guides?.[code].resources
				.filter((resource) => resource.kind === "video")
				.map((resource) => resource.url),
			[`https://www.youtube.com/watch?v=${videoId}`],
			code,
		);
	}
});

const searchSets: ProblemSet[] = readdirSync(searchDirectory)
	.filter((filename) => filename.endsWith(".json"))
	.map((filename) => {
		const sheet: SheetReference = JSON.parse(
			readFileSync(new URL(filename, searchDirectory), "utf8"),
		);
		return {
			slug: sheet.slug,
			title: sheet.title,
			description: sheet.title,
			topics: sheet.topics.map((topic) => ({
				name: topic.name,
				problems: topic.problemCodes.map((code, order) => ({
					...byCode.get(code)!,
					order,
					slug: code,
					difficulty: "M" as const,
					hints: [],
					studyGuide: sheet.guides?.[code],
				})),
			})),
		};
	});
const searchIndex = createSearchIndex(searchSets);

test("every collection has a distinct, renderable decorative icon", () => {
	assert.equal(PROBLEM_SET_ICONS.size, searchSets.length);
	assert.equal(
		new Set(PROBLEM_SET_ICONS.values()).size,
		PROBLEM_SET_ICONS.size,
	);
	for (const collection of searchSets) {
		const Icon = PROBLEM_SET_ICONS.get(collection.slug);
		assert.ok(Icon, `${collection.slug}: missing icon`);
		const markup = renderToStaticMarkup(
			createElement(Icon, { "aria-hidden": true }),
		);
		assert.match(markup, /<svg\b/, collection.slug);
		assert.match(
			markup,
			/<(path|rect|circle|line|polyline|polygon)\b/,
			collection.slug,
		);
		assert.match(markup, /aria-hidden="true"/, collection.slug);
	}
});

test("global search indexes each problem once across collections", () => {
	const entries = searchIndex.filter(
		(entry) => entry.kind === "problem" || entry.kind === "guide",
	);
	assert.equal(entries.length, problems.length);
	assert.equal(
		new Set(entries.map((entry) => entry.id)).size,
		entries.length,
	);
	assert.equal(
		searchIndex.filter((entry) => entry.kind === "collection").length,
		searchSets.length,
	);
	assert.equal(
		entries.filter((entry) => entry.kind === "guide").length,
		hldCodes.length,
	);
});

test("global search finds HLD product aliases and deeper concepts", () => {
	for (const [query, code] of [
		["Amazon", "design-amazon-marketplace"],
		["Netflix", "design-netflix"],
		["OTT", "design-netflix"],
		["Book My Show", "design-bookmyshow"],
		["Ticketmaster", "design-bookmyshow"],
		["Instagram", "design-instagram"],
		["Dropbox", "design-google-drive"],
		["WhatsApp", "design-real-time-chat"],
		["Twitter", "design-news-feed"],
		["Uber", "design-ride-sharing-platform"],
	]) {
		const result = searchCatalog(searchIndex, query)[0];
		assert.equal(result?.id, `problem:${code}`, query);
		assert.equal(result.kind, "guide", query);
		assert.equal(result.external, false, query);
		assert.equal(
			result.href,
			`/sets/hld?guide=${code}&section=guide`,
			query,
		);
	}
	assert.ok(
		searchCatalog(searchIndex, "regional budgets").some(
			(entry) => entry.id === "problem:design-rate-limiter-at-scale",
		),
	);
	assert.equal(
		searchCatalog(searchIndex, "Design Twitter")[0].href,
		"https://leetcode.com/problems/design-twitter/",
	);
});

test("global search prioritizes titles and finds topics and guide concepts", () => {
	assert.equal(searchCatalog(searchIndex, "  TWO-SUM  ")[0].title, "Two Sum");
	assert.equal(
		searchCatalog(searchIndex, "leetcode two sum")[0].href,
		"https://leetcode.com/problems/two-sum/",
	);
	const guide = searchCatalog(searchIndex, "URL shortener")[0];
	assert.equal(guide.kind, "guide");
	assert.equal(guide.external, false);
	assert.equal(
		guide.href,
		"/sets/hld?guide=design-url-shortener&section=guide",
	);
	assert.ok(
		searchCatalog(searchIndex, "Kafka").some(
			(entry) => entry.id === "problem:design-pub-sub-messaging-platform",
		),
	);
	assert.ok(
		searchCatalog(searchIndex, "binary tree").some(
			(entry) => entry.kind === "problem",
		),
	);
	assert.equal(
		searchCatalog(searchIndex, "leaderboard")[0].href,
		"/leaderboard",
	);
	assert.equal(
		searchCatalog(searchIndex, "neetcode 150")[0].href,
		"/sets/neetcode-150",
	);
});

test("global search handles empty queries, missing results, and result limits", () => {
	const defaults = searchCatalog(searchIndex, "   ");
	assert.ok(defaults.length);
	assert.ok(
		defaults.every(
			(entry) => entry.kind === "page" || entry.kind === "collection",
		),
	);
	assert.deepEqual(
		searchCatalog(searchIndex, "no-such-catalog-entry-12345"),
		[],
	);
	assert.equal(searchCatalog(searchIndex, "design", 3).length, 3);
	assert.deepEqual(searchCatalog(searchIndex, "design", 0), []);
	assert.deepEqual(searchCatalog(searchIndex, "design", -1), []);
	const problem = searchCatalog(searchIndex, "two sum")[0];
	assert.equal(problem.external, true);
	assert.equal(problem.href, byCode.get("two-sum")?.url);
});

test("Free DSA Essentials has 100 unique exercises across all seven platforms", () => {
	assert.equal(essentials.slug, "free-dsa-essentials");
	assert.equal(essentials.access, "free");
	assert.equal(essentialsCodes.length, 100);
	assert.equal(new Set(essentialsCodes).size, essentialsCodes.length);
	assert.equal(essentials.topics.length, 9);
	const counts: Record<string, number> = {};
	const urls = new Set<string>();
	for (const code of essentialsCodes) {
		const problem = byCode.get(code);
		assert.ok(problem, code);
		const platform = getPracticePlatform(problem.url);
		assert.ok(platform, code);
		counts[platform.id] = (counts[platform.id] || 0) + 1;
		urls.add(problem.url);
	}
	assert.equal(urls.size, essentialsCodes.length);
	assert.deepEqual(counts, {
		gfg: 15,
		codechef: 7,
		spoj: 11,
		codeforces: 10,
		cses: 10,
		leetcode: 42,
		neetcode: 5,
	});
	for (const platformId of Object.keys(counts)) {
		assert.ok(
			practicePlatforms.some((platform) => platform.id === platformId),
		);
	}
});

test("the retired sheet is removed, including its registration", () => {
	assert.equal(
		existsSync(
			new URL(
				"../src/data/problem_sets/striver-450.json",
				import.meta.url,
			),
		),
		false,
	);
	const registration = readFileSync(
		new URL("../src/data/problemSets.ts", import.meta.url),
		"utf8",
	);
	assert.doesNotMatch(registration, /striver-450|striver450Raw/);
});

test("all active references resolve and the master index includes every coding set", () => {
	assert.equal(byCode.size, problems.length);
	assert.equal(
		new Set(problems.map((problem) => problem.id)).size,
		problems.length,
	);
	const directory = new URL("../src/data/problem_sets/", import.meta.url);
	const sheets: SheetReference[] = readdirSync(directory)
		.filter((filename) => filename.endsWith(".json"))
		.map((filename) =>
			JSON.parse(readFileSync(new URL(filename, directory), "utf8")),
		);
	for (const sheet of sheets) {
		for (const topic of sheet.topics) {
			for (const code of topic.problemCodes) {
				assert.ok(byCode.has(code), `${sheet.slug}: missing ${code}`);
			}
		}
	}
	const master = sheets.find((sheet) => sheet.slug === "all-dsa-questions");
	assert.ok(master);
	const masterCodes = new Set(
		master.topics.flatMap((topic) => topic.problemCodes),
	);
	assert.equal(
		masterCodes.size,
		master.topics.reduce(
			(total, topic) => total + topic.problemCodes.length,
			0,
		),
		"master index must not contain duplicate references",
	);
	for (const sheet of sheets.filter(
		(sheet) => !["lld", "hld"].includes(sheet.slug),
	)) {
		for (const code of sheet.topics.flatMap(
			(topic) => topic.problemCodes,
		)) {
			assert.ok(masterCodes.has(code), code);
		}
	}
	for (const code of masterCodes)
		assert.ok(getPracticePlatform(byCode.get(code)!.url), code);
	assert.equal(byCode.has("r"), false);
	assert.equal(byCode.has("deletion-of-the"), false);
});

test("active data contains no paid entries or TUF links", () => {
	for (const problem of problems) {
		const code = problem.code;
		assert.equal(problem.locked, false, code);
		assert.equal(problem.name, problem.name.trim(), code);
		assert.ok(problem.name.length > 2, code);
		assert.doesNotMatch(
			problem.name,
			/^(R|Pre|Pow|Cpp|Hard|Theory With Examples|Easy And Medium|Deletion Of The)$/i,
			code,
		);
		for (const value of [problem.url, problem.gfgUrl].filter(Boolean)) {
			const url = new URL(value!);
			assert.equal(url.protocol, "https:", code);
			assert.equal(
				url.hostname.endsWith("takeuforward.org"),
				false,
				code,
			);
			assert.equal(url.searchParams.has("s"), false, code);
			if (url.hostname.endsWith("geeksforgeeks.org")) {
				assert.equal(url.hostname, "www.geeksforgeeks.org", code);
				assert.match(
					url.pathname,
					hldCodes.includes(code)
						? /^\/system-design\/[a-z0-9-]+\/$/
						: /^\/problems\/[^/]+\/\d+\/?$/,
					code,
				);
			}
		}
		if (problem.gfgUrl) {
			assert.equal(
				new URL(problem.gfgUrl).hostname,
				"www.geeksforgeeks.org",
				code,
			);
		}
	}
});

test("similarly named tasks retain their actual problem identities", () => {
	const expected: Array<[string, string, string]> = [
		[
			"frog-jump",
			"Frog Jump",
			"https://www.geeksforgeeks.org/problems/geek-jump/1",
		],
		[
			"house-robber",
			"House Robber",
			"https://leetcode.com/problems/house-robber/",
		],
		[
			"house-robber-ii",
			"House Robber II",
			"https://leetcode.com/problems/house-robber-ii/",
		],
		[
			"coin-change-ii",
			"Coin Change II",
			"https://leetcode.com/problems/coin-change-ii/",
		],
	];
	for (const [code, name, url] of expected) {
		assert.ok(essentialsCodes.includes(code), code);
		const problem = byCode.get(code);
		assert.ok(problem, code);
		assert.equal(problem.name, name, code);
		assert.equal(problem.url, url, code);
	}
	assert.equal(byCode.get("largest-element")?.id, "striver-largest-element");
	assert.equal(byCode.get("house-robber")?.id, "dsa-0101");
});

test("premium LeetCode problems use their free NeetCode equivalents", () => {
	for (const [code, slug] of [
		["encode-and-decode-strings", "string-encode-and-decode"],
		["walls-and-gates", "islands-and-treasure"],
		["alien-dictionary", "foreign-dictionary"],
		["meeting-rooms", "meeting-schedule"],
		["meeting-rooms-ii", "meeting-schedule-ii"],
		["meeting-rooms-ii-2", "meeting-schedule-ii"],
		["graph-valid-tree", "valid-tree"],
		[
			"number-of-connected-components-in-an-undirected-graph",
			"count-connected-components",
		],
	]) {
		const problem = byCode.get(code);
		assert.ok(problem, code);
		assert.equal(problem.url, `https://neetcode.io/problems/${slug}`, code);
		assert.equal(problem.locked, false, code);
	}
});

test("the largest-element entry uses the exact GFG practice URL", () => {
	assert.ok(essentialsCodes.includes("largest-element"));

	const problem = problems.find(
		(entry: { code: string }) => entry.code === "largest-element",
	);
	assert.ok(problem);
	assert.match(problem.name, /largest.*array/i);
	assert.equal(
		problem.url,
		"https://www.geeksforgeeks.org/problems/largest-element-in-array4009/1",
	);
	assert.equal(problem.gfgUrl, problem.url);
});

test("platform buttons use exact supplied practice links and matching labels", () => {
	const gfgUrl =
		"https://www.geeksforgeeks.org/problems/largest-element-in-array4009/1";
	assert.deepEqual(problemPlatformLinks({ url: gfgUrl, gfgUrl }), [
		{ label: "GFG", url: gfgUrl },
	]);

	const leetcodeUrl = "https://leetcode.com/problems/two-sum/";
	const twoSumGfgUrl =
		"https://www.geeksforgeeks.org/problems/key-pair5616/1";
	assert.deepEqual(
		problemPlatformLinks({ url: leetcodeUrl, gfgUrl: twoSumGfgUrl }),
		[
			{ label: "GFG", url: twoSumGfgUrl },
			{ label: "LeetCode", url: leetcodeUrl },
		],
	);
	assert.deepEqual(problemPlatformLinks({ url: leetcodeUrl }), [
		{ label: "LeetCode", url: leetcodeUrl },
	]);

	const neetcodeUrl = "https://neetcode.io/problems/two-integer-sum";
	assert.deepEqual(problemPlatformLinks({ url: neetcodeUrl }), [
		{ label: "NeetCode", url: neetcodeUrl },
	]);

	for (const [label, url] of [
		["SPOJ", "https://www.spoj.com/problems/AGGRCOW/"],
		["CodeChef", "https://www.codechef.com/problems/TSORT"],
		["Codeforces", "https://codeforces.com/problemset/problem/580/C"],
		["CSES", "https://cses.fi/problemset/task/1192/"],
		["CodeZym", "https://codezym.com/question/7-design-a-parking-lot"],
	]) {
		assert.deepEqual(problemPlatformLinks({ url }), [{ label, url }]);
	}
});

test("platform buttons never use searches, invented destinations, or unrelated hosts", () => {
	for (const url of [
		"https://www.geeksforgeeks.org/?s=Largest%20Element",
		"https://www.geeksforgeeks.org/problems/",
		"https://leetcode.com/problemset/",
		"https://leetcode.com.example.org/problems/two-sum/",
		"https://takeuforward.org/plus/dsa/problems/largest-element",
		"https://www.spoj.com/problems/classical/",
		"https://www.codechef.com/practice",
		"https://codeforces.com/problemset",
		"https://cses.fi/problemset/",
		"https://codezym.com/",
		"https://codezym.com/premium",
		"https://codezym.com/question/",
		"https://codezym.com/question/design-a-parking-lot",
		"https://codezym.com/question/0-design-a-parking-lot",
		"https://codezym.com.example.org/question/7-design-a-parking-lot",
		"http://codezym.com/question/7-design-a-parking-lot",
		"https://github.com/example/design-problem",
		"https://github.com/search?q=system-design&type=repositories",
		"https://www.hellointerview.com/learn/system-design",
		"https://www.hellointerview.com/learn/system-design/problem-breakdowns/",
		"https://www.hellointerview.com/premium",
		"https://www.hellointerview.com.example.org/learn/system-design/problem-breakdowns/bitly",
		"http://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly",
		"https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly?search=cache",
		"https://www.geeksforgeeks.org/system-design/",
		"https://www.geeksforgeeks.org/system-design/design-distributed-cache-system-design/?s=cache",
		"https://www.geeksforgeeks.org/courses/system-design-training-program",
		"https://stripe.dev/blog",
		"https://stripe.dev.example.org/blog/payment-api-design",
		"https://aws.amazon.com/",
		"https://aws.amazon.com/builders-library/",
		"https://aws.amazon.com.example.org/builders-library/making-retries-safe-with-idempotent-APIs/",
		"https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/?search=checkout",
		"javascript:alert(1)",
		"not a URL",
	]) {
		assert.deepEqual(problemPlatformLinks({ url, gfgUrl: url }), [], url);
	}
});
