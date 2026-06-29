---
title: "Matrix Multiplication"
shader: ./multiplication.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "m2x3",             "type": "mat2x3f"},
    {"expr": "mul_s_by_m2x3",    "type": "mat2x3f"},
    {"expr": "mul_m2x3_by_s",    "type": "mat2x3f"},
    {"expr": "mul_v3_by_m2x3",   "type": "vec2f"},
    {"expr": "mul_m2x3_by_v2",   "type": "vec3f"},
    {"expr": "mul_m2x3_by_m4x2", "type": "mat4x3f"}
]}'
---

# Matrix Multiplication

Matrices are incredibly powerful for geometric transformations and linear algebra. WGSL supports multiplication of matrices with **scalars**, **vectors**, and **other matrices** using the standard multiplication operator (`*`).

Depending on the types of the operands, matrix multiplication behaves in different ways:

| Operation | Syntax | Description | Result Type |
| :--- | :--- | :--- | :--- |
| **Scalar Scaling** | `s * M` or `M * s` | Multiplies every element of the matrix by the scalar `s`. | Same matrix type |
| **Vector-Matrix** | `v * M` | Multiplies row-vector `v` on the left (behaves as row-vector multiplication). | Vector |
| **Matrix-Vector** | `M * v` | Multiplies column-vector `v` on the right (behaves as column-vector multiplication). | Vector |
| **Matrix-Matrix** | `A * B` | Standard mathematical matrix multiplication. | Matrix |

---

## Scalar-Matrix Multiplication

Multiplying a matrix by a scalar scales every individual element of the matrix independently. The order of operands does not matter (`s * M` is identical to `M * s`).

If we have a scalar \(10\) and a \(2 \times 3\) matrix:

\[
10 \times \begin{pmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{pmatrix} = \begin{pmatrix} 10 & 40 \\ 20 & 50 \\ 30 & 60 \end{pmatrix}
\]

### Example
```wgsl
const m2x3 = mat2x3f(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);
const scaled_left  = 10.0 * m2x3; // mat2x3f
const scaled_right = m2x3 * 10.0; // mat2x3f
```

---

## Vector-Matrix Multiplication

When a vector `v` is on the **left** of a matrix `M` (`v * M`), WGSL treats the vector as a **row vector** (dimensions \(1 \times R\)) and the matrix as having \(R\) rows and \(C\) columns. The multiplication performs a dot product between the vector and each column of the matrix, returning a vector of size \(C\).

For a vector \(v = \begin{pmatrix} 9 & 8 & 7 \end{pmatrix}\) and a \(2 \times 3\) matrix (which has 2 columns of 3 elements—meaning mathematically it has 3 rows and 2 columns in standard row-by-column mathematical notation):

\[
\begin{pmatrix} 9 & 8 & 7 \end{pmatrix} \times \begin{pmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{pmatrix} = \begin{pmatrix} 9 \times 1 + 8 \times 2 + 7 \times 3 & 9 \times 4 + 8 \times 5 + 7 \times 6 \end{pmatrix} = \begin{pmatrix} 46 & 118 \end{pmatrix}
\]

### Example
```wgsl
// m2x3 has 2 columns of 3 elements
const m2x3 = mat2x3f(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);
const result: vec2f = vec3f(9.0, 8.0, 7.0) * m2x3; // vec2f(46.0, 118.0)
```

---

## Matrix-Vector Multiplication

When a vector `v` is on the **right** of a matrix `M` (`M * v`), WGSL treats the vector as a **column vector** (dimensions \(C \times 1\)) and the matrix as having \(R\) rows and \(C\) columns. The multiplication returns a vector of size \(R\).

For a \(2 \times 3\) matrix and a column-vector \(v = \begin{pmatrix} 9 \\ 8 \end{pmatrix}\):

\[
\begin{pmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{pmatrix} \times \begin{pmatrix} 9 \\ 8 \end{pmatrix} = \begin{pmatrix} 1 \times 9 + 4 \times 8 \\ 2 \times 9 + 5 \times 8 \\ 3 \times 9 + 6 \times 8 \end{pmatrix} = \begin{pmatrix} 41 \\ 58 \\ 75 \end{pmatrix}
\]

### Example
```wgsl
const m2x3 = mat2x3f(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);
const result: vec3f = m2x3 * vec2f(9.0, 8.0); // vec3f(41.0, 58.0, 75.0)
```

---

## Matrix-Matrix Multiplication

Multiplying two matrices `A * B` performs standard mathematical matrix multiplication.

To multiply matrix `A` by matrix `B`:

- The number of **columns of A** must equal the number of **rows of B**.
- If `A` is a `matCxR` (\(C\) columns, \(R\) rows) and `B` is a `matKxC` (\(K\) columns, \(C\) rows), the result is a `matKxR` (\(K\) columns, \(R\) rows).

For example, multiplying a `mat2x3` (2 columns, 3 rows) by a `mat4x2` (4 columns, 2 rows) is mathematically valid and yields a `mat4x3` (4 columns, 3 rows).

### Example
```wgsl
const m2x3 = mat2x3f(1.0, 2.0, 3.0, 4.0, 5.0, 6.0); // mat2x3f
const m4x2 = mat4x2f(7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0); // mat4x2f

// Result is mat4x3f
const result: mat4x3f = m2x3 * m4x2;
```
