---
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
    When the array is used as the type of a workgroup variable, <span class="template template-array-n">N</span> can be an [override-expression](../../expressions/evaluation-stage/override/index.md). This means the array size can be adjusted at [pipeline-creation time](../../expressions/evaluation-stage/overview/index.md), though it is still "fixed" before the shader executes.

### Common Fixed-Size Array Types

| Declaration              | Description                                                                                       |
| :----------------------- | :------------------------------------------------------------------------------------------------ |
| `array<f32,5>`           | A 5-element array of `f32`.                                                                       |
| `array<array<f32,4>,8>`  | An array of 8 arrays of 4 `f32` (a nested 2D array).                                              |
| <code>array&lt;<span class="template template-array-t">S</span>, <span class="template template-array-n">c</span>&gt;</code>             | An array of <span class="template template-array-n">c</span> elements of type <span class="template template-array-t">S</span>, where <span class="template template-array-n">c</span> must be a constant expression.                    |
| <code>array&lt;i32, 4 * <span class="template template-array-n">blockSize</span>&gt;</code> | An array of `i32` with <code>4 * <span class="template template-array-n">blockSize</span></code> elements, where <span class="template template-array-n">blockSize</span> must be a constant expression. |

With the one exception above, fixed-size array values can be used like other plain values, for example:

- in an expression,
- passed as a function argument,
- returned from a function,
- assigned to a variable, or
- used as the initializer for a variable or declared value.
