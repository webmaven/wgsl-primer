---
title: 'Types'
---

# Types Overview

WGSL supports a wide range of types to enable efficient GPU programming:

- **[Basic Scalars](basic-scalars.md)**: Standard concrete scalar types including `bool`, `i32`, `u32`, and `f32`.
- **[Abstract Numerics](abstract-numerics.md)**: Compile-time high-precision `abstract-int` and `abstract-float` types.
- **[Vectors](vectors/index.md)**: Multi-component vector types (`vec2`, `vec3`, `vec4`), aliases, constructors, and swizzling.
- **[Matrices](matrices/index.md)**: Column-major matrix types (dimensions \(2 \times 2\) through \(4 \times 4\)) and matrix-vector operations.
- **[Arrays](arrays/index.md)**: Statically-sized and runtime-sized collections of uniform elements.
- **[Structures](structures/index.md)**: Custom user-defined types, alignment properties, and member layout configurations.
- **[Pointers](pointers/index.md)**: Pointer syntax, address spaces, access modes, and strict pointer aliasing rules.
- **[Atomics](atomics/index.md)**: Safe lock-free concurrent memory operations and thread coordination.
