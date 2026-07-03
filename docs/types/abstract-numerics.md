---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Abstract Numerics'
shader: ./abstract-numerics.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "pi", "type": "f32"}, {"expr": "two", "type": "i32"}, {"expr": "two_pi", "type": "f32"}, {"expr": "implicitly_convert_abstract_int_to_i32", "type": "i32"}, {"expr": "implicitly_convert_abstract_int_to_u32", "type": "u32"}, {"expr": "implicitly_convert_abstract_int_to_f32", "type": "f32"}, {"expr": "implicitly_convert_abstract_float_to_f32", "type": "f32"}]}'
---
In statically-typed languages, types are typically fixed and rigid. However, WGSL introduces a unique and extremely powerful mechanism for compile-time arithmetic: **Abstract Numerics**. 

An abstract-numeric type is a compile-time "meta-type" used to represent numbers with extremely high precision before they are committed to the GPU's fixed-precision hardware registers.

There are two abstract-numeric types in WGSL:
* **`abstract-float`**: Represented as a 64-bit floating-point type during compile-time.
* **`abstract-int`**: Represented as a 64-bit signed integer type during compile-time.

---

## The Literal-Type Connection

!!! note "Syntax Reference: Numeric Literals"
    For full details on concrete literal suffixes (like `i`, `u`, `f`, `h`) and hexadecimal formats, refer to the **[Numeric Literals](../expressions/evaluation-stage/constant/numeric-literals.md)** guide.

Abstract types are closely tied to [Numeric Literals](../expressions/evaluation-stage/constant/numeric-literals.md). Whenever you write a numeric literal in your shader **without a suffix** (such as `i`, `u`, `f`, or `h`), its type is automatically abstract:

* `3.14159` or `1e3` are of type **`abstract-float`**.
* `42` or `0xFF` are of type **`abstract-int`**.

!!! note "No Explicit Spelling"
    You cannot write or spell `abstract-int` or `abstract-float` in your actual WGSL code (e.g., `let x: abstract-float = 1.0` is a compile error). They only exist implicitly as the type of unsuffixed literals and constant-expressions.

---

## 1. Compile-Time "Infinite" Precision

When the WGSL compiler processes your shader, it performs all constant arithmetic using abstract types on your CPU, using at least **64-bit precision** (double-precision floats and 64-bit signed integers). 

This allows you to compute complex mathematical constant-expressions without any accumulation of rounding errors or premature overflows:

```wgsl
const pi = 3.141592653589793; // Handled with full 64-bit float precision
const radius = 2.0;
const area = pi * radius * radius; // Executed on CPU with 64-bit precision
```

Only when these constant-expressions are assigned to a concrete variable (like `f32` or `i32`) does the compiler downcast the final pre-calculated result to the target GPU precision.

---

## 2. Implicit Type Conversions

In WGSL, concrete types (like `f32`, `i32`, `u32`) strictly **prohibit implicit conversions** (no implicit coercion). For example, `1.0 + 2` is a compile-time type mismatch error if `1.0` is concrete.

However, abstract-numerics are a deliberate exception to this rule. They support **implicit type conversion** to make writing mathematical expressions intuitive and clean:

| Abstract Type | Can Implicitly Convert To | Example |
| :--- | :--- | :--- |
| **`abstract-int`** | `i32`, `u32`, `f32`, `f16`, `abstract-float` | `let x: f32 = 42;` (maps `abstract-int` to `f32`) |
| **`abstract-float`** | `f32`, `f16` | `let y: f32 = 1.5;` (maps `abstract-float` to `f32`) |

### Mixing Abstract Types
When you combine an `abstract-int` and an `abstract-float` in an arithmetic operation, the compiler implicitly promotes the `abstract-int` to `abstract-float`, performing the calculation using floating-point math:

```wgsl
const mix = 1.5 + 2; // abstract-float (1.5) + abstract-int (2) -> abstract-float (3.5)
```

### Default Resolution Rules
If you initialize a variable without specifying an explicit type, the compiler must resolve the abstract expression to a concrete GPU register representation. In this case, standard **default conversion** rules apply:

* An `abstract-int` value defaults to **`i32`**.
* An `abstract-float` value defaults to **`f32`**.

```wgsl
let count = 42;    // No type specified -> count resolves to i32
let scale = 1.25;  // No type specified -> scale resolves to f32
```

---

## 3. Strict Compile-Time Constraints

Because abstract-numerics are resolved entirely during the compilation phase, they must adhere to strict mathematical validity constraints:

1. **Finite Expressions**: Any compile-time arithmetic operation on abstract-numerics must produce a finite, valid number.
2. **No Compilation Loop-holes**: Compilation will **immediately fail** if a constant abstract-numeric expression:
   - Overflows or underflows the 64-bit bounds.
   - Divides by zero.
   - Produces a positive infinity, negative infinity, or a NaN (Not-a-Number).

```wgsl
const fail_1 = 1.0 / 0.0;       // COMPILE ERROR: Division by zero
const fail_2 = 1e400;           // COMPILE ERROR: abstract-float overflow
```

This ensures that any constant expressions embedded in your final compiled shader binaries are guaranteed to be finite, predictable, and fully initialized before they ever reach the GPU.

---

## Interactive Visualizer

In the interactive simulation on the right, you can see these exact type resolutions executing live. 

Look at the **Results** panel to see how abstract types like `pi` and `two` are evaluated on the CPU at compile time, and how they implicitly downcast to concrete `f32`, `i32`, or `u32` types to feed your GPU buffers!