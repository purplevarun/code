// Provider registry: which judge platforms can auto-sync and how a
// catalog problem URL maps to that provider's solved-problem id.
// Pure module — no supabase/env access so it stays unit-testable.

export type ProviderMode = "partial" | "full";

export type Provider = {
	id: string;
	label: string;
	mode: ProviderMode;
	extract: (url: string) => string | null;
};

const matchUrl = (pattern: RegExp, key?: (m: RegExpMatchArray) => string) => {
	return (url: string) => {
		const m = url.match(pattern);
		return m ? (key ? key(m) : m[1]) : null;
	};
};

export const PROVIDERS: Provider[] = [
	{
		id: "leetcode",
		label: "LeetCode",
		mode: "partial",
		extract: matchUrl(/leetcode\.com\/problems\/([^/]+)/),
	},
	{
		id: "codeforces",
		label: "Codeforces",
		mode: "full",
		extract: matchUrl(
			/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Z]\d?)/,
			(m) => `${m[1]}${m[2]}`,
		),
	},
	{
		id: "spoj",
		label: "SPOJ",
		mode: "full",
		extract: matchUrl(/spoj\.com\/problems\/([A-Z0-9_]+)/i),
	},
	{
		id: "gfg",
		label: "GFG",
		mode: "full",
		extract: matchUrl(/geeksforgeeks\.org\/problems\/([^/]+)/),
	},
	{
		id: "codechef",
		label: "CodeChef",
		mode: "full",
		extract: matchUrl(/codechef\.com\/problems\/([A-Z0-9_]+)/i),
	},
];

export const getProvider = (id: string) => PROVIDERS.find((p) => p.id === id);
