---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Constant Stage Overview'
shader: ./constant.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "my_constant", "type": "i32"}, {"expr": "angle_rad", "type": "f32"}]}'
---
The **Constant Stage** is the earliest stage in the lifecycle of a WGSL expression. Expressions evaluated during this stage are called **constant-expressions**. They are computed entirely by the compiler on the CPU at **shader module creation time** (when WebGPU loads your shader).

By computing values at compile-time, WGSL can completely eliminate execution overhead on the GPU for those computations.

---

## What makes a Constant Expression?

A constant-expression can only be formed from:
1. Literals (like `true`, `false`, `42`, or `3.14`).
2. Declarations created with the `const` keyword.
3. Other constant-expressions.
4. Calls to WGSL built-in functions that are annotated with `@const` (where all arguments are also constant-expressions).

---

## Constant Declarations (`const`)

A variable declared with the `const` keyword binds a name to a **constant-expression**. 

Once defined, a `const` identifier can be used as a sub-expression inside any other constant-expression, acting as a foundational building block for compile-time math.

!!! info "Syntax Reference: `const` Declarations"
    For full syntax patterns, scoping rules, type inference, and validation constraints of compile-time constants, refer to the **[`const` Declarations](../../../variables/const.md)** guide.

---

## Boolean Literals & Evaluation

The boolean literals in WGSL are `true` and `false`. They are constant-expressions.

Logical operations (`&&`, `||`, `!`) and relational operations (`==`, `!=`, `<`, `<=`, `>`, `>=`) performed between constant-expressions are evaluated at compile-time to produce a constant boolean value.

---

## `@const` Built-in Functions

Many [WGSL built-in functions](https://www.w3.org/TR/WGSL/#builtin-functions) are annotated with the `@const` attribute in the language specification. 

If you call an `@const` built-in function and pass **only constant-expressions as arguments**, the WGSL compiler executes that function at compile-time on the CPU and folds the result.

```wgsl
const degree = 30.0;

// radians() is annotated with @const, so this whole call 
// is evaluated by the compiler to a single constant-expression.
const rad = radians(degree); 
```

This allows you to write clean, mathematically readable constants (e.g., using `sin()`, `cos()`, `abs()`, `log()`) without paying any runtime performance penalty.

---

## Compile-Time Assertions (`const_assert`)

WGSL provides the `const_assert` statement to enforce logical constraints at compile-time. If the boolean expression inside a `const_assert` evaluates to `false`, the compiler immediately halts compilation and throws a shader build error.

```wgsl
const chunk_size = 16u;

// Force compilation to fail if chunk_size is not a multiple of 4
const_assert (chunk_size % 4u) == 0u; 
```

`const_assert` is an invaluable tool for validating layout requirements, vertex alignment constraints, or uniform buffer size limits.

---

## Typical Uses of Constants

Because constant-expressions are fully resolved before the shader executes, you can use them in place of literal numbers anywhere in your shader, such as:

- Specifying the size of fixed-size arrays: `array<f32, my_constant * 2>`
- Configuring compute shader workgroup sizes: `@workgroup_size(my_constant)`
- Assigning binding or location indices: `@location(my_constant)`

---

## Interactive Visualizer

The interactive panel on the right demonstrates compile-time constant folding. 

Note that `my_constant` and `angle_rad` are evaluated on the CPU by the compiler, and their pre-computed values are directly embedded into the shader instructions before the GPU executes.