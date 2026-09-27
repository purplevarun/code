import { createClient } from "@supabase/supabase-js";

const url = (
	import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
	import.meta.env.VITE_SUPABASE_URL ||
	""
).trim();
const anonKey = (
	import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
	""
).trim();

const getUrlValidationError = (value: string) => {
	if (!value)
		return "Missing VITE_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL).";
	if (value.includes("your-project.supabase.co")) {
		return "VITE_PUBLIC_SUPABASE_URL is still using the example placeholder value.";
	}

	try {
		const parsed = new URL(value);
		if (!parsed.hostname.endsWith(".supabase.co")) {
			return "Supabase URL must point to a *.supabase.co project endpoint.";
		}
	} catch {
		return "VITE_PUBLIC_SUPABASE_URL is not a valid URL.";
	}

	return null;
};

const getAnonKeyValidationError = (value: string) => {
	if (!value)
		return "Missing VITE_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY).";
	if (value === "your-anon-key") {
		return "VITE_PUBLIC_SUPABASE_ANON_KEY is still using the example placeholder value.";
	}
	return null;
};

export const supabaseConfigError =
	getUrlValidationError(url) || getAnonKeyValidationError(anonKey);

export const isSupabaseConfigured = !supabaseConfigError;

export const supabaseUrl = url;

export const supabase = isSupabaseConfigured
	? createClient(url, anonKey, {
			db: { schema: "purplecode" },
			auth: {
				persistSession: false,
				autoRefreshToken: false,
				detectSessionInUrl: false,
			},
		})
	: null;
