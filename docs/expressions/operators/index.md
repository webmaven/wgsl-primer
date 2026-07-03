---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Operators'
---
WGSL supports a rich set of operators for performing mathematical calculations, manipulating bits, comparing values, and managing logical control flow. While these operators will feel familiar to developers coming from C++, JavaScript, or Rust, WGSL introduces key constraints and overloaded behaviors that are critical for GPU programming.

---

## Complete Operator Reference

The following table summarizes all operators supported in WGSL, grouped by category and ordered by precedence from highest to lowest.

| Category | Operators | Description | Examples |
| :--- | :--- | :--- | :--- |
| **Unary** | `+`, `-`, `!`, `~` | Positive, Negation, Logical NOT, Bitwise NOT | `-x`, `!flag`, `~mask` |
| **Multiplicative** | `*`, `/`, `%` | Multiplication, Division, Remainder (Modulo) | `a * b`, `x / y`, `idx % 4` |
| **Additive** | `+`, `-` | Addition, Subtraction | `x + y`, `count - 1` |
| **Shift** | `<<`, `>>` | Bitwise Left Shift, Bitwise Right Shift | `val << 8u`, `mask >> 2u` |
| **Relational** | `<`, `<=`, `>`, `>=`, `==`, `!=` | Comparison Operators (evaluate to boolean) | `a < b`, `score >= 100` |
| **Bitwise** | `&`, `\|`, `^` | Bitwise AND, Bitwise OR, Bitwise XOR | `mask & 0xFFu`, `flags \| 1u` |
| **Logical** | `&&`, `\|\|` | Short-circuiting AND, Short-circuiting OR | `valid && ready`, `empty \|\| full` |

---

## Relational Parenthesization Warning

WGSL defines operator precedence in a way that prevents common precedence bugs found in other C-like languages. Specifically, **relational operators do not have a defined precedence relative to logical operators**. 

This means you **cannot** combine relational operations and logical operations without explicit parenthesization.

!!! warning "Relational Precedence Constraints"
    Attempting to write comparisons without parentheses inside a logical expression will result in a compile-time error.
    
    ```wgsl
    // ❌ COMPILE ERROR: relational and logical operators cannot be mixed without parentheses
    if x < 10 && y > 20 { ... }
    
    // ✔️ CORRECT: always parenthesize each comparison explicitly
    if (x < 10) && (y > 20) { ... }
    ```
    
    This constraint is a deliberate design choice in WGSL to eliminate ambiguity and prevent bugs where programmers misremember operator precedence.

---

## Assignment and Compound Assignment

WGSL provides standard assignment (`=`) and compound assignment operators. 

Compound assignments modify a variable in-place by applying an operation.

| Operator | Description | Equivalent To |
| :--- | :--- | :--- |
| `+=` | Add and assign | `x = x + y` |
| `-=` | Subtract and assign | `x = x - y` |
| `*=` | Multiply and assign | `x = x * y` |
| `/=` | Divide and assign | `x = x / y` |
| `%=` | Remainder and assign | `x = x % y` |
| `&=` | Bitwise AND and assign | `x = x & y` |
| `|=` | Bitwise OR and assign | `x = x \| y` |
| `^=` | Bitwise XOR and assign | `x = x ^ y` |
| `<<=` | Bitwise Left Shift and assign | `x = x << y` |
| `>>=` | Bitwise Right Shift and assign | `x = x >> y` |

!!! note "Variables Only"
    Compound assignment operators can only be used on mutable variables declared with `var`. They cannot be applied to immutable values declared with `let` or `const`.

---

## Element-Wise vs. Linear Algebra Overloads

In graphics and simulation coding, operations on vectors and matrices are extremely frequent. WGSL overloads standard mathematical operators (`+`, `-`, `*`, `/`) to support powerful vector and matrix operations natively.

However, you must distinguish between **element-wise** operations and **linear-algebraic** operations.

### 1. Scalar-to-Vector Operations
Applying an operator between a scalar and a vector distributes the operation to every component of the vector.
```wgsl
let v = vec3f(1.0, 2.0, 3.0);
let scaled = v * 2.0; // Same as vec3f(1.0 * 2.0, 2.0 * 2.0, 3.0 * 2.0)
```

### 2. Element-Wise Vector-to-Vector Operations
Adding, subtracting, multiplying, or dividing two vectors of the exact same size applies the operation component-by-component.
```wgsl
let v1 = vec3f(1.0, 2.0, 3.0);
let v2 = vec3f(4.0, 5.0, 6.0);

let add = v1 + v2; // vec3f(5.0, 7.0, 9.0)
let mul = v1 * v2; // vec3f(1.0 * 4.0, 2.0 * 5.0, 3.0 * 6.0) -> vec3f(4.0, 10.0, 18.0)
```

!!! note "Multiplication is Element-Wise by Default"
    Multiplying two vectors using `*` is **element-wise**, not a dot product or cross product. For those geometric operations, you must use built-in functions:
    
    - Dot Product: `dot(v1, v2)` (returns a scalar)
    - Cross Product: `cross(v1, v2)` (defined for 3D vectors, returns `vec3`)

### 3. Linear-Algebraic Matrix Operations
When multiplying a matrix by a vector, or a matrix by another matrix, WGSL performs **standard linear algebra matrix multiplication**, not element-wise multiplication.

```wgsl
let m = mat2x2f(1.0, 2.0, 3.0, 4.0);
let v = vec2f(5.0, 6.0);

// Linear algebra matrix-vector multiplication
let result = m * v; 
```

For detailed specifications of vectors and matrices, see the [Vectors Overview](../../types/vectors/index.md) and [Matrices Overview](../../types/matrices/index.md) sections.
