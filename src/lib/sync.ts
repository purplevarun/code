import { problemSets } from "../data/problemSets";
import { PROVIDERS } from "./providers";
import { supabase, supabaseUrl } from "./supabase";

export type SyncResultLine = {
	provider: string;
	label: string;
	matched: number;
	note?: string;
};

type SyncResponse = {
	ids?: string[];
	complete?: boolean;
	note?: string;
	extra?: { titles?: string[]; publicSolvedCount?: number | null };
};

const SYNC_ENDPOINT =
	(import.meta.env.VITE_SYNC_URL || "").trim() ||
	(supabaseUrl ? `${supabaseUrl}/functions/v1/sync` : "");

const normalizeText = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

// Build provider-id -> problem-code lookup tables once from the catalog.
const idToCodeByProvider = (() => {
	const maps = new Map<string, Map<string, Set<string>>>();
	for (const provider of PROVIDERS) {
		const map = new Map<string, Set<string>>();
		for (const set of problemSets) {
			for (const topic of set.topics) {
				for (const problem of topic.problems) {
					const id = provider.extract(problem.url);
					if (!id) continue;
					if (!map.has(id)) map.set(id, new Set());
					map.get(id)?.add(problem.code);
				}
			}
		}
		maps.set(provider.id, map);
	}
	return maps;
})();

// LeetCode-only fallback: match by normalized problem title.
const titleToCodes = (() => {
	const map = new Map<string, Set<string>>();
	for (const set of problemSets) {
		for (const topic of set.topics) {
			for (const problem of topic.problems) {
				if (!problem.url.includes("leetcode.com/problems/")) continue;
				const key = normalizeText(problem.name);
				if (!map.has(key)) map.set(key, new Set());
				map.get(key)?.add(problem.code);
			}
		}
	}
	return map;
})();

const callSync = async (
	provider: string,
	handle: string,
): Promise<SyncResponse> => {
	const response = await fetch(SYNC_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ provider, handle }),
	});
	if (!response.ok) return { note: `http ${response.status}`, ids: [] };
	return (await response.json()) as SyncResponse;
};

// Sync every configured handle, then write all matched codes in one RPC.
// Returns per-provider result lines and the number of codes written.
export const syncUser = async (
	userId: string,
	handles: Record<string, string>,
): Promise<{ lines: SyncResultLine[]; written: number }> => {
	const lines: SyncResultLine[] = [];
	const matchedCodes = new Set<string>();

	await Promise.all(
		PROVIDERS.map(async (provider) => {
			const handle = (handles[provider.id] || "").trim();
			if (!handle) return;

			let result: SyncResponse;
			try {
				result = await callSync(provider.id, handle);
			} catch {
				lines.push({
					provider: provider.id,
					label: provider.label,
					matched: 0,
					note: "unreachable",
				});
				return;
			}

			let matched = 0;
			const map = idToCodeByProvider.get(provider.id);
			for (const id of result.ids ?? []) {
				for (const code of map?.get(id) ?? []) {
					if (matchedCodes.has(code)) continue;
					matchedCodes.add(code);
					matched += 1;
				}
			}

			if (provider.id === "leetcode") {
				for (const title of result.extra?.titles ?? []) {
					for (const code of titleToCodes.get(normalizeText(title)) ??
						[]) {
						if (matchedCodes.has(code)) continue;
						matchedCodes.add(code);
						matched += 1;
					}
				}
			}

			const parts: string[] = [];
			if (result.note) parts.push(result.note);
			if (!result.complete && !result.note)
				parts.push(
					provider.mode === "partial" ? "recent only" : "partial",
				);

			lines.push({
				provider: provider.id,
				label: provider.label,
				matched,
				note: parts.join(" · ") || undefined,
			});
		}),
	);

	let written = 0;
	if (matchedCodes.size && supabase) {
		const { error } = await supabase.rpc("add_solved_many", {
			p_user_id: userId,
			p_slugs: [...matchedCodes],
		});
		if (error) throw new Error("Could not save synced progress");
		written = matchedCodes.size;
	}

	lines.sort((a, b) => a.label.localeCompare(b.label));
	return { lines, written };
};
