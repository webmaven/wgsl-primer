---
title: 'Expressions'
---

# Expressions Overview

An expression in WGSL is a sequence of operators and operands that evaluates to a value, type, function, or builtin enumerator. Value expressions are categorized by how they are structured, their typing rules, and the stages in which they are evaluated by the compiler and GPU.

Sections of the expressions curriculum:

- **[Strict Typing](strict-typing.md)**: WGSL's "no implicit coercion" design, explicit type constructors, and compile-time type safety mechanisms.
- **[Operators Reference](operators/index.md)**: Arithmetic, bitwise, logical, comparison, assignment, and compound assignment operators, with matrix/vector overloaded behaviors.
- **[Bitwise & Data Packing](operators/bitwise-packing.md)**: Shift-and-mask bitwise operations for packing normal vectors and specular values into a single `u32` to save G-buffer bandwidth.
- **[Evaluation Stages](evaluation-stage/index.md)**: Stages of expression evaluation:
    - **[Stages Overview](evaluation-stage/overview/index.md)**: Timeline of compilation stages, from compile-time to pipeline creation and execution.
    - **[Constant Stage](evaluation-stage/constant/index.md)**: Expressions evaluated at compile time, including `const` declarations, compile-time boolean literals, and `@const` built-ins.
        - **[Numeric Literals](evaluation-stage/constant/numeric-literals.md)**: Abstract numeric types, base-10 and base-16 formats, hexadecimal float notation, and `f16` half-precision float literals.
    - **[Override Stage](evaluation-stage/override/index.md)**: CPU-configurable pipeline-creation constant expressions declared with `override`.
    - **[Runtime Stage](evaluation-stage/runtime/index.md)**: Dynamic execution-time evaluations on the GPU, immutable registers (`let`), and mutable local thread variables (`var`).
