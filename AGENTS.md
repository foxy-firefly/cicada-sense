# Agent Instructions - Cicada Sense

Documentation is the source of truth. Read these files before generating code:

- `docs/technical/architecture/index.md`
- `docs/technical/development/index.md`

Key rules:

- Preserve Clean Architecture boundaries.
- Keep fixtures production-shaped and deterministic.
- Route live fixture data through the same ingestion contracts as production data.
- Use Biome and Vitest for checks.
- Do not hardcode user-facing text in frontend components once i18n keys exist.
- Do not add secrets to source control.
