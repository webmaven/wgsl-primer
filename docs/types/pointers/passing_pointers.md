---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Pointers As Function Parameters'
shader: ./passing_pointers.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "run_test()", "type": "vec2u"}]}'
---
Pointers can be passed into functions. This allows you to split your shader logic into modular, clean helper functions that can read or modify variables belonging to the parent caller.

A few standard builtin functions take pointer parameters, such as the [arrayLength()](https://w3.org/TR/wgsl/#arrayLength-builtin) and various [atomic builtins](https://w3.org/TR/wgsl/#atomic-builtin-functions).

---

## Under the Hood: Copy-In / Copy-Out Hardware Emulation

To understand the strict rules WGSL enforces on pointer parameters, it helps to understand how the GPU compiles them. 

Historically, physical GPU hardware architectures and shading languages (like HLSL and GLSL) did not support passing actual memory pointer addresses across user-declared functions. To support pointers, modern GPU compilers emulate them using **Copy-In / Copy-Out** semantics:

1. **Copy-In**: When a function with a pointer parameter `p` is called, the current value stored in the referenced variable is copied into an ultra-fast local core register inside the called function.
2. **Local Updates**: The function reads or writes to this local register.
3. **Copy-Out**: When the function returns, the final updated value in the local register is copied back into the caller's original variable.

---

## Strict Pointer Parameter Constraints

Because pointer parameters are emulated via registers, WGSL enforces strict constraints to ensure copy-in and copy-out are fast, deterministic, and free of memory data hazards.

!!! important "Base Language Constraints"
    Without the modern `unrestricted_pointer_parameters` language extension, pointer parameters to **user-declared** functions have two rigid restrictions:

    1. **Allowed Address Spaces**: Pointers can **only** point to variables located in the `function` or `private` address spaces. Pointers pointing to `workgroup`, `uniform`, or `storage` spaces are compile errors.
    2. **Whole Variables Only**: You can only pass the address of a whole variable. You **cannot** pass a pointer to a specific sub-member (e.g., passing a pointer to an element in an array or a struct field is banned).

These constraints guarantee that the copy-in/copy-out translation can be carried out safely by the compiler using simple register variables (HLSL `inout` parameters).

---

!!! info "Language Extension: `unrestricted_pointer_parameters`"
    If your WebGPU environment supports the [`unrestricted_pointer_parameters`](https://caniuse.com/mdn-api_wgsllanguagefeatures_extension_unrestricted_pointer_parameters) language extension, these constraints are lifted:
    
    * You can pass pointer parameters pointing into other address spaces, such as `storage` or `workgroup`.
    * You can pass pointers pointing to specific sub-parts of composite types (like elements inside an array or struct).

---

## Playground Code

In the accompanying shader code, we declare two private variables `first_count` and `second_count`. 

Our function `reset_counter` takes a private pointer `ptr<private, u32>` and writes `0` to it. We also define a function `reset_function_counter` which takes a local function pointer `ptr<function, u32>` and resets it.

Notice how uncommenting line 22 will throw a compiler error because we are trying to take the address of an immutable let-bound value (in WGSL, let-bound values represent pure values with no storage location, and therefore their addresses cannot be taken).