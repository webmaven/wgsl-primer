---
title: 'Function Calls'
shader: ./calls.wgsl
---

Functions can be declared in any order.

Function calls cannot be recursive, either directly:

<details class='example'>
<summary>Example</summary>

```rust
fn a() {
  a(); // error
}
```

</details>

or indirectly:

<details class='example'>
<summary>Example</summary>

```rust
fn a() {
  b(); // error
}
fn b() {
  a(); // error
}
```

</details>
