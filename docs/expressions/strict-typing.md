---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Strict Typing'
---
In many high-level CPU languages like JavaScript or Python, the runtime or compiler automatically converts variables from one type to another (known as **implicit coercion**). For example, you can add an integer to a floating-point number without thinking twice:

```javascript
// JavaScript
let x = 1.0 + 2; // Automatically becomes 3.0 (float)
```

In WGSL, this operation is a **compile-time error**. WGSL enforces **strict typing with absolutely zero implicit coercion**.

This section details why WGSL enforces strict typing and how to write clean, idiomatic code using explicit constructors.

---

## Why Enforce Strict Typing?

Strict typing on the GPU is not a limitation—it is a critical **performance and safety feature**.

1. **Zero Runtime Overhead**: GPUs are designed for massive parallel math, not for deciding how to cast registers at runtime. Enforcing explicit types ensures that the hardware can execute mathematical instructions directly without wasting clock cycles on hidden, silent type conversions.
2. **Cross-Vendor Consistency**: Shader code must compile and run on thousands of different GPU models from diverse vendors (Apple, AMD, Nvidia, Intel, Qualcomm, ARM). Silent implicit casts behave differently on different driver compilers, often leading to subtle, extremely hard-to-debug rendering bugs or compiler crashes. Strict typing guarantees that if your shader compiles, it will compile and run identically on every GPU.

---

## Common Coercion Pitfalls

Because WGSL does not perform implicit casts, mixing different types results in compilation errors. The most common scenarios include:

### 1. Mixing Float and Integer Literals
You cannot mix floating-point types (`f32`) and concrete integer types (`i32`, `u32`) in any binary operation.

```wgsl
// ❌ COMPILE ERROR: cannot add f32 and concrete integer
let sum = 1.5 + 2i; 

// ✔️ CORRECT: both sides must be of the same type
let sum_correct = 1.5 + f32(2i);
```

!!! note "Abstract Numerics are an Exception"
    You *can* mix unsuffixed literal numbers (called **abstract numerics**):
    
    ```wgsl
    let x = 1.5 + 2; // ✔️ VALID: evaluates to abstract-float 3.5, then resolves to f32
    ```
    
    For details on how unsuffixed literals resolve automatically, see the [Numeric Literals](evaluation-stage/constant/numeric-literals.md) reference.

### 2. Initializing Variables with Mismatched Literals
An explicit variable type must exactly match the initializer's type.

```wgsl
// ❌ COMPILE ERROR: cannot initialize f32 with an integer literal
let x: f32 = 5; 

// ✔️ CORRECT: use a floating-point literal or explicit constructor
let x_correct_1: f32 = 5.0;
let x_correct_2: f32 = f32(5);
```

### 3. Mixing Signed and Unsigned Integers
You cannot compare or perform arithmetic between signed (`i32`) and unsigned (`u32`) integers. This is crucial for index computations and loop bounds.

```wgsl
let signed_index: i32 = -1;
let array_length: u32 = 5u;

// ❌ COMPILE ERROR: cannot compare i32 and u32
if signed_index < array_length { ... }

// ✔️ CORRECT: explicitly cast the signed index (after checking bounds)
if signed_index >= 0 && u32(signed_index) < array_length { ... }
```

---

## Explicit Casting with Type Constructors

To convert a value from one type to another in WGSL, you use **type constructors**. Think of these as functions named after the target type that take the value to be converted as an argument.

```wgsl
let my_int: i32 = 42;

let converted_f32: f32 = f32(my_int);   // Convert i32 to f32
let converted_u32: u32 = u32(my_int);   // Convert i32 to u32
let converted_bool: bool = my_int != 0; // In WGSL, bool() constructor cannot cast integers; compare explicitly!
```

!!! important "Vector & Matrix Constructors"
    Type constructors also work on vectors and matrices for element-wise conversions.
    
    ```wgsl
    let int_vector = vec3i(1, 2, 3);
    
    // ✔️ Converts to vec3f(1.0, 2.0, 3.0) element-wise
    let float_vector = vec3f(int_vector); 
    ```
