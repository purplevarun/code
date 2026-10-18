import assert from "node:assert/strict";
import test from "node:test";

import { getJourneyProgress, uniqueSolvedCount } from "../src/lib/progress.ts";

test("duplicate slugs count once", () => {
	const slugs = ["two-sum", "two-sum", "lru-cache", "course-schedule"];
	assert.equal(uniqueSolvedCount(slugs), 3);
	assert.equal(uniqueSolvedCount([...slugs, ...slugs]), 3);
});

test("empty and missing values count as zero", () => {
	assert.equal(uniqueSolvedCount([]), 0);
	assert.equal(uniqueSolvedCount([null, undefined, ""]), 0);
});

test("a new journey starts with its first step", () => {
	assert.deepEqual(getJourneyProgress(["ngl", "ngr", "nsl"], new Set()), {
		total: 3,
		solved: 0,
		percent: 0,
		nextCode: "ngl",
	});
});

test("journey resume chooses the earliest gap, not the step after the latest solve", () => {
	assert.deepEqual(
		getJourneyProgress(
			["ngl", "ngr", "nsl"],
			new Set(["ngl", "nsl", "unrelated"]),
		),
		{ total: 3, solved: 2, percent: 67, nextCode: "ngr" },
	);
});

test("journey completion has no next step and ignores duplicate references", () => {
	assert.deepEqual(
		getJourneyProgress(["ngl", "ngr", "ngl"], new Set(["ngl", "ngr"])),
		{ total: 2, solved: 2, percent: 100, nextCode: undefined },
	);
});

test("empty journeys have finite progress and no next step", () => {
	assert.deepEqual(getJourneyProgress([], new Set(["unrelated"])), {
		total: 0,
		solved: 0,
		percent: 0,
		nextCode: undefined,
	});
});
