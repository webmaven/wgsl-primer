---
title: "Matrix Constructors"
shader: ./constructors.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "zero_init",  "type": "mat3x4f"},
    {"expr": "column_wise",  "type": "mat3x2f"},
    {"expr": "scalar_wise",  "type": "mat2x3f"}
]}'
---

# Matrix Constructors

In WGSL, matrices can be constructed or initialized using three primary constructor styles: zero-value initialization, column-vector composition, or element-by-element scalar initialization in column-major order.

| Style | Syntax Pattern | Description |
| :--- | :--- | :--- |
| **[Zero-Value](#zero-value-constructors)** | <code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>f()</code><br><code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>&lt;<span class="template template-mat-t">T</span>&gt;()</code> | Initializes all elements of the matrix to their default zero value (`0.0`). |
| **[Column-Wise](#column-wise-constructors)** | <code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>&lt;<span class="template template-mat-t">T</span>&gt;(c0, c1, ...)</code> | Constructs the matrix by supplying exactly <span class="template template-mat-c">C</span> column vectors. |
| **[Scalar-Wise](#scalar-wise-constructors)** | <code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>&lt;<span class="template template-mat-t">T</span>&gt;(s0, s1, ...)</code> | Constructs the matrix from a flat sequence of scalars in column-major order. |

---

## Zero-Value Constructors

Constructs a matrix with all elements initialized to `0.0`. You can use either the generic syntax or the convenient type aliases (like `mat3x4f`).

```wgsl
let m_zero  = mat3x4f();       // Equivalent to mat3x4<f32>() with all 0.0s
let m_f32   = mat2x2<f32>();   // 2x2 matrix filled with 0.0
```

---

## Column-Wise Constructors

Constructs a matrix by supplying exactly <span class="template template-mat-c">C</span> column vectors, where each column vector has exactly <span class="template template-mat-r">R</span> components. This is the most common way to compose matrices.

Because WGSL is column-major, the first vector argument becomes the first (leftmost) column of the matrix, the second argument becomes the second column, and so on.

```wgsl
let col_0 = vec2f(1.0, 2.0);
let col_1 = vec2f(3.0, 4.0);
let col_2 = vec2f(5.0, 6.0);

// Composes a 3x2 matrix from three column vectors
let m_cols = mat3x2f(col_0, col_1, col_2);
```

---

## Scalar-Wise Constructors

Constructs a matrix from a flat list of individual scalar values. To specify the scalar values, they must be supplied in **column-major** order: the elements of the first column are specified first (top-to-bottom), followed by the elements of the second column, and so forth.

For a matrix with <span class="template template-mat-c">C</span> columns and <span class="template template-mat-r">R</span> rows, you must supply exactly \(C \times R\) scalar arguments.

For example, `mat2x3f(a, b, c, d, e, f)` constructs a 2-column, 3-row matrix of `f32`s, where the first column is populated by `(a, b, c)` and the second column is populated by `(d, e, f)`:

```wgsl
// Constructing a 2x3 matrix (2 columns, 3 rows) using 6 scalars
let m_scalars = mat2x3f(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);
```

The resulting matrix layout is:

<div class='ascii'>

```ascii
╭           ╮
│ 1.0   4.0 │
│ 2.0   5.0 │
│ 3.0   6.0 │
╰           ╯
```

</div>

---

## Next Steps

- **[Matrix Multiplication](multiplication.md)**: Linear algebra operations, including scalar, vector, and matrix multiplications.
