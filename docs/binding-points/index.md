---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Binding Points Overview'
---
Binding points define how shaders connect to GPU-side resources configured by the WebGPU API on the CPU:

- **[Attributes](attributes.md)**: Attach metadata to entry points, variables, structure members, and functions using attributes like `@group`, `@binding`, and `@location`.
- **[Uniform Buffers](uniform-buffers.md)**: Pass small, read-only chunks of configuration data to shaders using uniform buffers.
- **[Storage Buffers](storage-buffers.md)**: Pass larger, dynamic, and potentially writable arrays of data via storage buffers.
- **[Textures](textures.md)**: Access sampleable, storage, and depth/multisample textures inside shaders.