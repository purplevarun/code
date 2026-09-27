# Command Execution Policy (Highest Priority)

1. Use only the `./run` script for command execution.

2. Never invent commands.

3. Never execute commands directly using:
    - npm
    - npx
    - yarn
    - pnpm
    - gradle
    - vite
    - jest
    - tsc
    - or any other executable

4. Always use an equivalent `./run` command.

Examples:

- Build:
    ```bash
    ./run build
    ```

# Scope Control

- Make the minimum change required to satisfy the request.
- Do not refactor unrelated code.
- Do not rename files unless necessary.
- Do not modify unrelated tests.
- Do not introduce new libraries without user approval.
- Reuse existing implementations before creating new ones.
- Search for similar patterns before adding new code.

# Repository Exploration

- Before creating a new file, search for an existing equivalent.
- Before creating a new component, hook, service, utility, constant or helper, search the repository for an existing implementation.
- Extend existing code instead of duplicating functionality.
- Do not create alternative implementations of existing logic.

# Token Usage

- Read only files relevant to the task.
- Avoid scanning the entire repository unless explicitly required.
- Avoid repeatedly opening the same files.
- Avoid generating large plans for small changes.
- Avoid explaining obvious code.
- Keep implementation summaries concise.
- Prefer targeted file inspection over broad repository analysis.
- Do not repeatedly run the same command unless the previous result indicates it is necessary.

# Change Size Limits

- Do not modify more files than necessary.
- Prefer updating existing files over creating new files.
- Create new files only when no suitable location exists.
- Keep pull-request scope focused on the requested change.

# Debugging Strategy

When a build or test fails:

1. Identify the root cause.
2. Explain the root cause briefly.
3. Implement the smallest fix possible.
4. Re-run validation.
5. Stop once the issue is resolved.

Do not perform speculative fixes.

# Completion Requirements

Before marking work as complete:

- Run `./run format`
- Run `./run test`
- Ensure 100% coverage on modified code
- Ensure build passes
- Remove dead code
- Remove unused imports
- Verify no duplicated logic exists

# Code Quality

- Follow existing project architecture.
- Follow existing naming conventions.
- Keep the code DRY.
- Prefer composition over duplication.
- Prefer constants over magic strings.
- Extract reusable logic when duplicated 2+ times.
- Avoid unnecessary comments when code is self-explanatory.

# Constants

- Use `*constants.ts` files for all shared constants.
- Extract hardcoded strings into constants when reused.
- Do not introduce magic strings in business logic.
- Group related constants together.

# Confidence

Before making assumptions:

- Search the codebase for evidence.
- If evidence cannot be found, explicitly state:
  "I could not find evidence for this assumption."
