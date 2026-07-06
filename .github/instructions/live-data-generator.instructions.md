---
applyTo: "application/live-data-generator/**"
---

# Live Data Generator Instructions

- Keep the generator as one app boundary under `application/live-data-generator`.
- Use shared contracts for backend and frontend generator code.
- Publish events through the main backend ingestion API; never bypass validation.
