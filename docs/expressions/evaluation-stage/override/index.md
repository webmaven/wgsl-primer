---
title: 'Override expressions'
shader: ./override.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "WORKGROUP_WIDTH", "type": "u32"},
    {"expr": "TOTAL_CACHE_SIZE", "type": "u32"}
]}'
---

# Override Expressions

Override-expressions are value expressions that are evaluated at
[pipeline creation](https://www.w3.org/TR/webgpu/#pipelines) time, or earlier.

> Formally, every constant-expression is an override-expression.
>
> — [W3C WGSL Specification](https://www.w3.org/TR/WGSL/#override-expr)

Override-expressions other than `const-expressions` are only validated or evaluated during pipeline creation, and only after any API-provided values are substituted for override-declarations. If an override-declaration has its value substituted via the WebGPU API, its initializer expression, if present, is not evaluated.

---

## Example: Pipeline-Overridable Constants & Sizing

The following example is loaded as an **active, running playground** in the panel on the right.

Try modifying the default value of `WORKGROUP_WIDTH` in the editor (for example, from `16u` to `8u` or `32u`) and click **Run** to see the evaluated override-expression results update dynamically in real-time!

### How it works:

1. **`DEFAULT_MULTIPLIER`**: This is a compile-time constant (`const`). Its value is fixed when the shader is translated.
2. **`WORKGROUP_WIDTH`**: This is an overridable constant (`override`). If the host CPU application provides a value for ID `101` when creating the compute pipeline, `WORKGROUP_WIDTH` takes that value; otherwise, it defaults to `16u`.
3. **`TOTAL_CACHE_SIZE`**: The expression `WORKGROUP_WIDTH * DEFAULT_MULTIPLIER` is an **override-expression**. It cannot be fully resolved at compile-time since it depends on the overridable `WORKGROUP_WIDTH`. Instead, it is evaluated during pipeline creation time, after any host-provided overrides are substituted.
