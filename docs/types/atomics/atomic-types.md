---
title: 'Atomic types'
shader: ./atomic-types.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "run_atomic_test()", "type": "i32"}]}'
---

Atomic operations only work on 32-bit integers.

An atomic type is specified as <code>atomic&lt;<span class="template template-atomic-t">T</span>&gt;</code>, where <span class="template template-atomic-t">T</span> is i32 or u32.

An atomic type can only appear in the store type for a variable in the
`workgroup` or `storage` address space.

Atomic types are not [constructible](https://w3.org/TR/WGSL#constructible),
and so they **cannot** _directly_ be used:

- in an expression,
- passed as a function argument,
- returned from a function,
- _assigned_ to a variable, or
- used as an initializer expression.

Remember, only [atomic builtin functions](https://www.w3.org/TR/WGSL/#atomic-builtin-functions)
operate on atomic types, and only when accessed from memory.
Pass a _pointer_ to the memory to the builtin function.
