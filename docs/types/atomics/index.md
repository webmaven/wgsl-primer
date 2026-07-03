---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Atomics Overview'
---
!!! warning "Advanced Topic"
    Atomic types are an advanced topic.

Atomic types help you synchronize between different invocations executing a shader.

---

## Next Steps

Atomic concepts and operations:

- **[The Coordination Problem](overview.md)**: Race conditions, concurrency issues, and shared variable serialization.
- **[Atomic Types](atomic-types.md)**: Declaration constraints, non-constructibility, and supported integer types.
- **[Atomic Operations](atomic-operations.md)**: Built-in atomic functions, read-modify-write, and Compare-and-Swap retry loops.