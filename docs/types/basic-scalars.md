---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Concrete scalars'
---

The fundamental WGSL types are:

- `i32` - a signed, two's complement, 32-bit integer.
- `u32` - an unsigned 32-bit integer.
- `f32` - an IEEE-754 binary32, floating point.
- `bool` - a `true` or `false` value, with no specified storage representation.

These types are known as concrete scalar types, and can be used in [all evaluation stages](../expressions/evaluation-stage/index.md).
