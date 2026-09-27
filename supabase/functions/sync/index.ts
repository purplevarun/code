// Supabase Edge Function: provider sync engine.
// POST { provider, handle } -> { ids: string[], complete: boolean, note?: string }
// Each adapter returns solved-problem identifiers for one judge provider.
// Deploy with: supabase functions deploy sync --no-verify-jwt

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
};

type SyncResult = {
	ids: string[];
	complete: boolean;
	note?: string;
	extra?: Record<string, unknown>;
};

type Adapter = (handle: string) => Promise<SyncResult>;

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...CORS_HEADERS },
	});

const fail = (note: string): SyncResult => ({
	ids: [],
	complete: false,
	note,
});

// --- LeetCode: public GraphQL — recent ~20 accepted only (platform limit) ---

const LC_GQL = async <T>(query: string, variables: Record<string, unknown>) => {
	const res = await fetch("https://leetcode.com/graphql", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Referer: "https://leetcode.com",
		},
		body: JSON.stringify({ query, variables }),
	});
	if (!res.ok) throw new Error(`leetcode http ${res.status}`);
	return ((await res.json()) as { data?: T }).data;
};

const leetcode: Adapter = async (handle) => {
	type Sub = { titleSlug?: string; title?: string; statusDisplay?: string };
	const [ac, all, stats] = await Promise.allSettled([
		LC_GQL<{ recentAcSubmissionList?: Sub[] }>(
			`query ($u: String!, $l: Int) { recentAcSubmissionList(username: $u, limit: $l) { title titleSlug statusDisplay } }`,
			{ u: handle, l: 20 },
		),
		LC_GQL<{ recentSubmissionList?: Sub[] }>(
			`query ($u: String!, $l: Int) { recentSubmissionList(username: $u, limit: $l) { title titleSlug statusDisplay } }`,
			{ u: handle, l: 20 },
		),
		LC_GQL<{
			matchedUser?: {
				submitStatsGlobal?: {
					acSubmissionNum?: Array<{
						difficulty?: string;
						count?: number;
					}>;
				};
			};
		}>(
			`query ($u: String!) { matchedUser(username: $u) { submitStatsGlobal { acSubmissionNum { difficulty count } } } }`,
			{ u: handle },
		),
	]);

	const subs = [
		...(ac.status === "fulfilled"
			? (ac.value.recentAcSubmissionList ?? [])
			: []),
		...(all.status === "fulfilled"
			? (all.value.recentSubmissionList ?? [])
			: []),
	];
	const accepted = subs.filter(
		(s) =>
			!s.statusDisplay ||
			s.statusDisplay.toLowerCase().includes("accepted"),
	);

	if (
		!accepted.length &&
		ac.status === "rejected" &&
		all.status === "rejected"
	) {
		return fail("leetcode unreachable");
	}

	const seen = new Set<string>();
	const slugs: string[] = [];
	const titles: string[] = [];
	for (const s of accepted) {
		if (s.titleSlug && !seen.has(s.titleSlug)) {
			seen.add(s.titleSlug);
			slugs.push(s.titleSlug);
			if (s.title) titles.push(s.title);
		}
	}

	let publicSolvedCount: number | null = null;
	if (stats.status === "fulfilled") {
		const counts =
			stats.value.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];
		const total = counts.find((c) => c.difficulty === "All")?.count;
		if (typeof total === "number") publicSolvedCount = total;
	}

	return {
		ids: slugs,
		complete: false,
		note: "recent ~20 only",
		extra: { titles, publicSolvedCount },
	};
};

// --- Codeforces: official user.status API, full history ---

const codeforces: Adapter = async (handle) => {
	const res = await fetch(
		`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`,
		{ headers: BROWSER_HEADERS },
	);
	if (!res.ok) return fail(`codeforces http ${res.status}`);
	const payload = (await res.json()) as {
		status?: string;
		comment?: string;
		result?: Array<{
			verdict?: string;
			problem?: { contestId?: number; index?: string };
		}>;
	};
	if (payload.status !== "OK")
		return fail(payload.comment || "codeforces error");

	const ids = new Set<string>();
	for (const sub of payload.result ?? []) {
		if (sub.verdict !== "OK") continue;
		const { contestId, index } = sub.problem ?? {};
		if (contestId && index) ids.add(`${contestId}${index}`);
	}
	return { ids: [...ids], complete: true };
};

// --- GFG: practiceapi submissions endpoint, full solved list ---

const gfg: Adapter = async (handle) => {
	const res = await fetch(
		"https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "https://www.geeksforgeeks.org",
				Referer: "https://www.geeksforgeeks.org/",
				...BROWSER_HEADERS,
			},
			body: JSON.stringify({
				handle,
				requestType: "",
				year: "",
				month: "",
			}),
		},
	);
	if (!res.ok) return fail(`gfg http ${res.status}`);
	const payload = (await res.json()) as {
		status?: string;
		result?: Record<string, Record<string, { slug?: string }>>;
	};
	if (payload.status !== "success") return fail("gfg user not found");

	const ids = new Set<string>();
	for (const problems of Object.values(payload.result ?? {})) {
		for (const detail of Object.values(problems)) {
			if (detail.slug) ids.add(detail.slug);
		}
	}
	return { ids: [...ids], complete: true };
};

// --- SPOJ: public profile page scrape, full solved list ---

const parseSpoj = (html: string): string[] => {
	const marker = html.indexOf("List of solved classical problems");
	const section = marker === -1 ? html : html.slice(marker, marker + 400_000);
	const ids = new Set<string>();
	for (const m of section.matchAll(/\/problems\/([A-Z0-9_]+)/g))
		ids.add(m[1]);
	return [...ids];
};

const spoj: Adapter = async (handle) => {
	const res = await fetch(
		`https://www.spoj.com/users/${encodeURIComponent(handle)}/`,
		{ headers: BROWSER_HEADERS },
	);
	if (!res.ok) return fail(`spoj http ${res.status}`);
	const html = await res.text();
	if (html.includes("List of solved classical problems") === false) {
		return fail("spoj user not found");
	}
	return { ids: parseSpoj(html), complete: true };
};

// --- CodeChef: /recent/user paginated history scrape ---

const CODECHEF_PAGE_CAP = 60;
const CODECHEF_BATCH = 8;

const parseCodechef = (content: string): string[] => {
	const ids = new Set<string>();
	for (const row of content.split("<tr")) {
		if (!row.includes("tick-icon")) continue;
		const m = row.match(/\/problems\/([A-Z0-9_]+)/);
		if (m) ids.add(m[1]);
	}
	return [...ids];
};

const fetchCodechefPage = async (handle: string, page: number) => {
	const res = await fetch(
		`https://www.codechef.com/recent/user?user_handle=${encodeURIComponent(handle)}&page=${page}`,
		{ headers: { ...BROWSER_HEADERS, Accept: "application/json" } },
	);
	if (!res.ok) throw new Error(`codechef http ${res.status}`);
	return (await res.json()) as { max_page?: number; content?: string };
};

const codechef: Adapter = async (handle) => {
	const first = await fetchCodechefPage(handle, 1).catch(() => null);
	if (!first || typeof first.content !== "string") {
		return fail("codechef unreachable or user not found");
	}

	const ids = new Set<string>(parseCodechef(first.content));
	const maxPage = Math.min(first.max_page ?? 1, CODECHEF_PAGE_CAP);

	for (let start = 2; start <= maxPage; start += CODECHEF_BATCH) {
		const pages = Array.from(
			{ length: Math.min(CODECHEF_BATCH, maxPage - start + 1) },
			(_, i) => start + i,
		);
		const results = await Promise.allSettled(
			pages.map((p) => fetchCodechefPage(handle, p)),
		);
		for (const r of results) {
			if (r.status === "fulfilled" && r.value.content) {
				for (const id of parseCodechef(r.value.content)) ids.add(id);
			}
		}
	}

	const complete = (first.max_page ?? 1) <= CODECHEF_PAGE_CAP;
	return {
		ids: [...ids],
		complete,
		note: complete ? undefined : `capped at ${CODECHEF_PAGE_CAP} pages`,
	};
};

// --- Router ---

const ADAPTERS: Record<string, Adapter> = {
	leetcode,
	codeforces,
	gfg,
	spoj,
	codechef,
};

Deno.serve(async (request: Request) => {
	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: CORS_HEADERS });
	}
	if (request.method !== "POST") {
		return jsonResponse({ error: "Method not allowed" }, 405);
	}

	let body: { provider?: string; handle?: string };
	try {
		body = await request.json();
	} catch {
		return jsonResponse({ error: "Invalid JSON body" }, 400);
	}

	const adapter = body.provider ? ADAPTERS[body.provider] : undefined;
	const handle = body.handle?.trim();
	if (!adapter) return jsonResponse({ error: "Unknown provider" }, 400);
	if (!handle) return jsonResponse({ error: "Missing handle" }, 400);

	try {
		return jsonResponse(await adapter(handle));
	} catch (err) {
		return jsonResponse(
			fail(err instanceof Error ? err.message : "sync failed"),
		);
	}
});

export { parseSpoj, parseCodechef };
