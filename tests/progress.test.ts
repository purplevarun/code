import assert from "node:assert/strict";
import test from "node:test";

import { uniqueSolvedCount } from "../src/lib/progress.ts";

test("duplicate slugs count once", () => {
	const slugs = ["two-sum", "two-sum", "lru-cache", "course-schedule"];
	assert.equal(uniqueSolvedCount(slugs), 3);
	assert.equal(uniqueSolvedCount([...slugs, ...slugs]), 3);
});

test("empty and missing values count as zero", () => {
	assert.equal(uniqueSolvedCount([]), 0);
	assert.equal(uniqueSolvedCount([null, undefined, ""]), 0);
});
