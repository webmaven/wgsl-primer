---
title: 'Specifying a pointer type'
shader: ./specifying.wgsl
---

A pointer refers to the memory associated with all or part of a
[variable](../../variables/index.md).

In more detail, a pointer refers to:

- a set of memory locations,
- an interpretation of those memory locations as a WGSL type, consistent with
  the variable's type,
- an access mode matching the variable's access mode, and
- a [memory model reference](https://w3.org/TR/WGSL#memory-model-reference), matching that of the variable.

A pointer type is written as
<code>ptr&lt;<span class="template template-ptr-as">AS</span>, <span class="template template-ptr-t">T</span>, <span class="template template-ptr-am">AM</span>&gt;</code> or <code>ptr&lt;<span class="template template-ptr-as">AS</span>, <span class="template template-ptr-t">T</span>&gt;</code>, where

- <span class="template template-ptr-as">AS</span> is an address space,
- <span class="template template-ptr-t">T</span> is a type, known as the store type, and
- <span class="template template-ptr-am">AM</span> is an access mode. Only write this when <span class="template template-ptr-as">AS</span> is `storage`.

Pointers into `storage` address space can use `read` or `read_write` access modes,
with the default being `read`.

Don't write the access mode in other cases.
They always use the [default for the address space](https://w3.org/TR/WGSL#address-space).
