import {
	ArrowRight,
	ArrowUpRight,
	BookOpen,
	Code2,
	Home,
	Layers3,
	Search,
	Settings2,
	Trophy,
	X,
} from "lucide-react";
import {
	createContext,
	useContext,
	useEffect,
	useEffectEvent,
	useId,
	useRef,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { problemSets } from "../data/problemSets";
import {
	createSearchIndex,
	searchCatalog,
	type SearchResult,
} from "../lib/search";
import "./global-search.css";

const catalog = createSearchIndex(problemSets);
const SearchContext = createContext<{
	openSearch: () => void;
	isOpen: boolean;
} | null>(null);

export const useGlobalSearch = () => {
	const context = useContext(SearchContext);
	if (!context)
		throw new Error("Global search requires GlobalSearchProvider");
	return context;
};

const resultIcon = (result: SearchResult) => {
	if (result.kind === "guide") return BookOpen;
	if (result.kind === "problem") return Code2;
	if (result.kind === "collection") return Layers3;
	if (result.href === "/leaderboard") return Trophy;
	if (result.href === "/settings") return Settings2;
	return Home;
};

export const GlobalSearchProvider = ({ children }: { children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const dialog = useRef<HTMLDialogElement>(null);
	const input = useRef<HTMLInputElement>(null);
	const list = useRef<HTMLUListElement>(null);
	const id = useId();
	const location = useLocation();
	const navigate = useNavigate();
	const results = searchCatalog(catalog, query);
	const selectedIndex = Math.min(activeIndex, results.length - 1);
	const selected = results[selectedIndex];
	const listId = `${id}-results`;

	const openSearch = () => {
		setQuery("");
		setActiveIndex(0);
		setIsOpen(true);
	};

	const closeSearch = () => {
		dialog.current?.close();
		setIsOpen(false);
	};

	const shortcut = useEffectEvent((event: KeyboardEvent) => {
		if (
			event.isComposing ||
			event.altKey ||
			event.shiftKey ||
			!(event.metaKey || event.ctrlKey) ||
			event.key.toLowerCase() !== "k"
		)
			return;
		event.preventDefault();
		if (event.repeat) return;
		if (isOpen) closeSearch();
		else openSearch();
	});

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => shortcut(event);
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		if (!isOpen || !dialog.current) return;
		const element = dialog.current;
		if (!element.open) element.showModal();
		input.current?.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
			if (element.open) element.close();
		};
	}, [isOpen]);

	useEffect(() => {
		dialog.current?.close();
		setIsOpen(false);
	}, [location.key]);

	useEffect(() => {
		if (!isOpen) return;
		list.current?.children[selectedIndex]?.scrollIntoView({
			block: "nearest",
		});
	}, [isOpen, selectedIndex, selected?.id]);

	const activate = (result: SearchResult) => {
		if (result.external)
			window.open(result.href, "_blank", "noopener,noreferrer");
		closeSearch();
		if (!result.external) navigate(result.href);
	};

	const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
		if (event.nativeEvent.isComposing) return;
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			if (results.length) {
				const direction = event.key === "ArrowDown" ? 1 : -1;
				setActiveIndex(
					(selectedIndex + direction + results.length) %
						results.length,
				);
			}
		} else if (event.key === "Enter" && selected) {
			event.preventDefault();
			activate(selected);
		}
	};

	return (
		<SearchContext.Provider value={{ openSearch, isOpen }}>
			{children}
			<dialog
				ref={dialog}
				className="global-search-dialog"
				aria-label="Search PurpleCode"
				onClose={() => setIsOpen(false)}
				onCancel={(event) => {
					event.preventDefault();
					closeSearch();
				}}
				onKeyDown={(event) => {
					if (
						event.key === "Escape" &&
						!event.nativeEvent.isComposing
					) {
						event.preventDefault();
						event.stopPropagation();
						closeSearch();
					}
				}}
				onClick={(event) => {
					if (event.target !== event.currentTarget) return;
					const bounds = event.currentTarget.getBoundingClientRect();
					if (
						event.clientX < bounds.left ||
						event.clientX > bounds.right ||
						event.clientY < bounds.top ||
						event.clientY > bounds.bottom
					)
						closeSearch();
				}}
			>
				<div className="global-search-field">
					<Search size={21} aria-hidden="true" />
					<input
						ref={input}
						role="combobox"
						type="text"
						aria-label="Global search"
						aria-autocomplete="list"
						aria-expanded={isOpen}
						aria-controls={listId}
						aria-activedescendant={
							isOpen && selected
								? `${id}-result-${selectedIndex}`
								: undefined
						}
						placeholder="Search PurpleCode"
						autoComplete="off"
						spellCheck={false}
						maxLength={160}
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setActiveIndex(0);
						}}
						onKeyDown={onInputKeyDown}
					/>
					<button
						type="button"
						className="global-search-close"
						aria-label="Close search"
						title="Close search"
						onClick={closeSearch}
					>
						<X size={19} />
					</button>
				</div>
				<div className="global-search-summary">
					<span>{query.trim() ? "Results" : "Quick Access"}</span>
					<span role="status" aria-live="polite">
						{results.length}{" "}
						{results.length === 1 ? "result" : "results"}
					</span>
				</div>
				<ul
					ref={list}
					id={listId}
					role="listbox"
					tabIndex={-1}
					aria-label="Search results"
					className="global-search-results"
				>
					{results.map((result, index) => {
						const Icon = resultIcon(result);
						return (
							<li
								key={result.id}
								id={`${id}-result-${index}`}
								role="option"
								aria-selected={index === selectedIndex}
								aria-label={`${result.title}, ${result.subtitle}${result.external ? ", opens in a new tab" : ""}`}
								className="global-search-result"
								onPointerMove={() => setActiveIndex(index)}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => activate(result)}
							>
								<Icon size={20} aria-hidden="true" />
								<span className="global-search-result-copy">
									<span className="global-search-result-title">
										{result.title}
									</span>
									<span className="global-search-result-subtitle">
										{result.subtitle}
									</span>
								</span>
								{result.external ? (
									<ArrowUpRight
										size={16}
										aria-hidden="true"
									/>
								) : (
									<ArrowRight size={16} aria-hidden="true" />
								)}
							</li>
						);
					})}
				</ul>
				{!results.length && (
					<p className="global-search-empty">
						No matches for <strong>{query}</strong>.
					</p>
				)}
			</dialog>
		</SearchContext.Provider>
	);
};
