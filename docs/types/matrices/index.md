---
title: 'Matrices'
shader: ./index.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "my_matrix", "type": "mat3x3f"},
    {"expr": "get_column_1()", "type": "vec3f"},
    {"expr": "get_element_1_2()", "type": "f32"},
    {"expr": "m2x2", "type": "mat2x2f"}
]}'
---

# Matrices Overview

WGSL supports matrices between \(2 \times 2\) and \(4 \times 4\) `f32` elements.

Matrices are declared with the form <code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>&lt;f32&gt;</code>, where <span class="template template-mat-c">C</span> is the number of columns in the matrix, and <span class="template template-mat-r">R</span> is the number of rows in the matrix.

### Example Matrix Declarations

| Type          | Description                                        |
| :------------ | :------------------------------------------------- |
| `mat2x3<f32>` | A matrix with two columns and three rows of `f32`. |
| `mat4x2<f32>` | A matrix with four columns and two rows of `f32`.  |

<code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>&lt;<span class="template template-mat-t">T</span>&gt;</code> can be thought of as <span class="template template-mat-c">C</span> column vectors of <code>vec<span class="template template-vec-n">R</span>&lt;<span class="template template-vec-t">T</span>&gt;</code>.

WGSL also predeclares the alias <code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>f</code> as an alias for <code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>&lt;f32&gt;</code>.

---

## What is "Column-Major"?

In WGSL, matrices are **column-major**. This is a critical concept to understand when working with matrix elements and indexing:

* **Column Vector Basis**: A matrix is treated as a collection of **column vectors** side-by-side, rather than row vectors. For example, a `mat3x3f` consists of 3 columns, where each column is a `vec3f`.
* **Left-to-Right Construction**: When you initialize a matrix with values (or elements/vectors), you specify them column by column (left-to-right), rather than row by row.
* **First Index is Column**: If you index a matrix using `my_matrix[i]`, it extracts the \(i\)-th **column** vector (0-based), not a row.
* **Double Indexing is `[column][row]`**: To access a specific scalar element, use `my_matrix[col][row]`. For instance, `my_matrix[1][2]` accesses the element at Column 1, Row 2.
* **Memory Layout**: In memory, the elements of the first column are stored sequentially, followed by the elements of the second column, and so on.

---

## Next Steps

Matrix operations and usage:

- **[Matrix Constructors](constructors.md)**: Initialization forms including zero-value, column-wise, and scalar-wise constructors.
- **[Matrix Multiplication](multiplication.md)**: Linear algebra operations, including scalar, vector, and matrix multiplications.
