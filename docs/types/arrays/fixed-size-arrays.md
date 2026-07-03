---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: "Fixed-Size Arrays"
shader: ./fixed-size-arrays.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "ith_fib",  "type": "i32"},
    {"expr": "ith_zero", "type": "u32"}
]}'
---

A fixed-size array type is declared as <code>array&lt;<span class="template template-array-t">T</span>, <span class="template template-array-n">N</span>&gt;</code>, where
<span class="template template-array-t">T</span> is the element type (with some restrictions), and
<span class="template template-array-n">N</span> is the element count.

In most cases <span class="template template-array-n">N</span> is a
[const-expression](../../expressions/evaluation-stage/constant/index.md).

!!! note "Exception for Workgroup Variables"
    When the array is used as the type of a workgroup variable, <span class="template template-array-n">N</span> can be an [override-expression](../../expressions/evaluation-stage/override/index.md). This means the array size can be adjusted at [pipeline-creation time](../../expressions/evaluation-stage/index.md), though it is still "fixed" before the shader executes.

### Common Fixed-Size Array Types

| Declaration              | Description                                                                                       |
| :----------------------- | :------------------------------------------------------------------------------------------------ |
| `array<f32, 5>`          | A 5-element array of `f32`.                                                                       |
| `array<array<f32, 4>, 8>`| An array of 8 arrays of 4 `f32` (a nested 2D array).                                              |
| <code>array&lt;<span class="template template-array-t">S</span>, <span class="template template-array-n">c</span>&gt;</code>             | An array of <span class="template template-array-n">c</span> elements of type <span class="template template-array-t">S</span>, where <span class="template template-array-n">c</span> must be a constant expression.                    |
| <code>array&lt;i32, 4 * <span class="template template-array-n">blockSize</span>&gt;</code> | An array of `i32` with <code>4 * <span class="template template-array-n">blockSize</span></code> elements, where <span class="template template-array-n">blockSize</span> must be a constant expression. |

With the one exception above, fixed-size array values can be used like other plain values, for example:

- in an expression,
- passed as a function argument,
- returned from a function,
- assigned to a variable, or
- used as the initializer for a variable or declared value.

---

## Memory Layout and Strides

The byte size and alignment of a fixed-size array depend directly on the properties of its element type \(T\). The memory spacing is controlled by the **element stride**: the stride represents the total number of bytes occupied by a single element, including any necessary trailing padding to satisfy alignment requirements.

### Custom Strides with `@stride`
In WGSL, you can optionally override the default element stride using the `@stride` attribute. This is particularly useful when interfacing with uniform or storage buffers that require specific alignment layouts (such as 16-byte alignment limits):

```wgsl
// Declares an array of four 32-bit floats, where each float 
// is padded to occupy exactly 16 bytes in memory.
var<uniform> padded_floats: @stride(16) array<f32, 4>;
```

---

## Nested (Multidimensional) Arrays

WGSL supports multi-dimensional collections by nesting arrays. For example, a 2D grid representing a 3D transformation or a spatial buffer can be defined as an array of arrays:

```wgsl
// A 2D grid containing 3 rows and 4 columns of floats
var matrix_grid: array<array<f32, 4>, 3>;

// To access the element at row r, column c:
let value = matrix_grid[r][c];
```

---

## Out-of-Bounds (OOB) Safety

To prevent security vulnerabilities and undefined hardware behaviors, WGSL enforces a strict out-of-bounds safety model. The behavior depends on whether the index can be evaluated at compile-time:

### 1. Compile-Time Evaluation (Static OOB)
If the index is a constant expression and is out of bounds (for example, accessing `first_fibs[10]` on a 7-element array), the compiler will reject the shader and throw a **compilation error**.

### 2. Runtime Evaluation (Dynamic OOB)
If the index is dynamic and cannot be determined at compile-time, the index is automatically **clamped** to the safe range `[0, N - 1]`, where \(N\) is the array size:

- A write to an out-of-bounds index will write to the last valid index.
- A read from an out-of-bounds index will read from the last valid index.

This bounds-clamping safety guarantees that shaders can never read or write to arbitrary GPU memory outside the array's allocation.
