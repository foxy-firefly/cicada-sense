---
applyTo: "application/monitoring-workspace/backend/**"
---

# Backend Instructions

- Keep domain logic framework-free.
- Route all ingestion through application use cases.
- Preserve repository contract tests when adding adapters.
- Do not read `process.env` outside app composition or runtime entrypoints.
