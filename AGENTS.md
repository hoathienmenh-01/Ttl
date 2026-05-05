# AGENTS.md — Codex Rules

You are working on the current repository only.

## Token-saving rules

- Do not read the entire docs folder by default.
- Do not `cat` large files.
- Do not perform a broad full-codebase audit unless the task requires it.
- First inspect only:
  - package.json
  - README.md if present
  - HANDOFF.md or docs/AI_HANDOFF_REPORT.md if present
  - docs/AI_CONTEXT_MIN.md
  - file tree names using ls/find
- Use rg/grep to find exact relevant files.
- Open only files directly related to the selected task.
- If large design documents are needed, search them by keyword and read only the relevant section.
- Prefer small vertical slices.
- Do not rewrite the project.
- Do not change the stack.
- Do not create a new project.

## Development rules

- Current code is the source of truth.
- Docs are guidance, not a rewrite command.
- Server/backend must decide EXP, currency, item, quest reward, combat result, drops, and claim logic.
- Frontend must only display data and call APIs.
- Prevent double claim / double reward.
- Do not add pay-to-win features.
- Add tests or integrity checks when adding gameplay logic.
- Run the smallest useful test/build commands available.
- Update HANDOFF.md or docs/AI_HANDOFF_REPORT.md after changes.

## Work style

- Spend minimal time auditing.
- Pick one small valuable scope.
- Implement it.
- Test it.
- Summarize changed files, commands run, risks, and next step.
