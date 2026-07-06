# Contributing

## Setup

```bash
make setup
make ci
```

Do not run Node.js or package-manager commands from the repository root. Use `make` targets so tooling runs inside containers.

## Workflow

- Create focused changes that map to one technical story.
- Add tests for each behavior change.
- Keep documentation aligned with architecture and setup changes.
- Use Conventional Commits.

## Quality Gates

Run `make ci` before opening a pull request.
