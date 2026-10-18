import { BookOpen } from "lucide-react";
import { PROBLEM_SET_ICONS } from "../lib/problem-set.constants";

export default function ProblemSetIcon({
	slug,
	size = 18,
}: {
	slug: string;
	size?: number;
}) {
	const Icon = PROBLEM_SET_ICONS.get(slug) ?? BookOpen;
	return <Icon size={size} aria-hidden="true" className="problem-set-icon" />;
}
