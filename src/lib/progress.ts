export const uniqueSolvedCount = (
	slugs: readonly (string | null | undefined)[],
): number => new Set(slugs.filter((s): s is string => Boolean(s))).size;
