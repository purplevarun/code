import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getPracticePlatform } from "../src/lib/links.ts";
import { getProvider, PROVIDERS } from "../src/lib/providers.ts";

test("leetcode extractor pulls the title slug", () => {
	const leetcode = getProvider("leetcode");
	assert.equal(
		leetcode?.extract("https://leetcode.com/problems/two-sum/"),
		"two-sum",
	);
	assert.equal(
		leetcode?.extract("https://leetcode.com/problems/lru-cache"),
		"lru-cache",
	);
	assert.equal(leetcode?.extract("https://neetcode.io/problems/x"), null);
});

test("codeforces extractor combines contestId and index", () => {
	const codeforces = getProvider("codeforces");
	assert.equal(
		codeforces?.extract("https://codeforces.com/problemset/problem/1352/C"),
		"1352C",
	);
	assert.equal(
		codeforces?.extract("https://codeforces.com/problemset/problem/4/A"),
		"4A",
	);
	assert.equal(codeforces?.extract("https://codeforces.com/contests"), null);
});

test("spoj extractor pulls uppercase problem codes", () => {
	const spoj = getProvider("spoj");
	assert.equal(spoj?.extract("https://www.spoj.com/problems/TEST/"), "TEST");
	assert.equal(spoj?.extract("https://spoj.com/problems/ADDREV"), "ADDREV");
	assert.equal(spoj?.extract("https://leetcode.com/problems/two-sum"), null);
});

test("gfg extractor pulls the problem slug", () => {
	const gfg = getProvider("gfg");
	assert.equal(
		gfg?.extract(
			"https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1",
		),
		"allocate-minimum-number-of-pages0937",
	);
	assert.equal(
		gfg?.extract(
			"https://www.geeksforgeeks.org/problems/bottom-view-of-binary-tree/1",
		),
		"bottom-view-of-binary-tree",
	);
});

test("codechef extractor pulls problem codes", () => {
	const codechef = getProvider("codechef");
	assert.equal(
		codechef?.extract("https://www.codechef.com/problems/FCTRL"),
		"FCTRL",
	);
	assert.equal(
		codechef?.extract("https://codechef.com/problems/CIELRCPT"),
		"CIELRCPT",
	);
});

test("every judge-linked catalog problem maps to a provider id", () => {
	const problems = JSON.parse(
		readFileSync(
			new URL("../src/data/dsa_problems.json", import.meta.url),
			"utf8",
		),
	) as Array<{ url: string }>;
	const syncablePlatforms = new Set(PROVIDERS.map((p) => p.id));
	let checked = 0;
	for (const problem of problems) {
		const platform = getPracticePlatform(problem.url);
		if (!platform || !syncablePlatforms.has(platform.id)) continue;
		const provider = getProvider(platform.id);
		assert.ok(
			provider?.extract(problem.url),
			`${platform.id} could not extract an id from ${problem.url}`,
		);
		checked += 1;
	}
	assert.ok(checked > 200, `expected to check many problems, got ${checked}`);
});

test("provider modes are declared honestly", () => {
	assert.equal(getProvider("leetcode")?.mode, "partial");
	for (const id of ["codeforces", "spoj", "gfg", "codechef"]) {
		assert.equal(getProvider(id)?.mode, "full", `${id} should be full`);
	}
	assert.equal(PROVIDERS.length, 5);
});
