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

---

## Sub-16-Bit Scalar Limitations

WGSL does not support low-precision scalar float types like `f8`, `f4`, or `f2`. 

- **Booleans as 1-Bit Flags**: A `bool` acts logically as a 1-bit value (conceptually a logical "f1"). However, `bool` types have no specified physical storage representation and **cannot** be stored in host-shareable memory buffers (such as uniform or storage buffers).
- **Minimum Floating-Point Precision**: The smallest native floating-point types supported by WebGPU are `f32` and `f16` (the latter requiring the `f16` hardware extension).

### Bitwise Data Packing for Compact Storage

For applications demanding high-density, low-precision storage (such as packing 3D normal vectors, custom 8-bit color weights, or specular coefficients), developers must pack their data manually. 

Instead of relying on nonexistent hardware types like `f8` or `f4`, developers map these values to integers and utilize bitwise shift and mask operations to store multiple components inside a single `u32` or `i32` scalar. 

See the **[Bitwise Operators & Data Packing](../expressions/operators/bitwise-packing.md)** guide for a comprehensive tutorial on compression and decompression techniques on the GPU.

