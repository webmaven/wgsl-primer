---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'About This Project'
---

**WGSL: A Primer** (originally known as the *Tour of WGSL*) is an interactive, browser-based guide designed to introduce systems developers, graphics engineers, and GPU programming newcomers to the WebGPU Shading Language (WGSL). 

As the official shading language for WebGPU—the modern standard for high-performance graphics and compute on the web—WGSL offers a secure, portable, and zero-overhead abstraction over native GPU hardware interfaces (such as Vulkan, Metal, and Direct3D 12). However, writing shader code introduces unique architectural paradigms, memory model constraints, and compile-time rules that differ significantly from CPU programming.

This primer serves as a modern learning environment and rigorous technical reference, explaining both the foundational syntax and the complex underpinnings of the language.

---

## Purpose & Interactive Philosophy

The core purpose of this project is to bridge the gap between high-level conceptual graphics/compute programming and the physical, metal-level execution models of modern GPU hardware. 

To achieve this, the primer shifts away from static text, utilizing live, interactive WebGPU visualizers that let readers inspect memory layouts, trace thread execution barrier timings, understand strict typing, and compile shader modifications in real-time.

---

## What the Primer is Not

While this primer serves as a technical reference and conceptual guide for the shading language, it is helpful to clarify what is outside its scope:

*   **Not a WebGPU Host API Tutorial**: This guide focuses on writing shader programs, not host-side orchestration. It does not cover creating adapters, devices, bind groups, command encoders, or canvas configurations in JavaScript, Rust, or C++. To learn host-side WebGPU API programming, we highly recommend reading [WebGPU Fundamentals](https://webgpufundamentals.org/).
*   **Not a General 3D Graphics Tutorial**: While we don't assume deep familiarity with computer graphics foundations (such as vertex/fragment pipelines, lighting models, and transformation matrices), if you are new to 3D graphics, you may want to pair this primer with resources like [LearnOpenGL](https://learnopengl.com/) or similar resources.
*   **Not an Exhaustive API Reference**: This is an educational guide designed around core concepts and mental models, not a complete documentation manual. For exhaustive signature definitions and detailed parameter lists, please consult the official [W3C WGSL Specification](https://www.w3c.org/TR/WGSL/).

---

## About the Author

**Michael R. Bernstein** is a systems and graphics software engineer, developer, and open-source contributor. He is the lead co-author of the [Zope Bible](https://scholar.google.com/scholar?cluster=16126692648960763851) (2002), focusing on Python server-side application architecture.

After a long hiatus from the mainstream tech industry, this project marks a return to open-source systems design. His current work centers on leveraging browser-native WebGPU compute pipelines to cleanly sidestep WebAssembly performance penalties that affect the Pyodide/MicroPython frontend ecosystems.

---

## More About the Primer

To learn more about the project's technical architecture, historical updates, and legal authorship, please see:

* **[Colophon](colophon.md)**: A detailed breakdown of the current technology stack, build compilation flow, typography, and responsive split-pane layout design.
* **[Changelog](changelog.md)**: A chronological list of feature updates, expanded technical sections, and toolchain enhancements added in the modern fork.
* **[Copyright & License](copyright.md)**: Authoritative attribution rosters, project lineage, and detailed legal licenses (CC-BY 4.0, Apache 2.0, and BSD 3-Clause).
