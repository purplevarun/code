export const uniqueSolvedCount = (
	slugs: readonly (string | null | undefined)[],
): number => new Set(slugs.filter((s): s is string => Boolean(s))).size;

export const getJourneyProgress = (
	codes: readonly string[],
	solvedCodes: ReadonlySet<string>,
) => {
	const uniqueCodes = [...new Set(codes)];
	const total = uniqueCodes.length;
	const solved = uniqueCodes.filter((code) => solvedCodes.has(code)).length;
	return {
		total,
		solved,
		percent: total === 0 ? 0 : Math.round((solved / total) * 100),
		nextCode: uniqueCodes.find((code) => !solvedCodes.has(code)),
	};
};
