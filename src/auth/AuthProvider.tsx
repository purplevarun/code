import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigError } from "../lib/supabase";

const SUPABASE_ENV_HELP =
	"Set VITE_PUBLIC_SUPABASE_URL/VITE_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY).";

type OtherDetails = {
	name?: string;
	handles?: Record<string, string>;
	[key: string]: unknown;
};

type User = {
	id: string;
	username: string;
	name?: string | null;
	handles: Record<string, string>;
	otherDetails: OtherDetails;
};

type AuthContextType = {
	user: User | null;
	loading: boolean;
	checkUsernameExists: (username: string) => Promise<boolean>;
	signIn: (username: string, password: string) => Promise<void>;
	signUp: (
		username: string,
		password: string,
		leetcodeUsername?: string,
	) => Promise<void>;
	updateHandles: (handles: Record<string, string>) => Promise<void>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (row: {
	id: string;
	username: string;
	otherDetails?: OtherDetails | null;
}): User => {
	const otherDetails = row.otherDetails ?? {};
	return {
		id: row.id,
		username: row.username,
		name: typeof otherDetails.name === "string" ? otherDetails.name : null,
		handles: otherDetails.handles ?? {},
		otherDetails,
	};
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const bootstrap = async () => {
			try {
				const saved = localStorage.getItem("purpledsa-user");
				if (saved) setUser(JSON.parse(saved));
			} catch {
				setUser(null);
			} finally {
				setLoading(false);
			}
		};
		bootstrap();
	}, []);

	const missingPoliciesError = (verb: string) => {
		return new Error(
			`${verb} Supabase permissions/policies are missing for table "users". Run the SQL in supabase-schema.sql in this Supabase project.`,
		);
	};

	const isPolicyError = (message: string) => {
		const detail = message.toLowerCase();
		return (
			detail.includes("permission denied") ||
			detail.includes("row-level security")
		);
	};

	const checkUsernameExists = async (username: string) => {
		const cleanUsername = username.trim();
		if (!cleanUsername) throw new Error("Username required");

		if (!supabase) {
			throw new Error(
				`Supabase is not configured. ${supabaseConfigError} ${SUPABASE_ENV_HELP}`,
			);
		}

		const { data, error } = await supabase
			.from("users")
			.select("id")
			.eq("username", cleanUsername)
			.limit(1);

		if (error) {
			if (isPolicyError(error.message || "")) {
				throw missingPoliciesError("Unable to verify user.");
			}
			throw new Error(`Unable to verify user. ${error.message}`);
		}
		return (data?.length ?? 0) > 0;
	};

	const signIn = async (username: string, password: string) => {
		const cleanUsername = username.trim();
		if (!cleanUsername || !password)
			throw new Error("Username and password required");
		if (!supabase) {
			throw new Error(
				`Supabase is not configured. ${supabaseConfigError} ${SUPABASE_ENV_HELP}`,
			);
		}

		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("username", cleanUsername)
			.single();

		if (error) {
			if (isPolicyError(error.message || "")) {
				throw missingPoliciesError("Unable to sign in.");
			}
			throw new Error("Invalid username or password");
		}

		if (!data) throw new Error("Invalid username or password");

		const hash = data.passwordHash ?? "";
		if (!hash) throw new Error("Invalid username or password");

		const isValid = await comparePassword(password, hash);
		if (!isValid) throw new Error("Invalid username or password");

		const nextUser = toUser(data);
		setUser(nextUser);
		localStorage.setItem("purpledsa-user", JSON.stringify(nextUser));
	};

	const signUp = async (
		username: string,
		password: string,
		leetcodeUsername?: string,
	) => {
		const cleanUsername = username.trim();
		const cleanLeetcode = (leetcodeUsername ?? "").trim();

		if (!cleanUsername || !password)
			throw new Error("Username and password required");
		if (cleanUsername.length < 3)
			throw new Error("Username must be at least 3 characters");
		if (password.length < 6)
			throw new Error("Password must be at least 6 characters");

		if (!supabase) {
			throw new Error(
				`Supabase is not configured. ${supabaseConfigError} ${SUPABASE_ENV_HELP}`,
			);
		}

		const passwordHash = await hashPassword(password);
		const otherDetails: OtherDetails = {
			name: cleanUsername,
			handles: cleanLeetcode ? { leetcode: cleanLeetcode } : {},
		};
		const nextUser = {
			id: crypto.randomUUID(),
			username: cleanUsername,
			passwordHash,
			problemsSolved: [],
			otherDetails,
		};

		const { error } = await supabase.from("users").insert(nextUser);
		if (error) {
			if (error.code === "23505") {
				throw new Error("Username already exists");
			}
			if (isPolicyError(error.message || "")) {
				throw missingPoliciesError("Could not create account.");
			}
			throw new Error("Could not create account");
		}

		const sessionUser = toUser(nextUser);
		setUser(sessionUser);
		localStorage.setItem("purpledsa-user", JSON.stringify(sessionUser));
	};

	const updateHandles = async (handles: Record<string, string>) => {
		if (!user) throw new Error("You must be signed in");

		if (!supabase) {
			throw new Error(
				`Supabase is not configured. ${supabaseConfigError} ${SUPABASE_ENV_HELP}`,
			);
		}

		const nextDetails = {
			...user.otherDetails,
			handles,
		};

		const { error } = await supabase
			.from("users")
			.update({ otherDetails: nextDetails })
			.eq("id", user.id);

		if (error) {
			if (isPolicyError(error.message || "")) {
				throw missingPoliciesError("Could not update settings.");
			}
			throw new Error("Could not update settings");
		}

		const nextUser = { ...user, handles, otherDetails: nextDetails };
		setUser(nextUser);
		localStorage.setItem("purpledsa-user", JSON.stringify(nextUser));
	};

	const signOut = async () => {
		setUser(null);
		localStorage.removeItem("purpledsa-user");
	};

	const value = useMemo(
		() => ({
			user,
			loading,
			checkUsernameExists,
			signIn,
			signUp,
			updateHandles,
			signOut,
		}),
		[user, loading],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

const comparePassword = async (input: string, hash: string) => {
	return (await hashPassword(input)) === hash;
};

const hashPassword = async (input: string) => {
	const text = new TextEncoder().encode(input);
	const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", text));
	return Array.from(bytes)
		.map((x) => x.toString(16).padStart(2, "0"))
		.join("");
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
};
