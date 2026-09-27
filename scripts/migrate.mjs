#!/usr/bin/env node
// Backup + migrate PurpleDSA data from the old Vercel-managed Supabase
// project into the `purpledsa` schema of the shared supabase-common project.
//
// Usage:
//   node scripts/migrate.mjs export [--out backup/file.json]
//   node scripts/migrate.mjs import --in backup/file.json [--dry-run]
//
// Old project creds come from .env (VITE_OLD_SUPABASE_* or VITE_SUPABASE_*).
// New project creds come from .env (VITE_NEW_SUPABASE_*) or NEW_SUPABASE_* env vars.

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE_SIZE = 1000;

const loadDotEnv = () => {
	try {
		const lines = readFileSync(resolve(ROOT, ".env"), "utf8").split("\n");
		for (const line of lines) {
			const match = line.match(
				/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]+)"?\s*$/,
			);
			if (match && !process.env[match[1]])
				process.env[match[1]] = match[2];
		}
	} catch {
		// no .env — rely on real env vars
	}
};

const argValue = (flag) => {
	const index = process.argv.indexOf(flag);
	return index === -1 ? null : process.argv[index + 1];
};

const hasFlag = (flag) => process.argv.includes(flag);

const fetchAll = async (client, table, select, filter) => {
	const rows = [];
	for (let from = 0; ; from += PAGE_SIZE) {
		let query = client
			.from(table)
			.select(select)
			.range(from, from + PAGE_SIZE - 1);
		if (filter)
			query = query.filter(filter.column, filter.op, filter.value);
		const { data, error } = await query;
		if (error) throw new Error(`Failed to read ${table}: ${error.message}`);
		rows.push(...(data ?? []));
		if (!data || data.length < PAGE_SIZE) return rows;
	}
};

const doExport = async () => {
	const url = process.env.VITE_OLD_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
	const key =
		process.env.VITE_OLD_SUPABASE_PUBLISHABLE_KEY ||
		process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
		process.env.VITE_SUPABASE_ANON_KEY;
	if (!url || !key) {
		throw new Error(
			"Missing old project creds. Set VITE_OLD_SUPABASE_URL and VITE_OLD_SUPABASE_PUBLISHABLE_KEY in .env",
		);
	}

	const oldClient = createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false },
	});

	console.log(`Exporting from ${url} ...`);
	const [users, progress] = await Promise.all([
		fetchAll(oldClient, "user", "*"),
		fetchAll(oldClient, "progress", "*"),
	]);

	const out =
		argValue("--out") ||
		`backup/supabase-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
	const outPath = resolve(ROOT, out);
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(
		outPath,
		JSON.stringify(
			{ exportedAt: new Date().toISOString(), users, progress },
			null,
			2,
		),
	);
	console.log(
		`Wrote ${users.length} users + ${progress.length} progress rows -> ${out}`,
	);
};

const doImport = async () => {
	const input = argValue("--in");
	if (!input) throw new Error("Missing --in <backup-file.json>");
	const dryRun = hasFlag("--dry-run");

	const backup = JSON.parse(readFileSync(resolve(ROOT, input), "utf8"));
	const { users = [], progress = [] } = backup;
	console.log(
		`Backup from ${backup.exportedAt}: ${users.length} users, ${progress.length} progress rows`,
	);

	const solvedByUser = new Map();
	let orphanRows = 0;
	for (const row of progress) {
		if (row.solved !== true) continue;
		if (!users.some((u) => u.id === row.userId)) {
			orphanRows += 1;
			continue;
		}
		if (!solvedByUser.has(row.userId))
			solvedByUser.set(row.userId, new Set());
		if (row.problemSlug) solvedByUser.get(row.userId).add(row.problemSlug);
	}
	if (orphanRows)
		console.log(
			`Skipping ${orphanRows} progress rows with no matching user`,
		);

	const rows = users.map((u) => ({
		id: u.id,
		username: u.username,
		passwordHash: u.passwordHash ?? "",
		problemsSolved: [...(solvedByUser.get(u.id) ?? [])].sort(),
		otherDetails: {
			name: u.name ?? u.username,
			handles: u.leetcodeUsername ? { leetcode: u.leetcodeUsername } : {},
		},
		createdAt: u.createdAt ?? new Date().toISOString(),
	}));

	for (const row of rows) {
		console.log(`  ${row.username}: ${row.problemsSolved.length} solved`);
	}
	if (dryRun) {
		console.log("Dry run — nothing written.");
		return;
	}

	const url = process.env.NEW_SUPABASE_URL || process.env.VITE_NEW_SUPABASE_URL;
	const key =
		process.env.NEW_SUPABASE_KEY ||
		process.env.VITE_NEW_SUPABASE_PUBLISHABLE_KEY ||
		process.env.VITE_NEW_SUPABASE_ANON_KEY;
	if (!url || !key) {
		throw new Error(
			"Missing new project creds. Set NEW_SUPABASE_URL / NEW_SUPABASE_KEY or VITE_NEW_SUPABASE_URL / VITE_NEW_SUPABASE_PUBLISHABLE_KEY",
		);
	}

	const newClient = createClient(url, key, {
		db: { schema: "purpledsa" },
		auth: { persistSession: false, autoRefreshToken: false },
	});

	const { error } = await newClient
		.from("users")
		.upsert(rows, { onConflict: "id" });
	if (error) throw new Error(`Import failed: ${error.message}`);
	console.log(`Imported ${rows.length} users into purpledsa.users`);

	// Verify per-user solved counts match the backup.
	const { data: written, error: readError } = await newClient
		.from("users")
		.select("id, username, problemsSolved");
	if (readError)
		throw new Error(`Verification read failed: ${readError.message}`);

	let mismatches = 0;
	for (const row of rows) {
		const found = (written ?? []).find((w) => w.id === row.id);
		const count = found?.problemsSolved?.length ?? -1;
		if (count !== row.problemsSolved.length) {
			mismatches += 1;
			console.error(
				`  MISMATCH ${row.username}: expected ${row.problemsSolved.length}, got ${count}`,
			);
		}
	}
	if (mismatches)
		throw new Error(`${mismatches} user(s) failed verification`);
	console.log("Verification passed — all solved counts match.");
};

const main = async () => {
	loadDotEnv();
	const command = process.argv[2];
	if (command === "export") await doExport();
	else if (command === "import") await doImport();
	else {
		console.log(
			"Usage: node scripts/migrate.mjs export|import [--in file] [--out file] [--dry-run]",
		);
		process.exit(1);
	}
};

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
