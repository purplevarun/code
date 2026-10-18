# PurpleCode

Learn DSA through 13 ordered interview journeys, from arrays and linked lists to graphs and dynamic programming. Sign in to track shared progress across every collection and climb the leaderboard.

- ✅ NeetCode 150 problem coverage
- 13 interview journeys with connected explanations, progressive hints, and topic icons
- ✅ Username/password auth using a Supabase-backed `users` table
- ✅ Leaderboard and progress tracking
- ✅ Minimal dark/light mode UI
- ✅ Static site on GitHub Pages with Supabase Postgres

## Tech stack

- GitHub Pages for hosting (deployed via GitHub Actions)
- Supabase Postgres and client (`purplecode` schema in the shared supabase-common project)
- Supabase Edge Function for the LeetCode GraphQL proxy
- Vite + React for the app shell
- Custom credential auth using the `purplecode.users` table

## What you need for Supabase

The app lives in a `purplecode` schema inside the shared supabase-common project.

1. Run the SQL in `supabase-schema.sql` in the project's SQL Editor. It creates the `purplecode` schema, the `users` table, grants, RLS policies, and the RPC functions used by progress tracking.
2. In Project Settings → API → Exposed schemas, add `purplecode`.
3. Deploy the provider-sync edge function once: `supabase functions deploy sync --no-verify-jwt` (or paste `supabase/functions/sync/index.ts` in the dashboard with JWT verification off).
4. Copy the project URL and publishable key into `.env` and the GitHub repo secrets.

## Progress sync

Sync is additive — it only ever marks problems solved, never unmarks them. Configure per-platform usernames in Settings:

| Provider                        | Coverage                                    |
| ------------------------------- | ------------------------------------------- |
| Codeforces                      | Full history (`user.status` API)            |
| SPOJ                            | Full solved list (public profile)           |
| GeeksforGeeks                   | Full solved list (practice API)             |
| CodeChef                        | Full submission history (paginated scrape)  |
| LeetCode                        | ~20 most recent accepted (public API limit) |
| CSES / NeetCode / CodeZym / HLD | Manual checkmarks only                      |

## Required environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Then fill in the values:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

The app also accepts `VITE_PUBLIC_SUPABASE_URL`, `VITE_PUBLIC_SUPABASE_ANON_KEY`, and `VITE_SUPABASE_ANON_KEY`. `VITE_SYNC_URL` optionally overrides the provider-sync endpoint (default `${VITE_SUPABASE_URL}/functions/v1/sync`).

These `VITE_*` values are bundled into the browser app. Use only the public publishable/anon key, never a Supabase service-role key.

Use the exact same values in both places if you want local and production to share one database:

1. Local `.env`
2. GitHub repo secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)

If those values differ, local and production will point to different Supabase projects.

## Local development

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create `.env`:

    ```bash
    cp .env.example .env
    ```

3. Start the app:

    ```bash
    ./run dev
    ```

4. Open the app and sign in.

## GitHub Pages deployment

1. Repo Settings → Pages → Source: "GitHub Actions".
2. Add repo secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Push to `main` — `.github/workflows/deploy.yml` builds `dist/` and deploys it.
4. The site serves from `/<repo-name>/` with hash-based routes (`/#/sets/...`).

## Data migration

The one-time migration from the old Vercel-managed Supabase project was
completed 2026-09-27 — all users, password hashes, and solved-progress
arrays were imported into `purplecode.users` and verified. The local JSON
backup under `backup/` is gitignored (it contains password hashes); keep
it or delete it, it is not needed by the app.

## Notes

- `.env.local` should never be committed.
- `.env.example` is the template for local setup.
- The Supabase SQL schema is in `supabase-schema.sql`.

## Useful scripts

```bash
./run dev
./run format --ignore-path .gitignore
./run test
./run build
```

The format command above respects the existing ignore rules for generated output, dependencies, and private local backups. `./run test` first type-checks all tests using their Node-specific `tests/tsconfig.json`, then forwards arguments to Node's test runner; for example, `./run test tests/problem-data.test.ts` executes the catalog checks only.

## Problem data

Free DSA Essentials is PurpleCode's own collection of 100 coding exercises across nine topic groups. The former Striver/A2Z sheet has been removed, including its paid practice and lesson-only links. The collection is available at `/sets/free-dsa-essentials`.

| Platform      | Exercises | Progress       |
| ------------- | --------: | -------------- |
| LeetCode      |        42 | Automatic sync |
| NeetCode      |         5 | Manual         |
| GeeksforGeeks |        15 | Manual         |
| SPOJ          |        11 | Manual         |
| CodeChef      |         7 | Manual         |
| Codeforces    |        10 | Manual         |
| CSES          |        10 | Manual         |

Only free submissions belong in the collection; a free account may be required. Premium courses, editorials, hints, and AI features are outside its scope. Settings lists the platform breakdown and links to filtered exercise lists. The master index contains only exercises in active coding sets; design sets are separate.

Access was audited on September 10, 2026 against LeetCode's public `paid_only` metadata, the GFG and Codeforces catalogs, CodeChef's practice API (judge enabled; login is the only reported submission restriction), NeetCode's free practice pages, and CSES task pages. Three unavailable CodeChef candidates were excluded. SPOJ uses its canonical classical problem URLs, but its browser-security challenge prevented automated live-page verification; no actual judge submissions were made during verification.

Keep problem codes stable when correcting names or URLs because saved progress uses those codes. GFG practice links must use the exact `/problems/<slug>/1` URL; never derive slugs from titles or substitute search URLs. Use a verified free equivalent for premium LeetCode questions, not merely `locked: false`. Platform buttons display supplied practice links or supported HLD articles with their actual website labels.

### Learning Journeys

The dashboard follows a foundation-first order across 13 curricula:

| Journey                  | Steps | Route                                 | Main coverage                                                                                                 |
| ------------------------ | ----: | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Arrays & Strings         |    29 | `/#/sets/arrays-strings-journey`      | In-place updates, hashing, string encoding/KMP, prefix sums, two pointers, windows, matrices                  |
| Sorting & Search         |    20 | `/#/sets/searching-sorting-journey`   | Merge/quick sort, selection, boundary search, rotations, answer-space search, optional range-query structures |
| Linked List              |    16 | `/#/sets/linked-list-journey`         | Rewiring, fast/slow pointers, cycles, merging, random pointers, doubly linked lists, LRU                      |
| Stack                    |    27 | `/#/sets/stack-journey`               | LIFO, parsing, recursion, nearest neighbors, spans, histogram/water, greedy simulation                        |
| Queue                    |    19 | `/#/sets/queue-journey`               | Circular buffers, deques, emulation, streams, windows, min/max queues, BFS and dependencies                   |
| Recursion & Backtracking |    13 | `/#/sets/backtracking-journey`        | Choice trees, subsets/permutations, duplicates, reuse, pruning, board search, constraints                     |
| Trees & BST              |    24 | `/#/sets/trees-journey`               | DFS orders, subtree summaries, paths, levels, reconstruction, serialization, BST updates and iterators        |
| Trie                     |     8 | `/#/sets/tries-journey`               | Shared prefixes, insertion, terminal counting, deletion, replacement, wildcards, board pruning                |
| Heap                     |    22 | `/#/sets/heap-journey`                | Heap invariants, top-k, k-way merging, two heaps, expiry, scheduling, graph frontiers                         |
| Graph                    |    23 | `/#/sets/graphs-journey`              | DFS/BFS, components, bipartiteness, union-find, topology, weighted paths, MSTs, Euler trails                  |
| Greedy & Intervals       |    14 | `/#/sets/greedy-intervals-journey`    | Choice arguments, reachability, fractional selection, deadline scheduling, merging and overlap queries        |
| Dynamic Programming      |    41 | `/#/sets/dynamic-programming-journey` | State design, 0/1 and unbounded knapsack, grids, subsequences, strings, stocks, interval DP, DAG memoization  |
| Bits & Math              |    17 | `/#/sets/bits-math-journey`           | Carries, overflow, GCD, primality/sieve, XOR, bit width, common prefixes, fast exponentiation                 |

The 273 ordered steps cover 262 unique problems and are organized into milestones, each with prerequisites, an outcome, and an original explanation connecting the exercise to earlier work. Every step has a direct free coding destination and three increasingly specific hints. The original stack progression remains intact: NGL -> NGR -> NSL -> NSR -> Stock Span -> Maximum Area Histogram (MAH) -> Trapping Rain Water. It is now one important pattern family within a broader stack curriculum, not the definition of the entire subject.

Coverage was cross-checked against the [Tech Interview Handbook's topic inventory](https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/) and the repository's existing interview-pattern collections. This is an original interview curriculum, not a copied course order or a claim to exhaust every possible interview question. Optional stretch steps include sliding-window median, regex matching, Sudoku, Euler trails, and Fenwick/segment-tree range queries. Specialized contest material such as FFT, advanced computational geometry, heavy-light decomposition, and optimized digit DP is not part of the core path. Read each journey's prerequisites; some advanced milestones deliberately reuse exercises from an earlier journey.

The expansion adds 51 UUID-backed problem records while reusing existing identities wherever the exercise already exists. The master index also now includes the existing circular-queue design exercise, previously referenced only by LLD. Solved state remains keyed by the shared problem code, so completing or unmarking a reused exercise updates every collection containing it. Repeated appearances across journeys are teaching connections, not extra unique problems. No database or user migration is needed. Top Interview Questions remains accessible at `/#/sets/top-interview` but is not featured on the dashboard.

The reader has a compact journey selector, topic-specific icons, numbered steps, milestone navigation, keyboard-operable hints, and Start/Continue links to the earliest unfinished step. All steps remain available, including after completion. Deep links such as `/#/sets/stack-journey?step=stock-span` work with GitHub Pages hash routing. Reading requires no sign-in; saving uses the existing progress flow.

New destinations were reviewed on October 18, 2026 using the [GFG practice catalog](https://practiceapi.geeksforgeeks.org/api/vr/problems/?pageMode=explore&page=1&sortBy=submissions), [LeetCode's public free/paid metadata](https://leetcode.com/api/problems/all/), and targeted GFG/CSES statements. GFG alternatives are included only where a matching exercise is verified; unsupported matches are not replaced with search or editorial links. Every journey has GFG options, but not every interview exercise has a verified GFG counterpart. A free account may be required to submit, and no authenticated submissions were made during verification. Existing provider-history limits still apply; automatic sync currently indexes primary problem URLs, not alternate GFG links.

Hints follow the linked judge: GFG subarray minimums uses the full sum, top-k frequency ties favor larger values, and kth-largest stream prefixes shorter than k return -1. Infix exponentiation is right-associative. Floyd-Warshall uses 100000000 for missing edges, and negative weights such as -1 remain valid. CSES dynamic range queries assign a value rather than adding it, and their query endpoints are one-based and inclusive. Related tasks are not assumed to have identical function signatures, output types, or equality rules.

Catalog tests discover journeys dynamically, pin core topic families and the original teaching sequences, enforce three hints and one learning connection per step, and check icons, UUID uniqueness, free practice paths, and master-index inclusion. Progress tests cover early gaps, completion, duplicate references, and empty input with 100% line, branch, and function coverage in the progress module:

```bash
./run test --experimental-test-coverage --test-coverage-include=src/lib/progress.ts --test-coverage-lines=100 --test-coverage-branches=100 --test-coverage-functions=100 tests/progress.test.ts
```

### LLD Judge Practice

The LLD sheet at `/sets/lld` contains 25 free judge-backed exercises across five groups: stateful APIs, caching and versioned state, bookings and transactions, services and editors, and concurrency. There are 24 LeetCode problems and [CodeZym's multithreaded hit counter](https://codezym.com/question/6-design-hit-counter-multithreaded). Each title and platform button opens the actual coding problem, and the platform filter separates the two judges. The old search-link prompts are no longer in the active catalog.

These exercises judge functional behavior, not OO design quality or a complete open-ended LLD interview. For example, LeetCode's parking exercise manages capacity by car type, and its ATM exercise handles banknote deposits and withdrawals, not card authentication. Hints follow those specific contracts. A free judge account is required to submit. CodeZym's counter has multithreaded Java tests and single-threaded Python tests; LeetCode's supported languages vary by problem, especially for concurrency. LeetCode progress can sync; mark the CodeZym exercise manually in PurpleCode.

Access was reviewed on September 12, 2026 using [LeetCode's public catalog](https://leetcode.com/api/problems/all/) (`paid_only: false`) and [CodeZym's catalog](https://codezym.com/questionsApi/allQuestions) plus its [question metadata](https://codezym.com/questionsApi/question/6). CodeZym question 6 has `type: 0` and `isPrivate: false`; its public client allows signed-in free users to submit type-0 questions. **`isPrivate: false` alone does not mean free submissions**: type-1 problems such as parking lots, Splitwise, and elevators require premium and were excluded. LeetCode's premium bounded queue, file-system, and tic-tac-toe exercises were also excluded. No authenticated submissions were made during verification; access policies may change.

Matching LRU, LFU, and ATM records retain their existing IDs and progress codes. New exercises have UUIDs and their own codes; unrelated retired prompts are not reassigned, and historical database progress is not deleted. Tests pin the reviewed destinations and reject search links and CodeZym premium replacements.

### HLD Study Guides

The HLD sheet at `/sets/hld` contains 20 original study guides and architecture diagrams, 60 detailed design deep dives, 60 clarifying questions, and 120 answered review questions (60 core checks plus 60 deep-dive follow-ups). Each guide covers requirements, worked capacity estimates, API contracts, data models, request flows, explicit correctness invariants, trade-offs, failure recovery, actionable monitoring, security/privacy, and validation/rollout. There are 42 reading selections and 20 video selections (15 distinct videos). These are hypothetical interview designs, not claims about a company's actual traffic or internal architecture. Explanations and diagrams are original; external material is linked and attributed, not copied.

The new product scenarios are Amazon's e-commerce marketplace, Netflix video on demand, BookMyShow ticket booking, Instagram photo sharing, and Google Drive/Dropbox synchronization. Existing messaging, feed, ride-sharing, and video-sharing topics now display WhatsApp, Twitter/X, Uber, and YouTube names while keeping their stable IDs and progress codes. The five new records use UUIDs. Product aliases such as "Book My Show", "Ticketmaster", "OTT", and "Dropbox" work in topic search and global search; deep-dive titles are also indexed globally.

The reader supports mobile topic selection, keyboard-accessible tabs, expandable answers, and zoomable/downloadable diagrams. Link to `/sets/hld?guide=design-bookmyshow&section=deep-dives`; sections are `guide`, `architecture`, `deep-dives`, `review`, and `resources`. Deep Dives includes operations, monitoring responses, security, and validation. Review includes both original self-checks and the additional follow-ups. Mermaid runs in strict mode with native SVG text and loads on demand. The "studied" checkbox is self-reported, not an assessment or code submission; HLD remains separate from coding judges.

Readings include Hello Interview, GeeksforGeeks, Amazon Builders' Library, ByteByteGo, Stripe Engineering, and official PostgreSQL, Redis, Confluent, Elastic, Flink, H3, Apple, Google, TensorFlow, S3, and IETF documentation. References are scoped explicitly: Amazon's idempotency article explains a checkout mechanism; Ticketmaster is a companion for BookMyShow; Dropbox informs file synchronization; the Netflix video is a YouTube media-pipeline companion, not a Netflix-specific walkthrough. The food-delivery guide distinguishes restaurant coordination from Gopuff's warehouse model.

Existing resources were reviewed on September 10, 2026, and new selections on September 12. Paid Hello Interview cache/payment breakdowns remain excluded. Ticketmaster (`fhdPyoO6aXI`) and Dropbox (`_UZ1ngy-kOI`) video IDs were read from publisher metadata, alongside publicly readable walkthroughs. The local network blocks YouTube, so playback, captions, and regional availability were not tested. Companion videos are labeled as such. Tests enforce all-topic depth, direct destinations, aliases, and reviewed video mappings; they are not a live availability monitor.

Video provenance:

| Video                               | Publisher reference                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Bitly (`iUU4O1sWtJA`)               | [Hello Interview: Bitly](https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly)                             |
| Rate limiter (`MIJFyUPG4Z4`)        | [Hello Interview: rate limiter](https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter)   |
| Redis (`fmT5nlEkl3U`)               | [Hello Interview: Redis](https://www.hellointerview.com/learn/system-design/deep-dives/redis)                                     |
| Session vs JWT (`fyTxwIa-1U0`)      | [ByteByteGo EP122](https://blog.bytebytego.com/p/ep122-api-gateway-101)                                                           |
| WhatsApp (`cr6p0n0N-VA`)            | [Hello Interview: WhatsApp](https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp)                       |
| Kafka (`DU8o-OTeoCc`)               | [Hello Interview: Kafka](https://www.hellointerview.com/learn/system-design/deep-dives/kafka)                                     |
| Elasticsearch (`PuZvF2EyfBM`)       | [Hello Interview: Elasticsearch](https://www.hellointerview.com/learn/system-design/deep-dives/elasticsearch)                     |
| News feed (`Qj4-GruzyDU`)           | [Hello Interview: news feed](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed)                  |
| Recommendations (`jz0-satrmrA`)     | [TensorFlow Recommenders](https://www.tensorflow.org/recommenders)                                                                |
| Ad-click aggregator (`Zcv_899yqhI`) | [Hello Interview: ad-click aggregator](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator) |
| Uber (`lsKU38RKQSo`)                | [Hello Interview: Uber](https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber)                               |
| YouTube (`IUrQ5_g3XKs`)             | [Hello Interview: YouTube](https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube)                         |
| ACID (`GAe5oB742dw`)                | [ByteByteGo EP105](https://blog.bytebytego.com/p/ep105-the-12-factor-app)                                                         |
| Ticketmaster (`fhdPyoO6aXI`)        | [Hello Interview: Ticketmaster](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster)               |
| Dropbox (`_UZ1ngy-kOI`)             | [Hello Interview: Dropbox](https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox)                         |

Run the data and link regression checks with Node.js 22.6 or newer:

```bash
./run test tests/problem-data.test.ts
```
