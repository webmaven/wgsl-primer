---
title: 'Abstract-numerics'
shader: ./abstract-numerics.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "pi", "type": "f32"}, {"expr": "two", "type": "i32"}, {"expr": "two_pi", "type": "f32"}, {"expr": "implicitly_convert_abstract_int_to_i32", "type": "i32"}, {"expr": "implicitly_convert_abstract_int_to_u32", "type": "u32"}, {"expr": "implicitly_convert_abstract_int_to_f32", "type": "f32"}, {"expr": "implicitly_convert_abstract_float_to_f32", "type": "f32"}]}'
---

An abstract-numeric type is one of:

- `abstract-float`: a 64-bit floating point type.
- `abstract-int`: a 64-bit signed integer type.

Abstract-numerics allow high-precision values to be computed for constant-expressions.
These computations occur at compile time on the CPU ---
just like your JavaScript or WASM --- and not on the GPU.

Abstract-numerics have some special properties:

- **Abstract-numeric types can't be spelled in WGSL source code**

  You cannot explicitly _name_ an abstract-numeric type, but they exist as the type
  of unsuffixed [numeric literals](../expressions/evaluation-stage/constant/numeric-literals.md),
  and some constant-expressions.

- **Only constant-expressions can be of abstract-numeric type**

  Abstract-numeric values must first be converted to a concrete (non-abstract) type
  for use as an [override-expression](../expressions/evaluation-stage/override/index.md)
  or as a [runtime-expression](../expressions/evaluation-stage/runtime/index.md).

- **Abstract-numeric expressions must be finite**

  Compilation fails if an abstract-numeric expression
  overflows, wraps, or produces an infinity or a NaN.

- **Unlike other types in WGSL, abstract-numerics support implicit type conversion**

  An `abstract-int` can implicitly convert to a `i32`, `u32`, `f32` or `abstract-float`.

  An `abstract-float` can implicitly convert to a `f32`.

  Abstract-numeric values can also be explicitly converted using the standard conversion syntax.

  Sometimes no explicit target type is specified to receive an abstract-numeric expression.
  For example, this occurs when an abstract-numeric expression is the initializer for
  a `var`, `let`, or `override` declaration.
  In this situation, a default conversion is performed:

  - An `abstract-int` value will convert to `i32`.
  - An `abstract-float` value will convert to `f32`.
