---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'No Aliasing In Any Nested Call'
shader: ./no_aliasing_nested_calls.wgsl
---
In complex shaders, functions often delegate work to other helper functions, passing their pointer parameters deeper down the call stack. To guarantee zero-aliasing optimization safety across the entire program, WGSL's compiler does not just look at the immediate function you call—it recursively evaluates **every nested function call** triggered by that invocation.

This transitive, multi-layered tracking is known as **Deep Call-Stack Alias Analysis**.

---

## How Transitive Aliasing Validation Works

When a shader is compiled, the compiler constructs a Call Graph of the program and performs a bottom-up analysis of memory access views:

1. **Leaf Analysis**: The compiler starts at the bottom of the call stack (leaf functions that call no other user functions). It identifies all reads and writes performed via pointer parameters and references.
2. **Access Propagation**: When a parent function calls a helper, the compiler maps the helper's pointer accesses back to the arguments passed by the parent.
3. **Root Trace Back**: Finally, at the entry-point call site, the compiler traces all argument paths back to their **original root identifiers** (the base variables declared via `var` at local or module scope). 
4. **Overlap Verification**: If two distinct argument paths map back to the *same* root identifier, and any downstream nested function in the call tree contains a potential write along one of those paths, the entire compilation fails.

---

## Visualizing Call Stack Access Conflicts

The diagram below illustrates how a conflict in a deeply nested helper propagates back up to fail the caller.

<div style="background: #0f172a; border: 1.5px solid #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
  <h3 style="color: #cbd5e1; font-weight: 700; font-size: 15px; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></span>
    Nested Call Stack Aliasing Error
  </h3>

  <!-- Stack Frame 3 (Top/Caller) -->
  <div style="background: rgba(30, 41, 59, 0.5); border: 1px dashed #475569; border-radius: 8px; padding: 14px; margin-bottom: 12px; position: relative;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="color: #cbd5e1; font-family: monospace; font-size: 12px; font-weight: 700;">1. f3() (Caller Site)</span>
      <span style="color: #94a3b8; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">ROOT DECLARATION</span>
    </div>
    <p style="color: #94a3b8; font-size: 11.5px; line-height: 1.5; margin: 0; margin-bottom: 8px;">
      Declares a local variable `var a: i32` and calls `f2(&a, &a)`. Both pointer arguments share the same physical root block in the thread's stack.
    </p>
    <div style="font-family: monospace; font-size: 11px; color: #f87171; background: rgba(239, 68, 68, 0.08); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.2); display: inline-block;">
      f2(p1: &amp;a, p2: &amp;a) &rarr; <span style="font-weight: 700;">Conflict Triggered</span>
    </div>
  </div>

  <!-- Arrow Down -->
  <div style="text-align: center; height: 20px; margin: -4px 0; color: #475569; font-size: 16px;">&darr;</div>

  <!-- Stack Frame 2 (Intermediate) -->
  <div style="background: rgba(30, 41, 59, 0.5); border: 1px dashed #475569; border-radius: 8px; padding: 14px; margin-bottom: 12px; position: relative;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="color: #cbd5e1; font-family: monospace; font-size: 12px; font-weight: 700;">2. f2(p1, p2) (Intermediate)</span>
      <span style="color: #94a3b8; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">DELEGATION FRAME</span>
    </div>
    <p style="color: #94a3b8; font-size: 11.5px; line-height: 1.5; margin: 0; margin-bottom: 8px;">
      Receives two pointer parameters and forwards them directly to the leaf function: `f1(p1, p2)`. It performs no accesses itself, but passes the aliased views.
    </p>
  </div>

  <!-- Arrow Down -->
  <div style="text-align: center; height: 20px; margin: -4px 0; color: #475569; font-size: 16px;">&darr;</div>

  <!-- Stack Frame 1 (Bottom/Leaf/Conflict Location) -->
  <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 14px; box-shadow: 0 0 15px rgba(239, 68, 68, 0.03);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="color: #ef4444; font-family: monospace; font-size: 12px; font-weight: 700;">3. f1(p1, p2) (Leaf Conflict)</span>
      <span style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px;">HAZARD LOCATED</span>
    </div>
    <p style="color: #cbd5e1; font-size: 11.5px; line-height: 1.5; margin: 0; margin-bottom: 8px;">
      Executes code: <code style="color: #ef4444; background: none; padding: 0;">*p1 = *p2;</code>
    </p>
    <p style="color: #94a3b8; font-size: 11.5px; line-height: 1.5; margin: 0;">
      The compiler detects a read from `p2` and a **write** to `p1`. Since both trace back to the same root variable `a`, an illegal write-alias conflict is registered.
    </p>
  </div>
</div>

---

## Under the Hood: Resolving to Backend Shaders

Why is this level of scrutiny necessary? When the GPU driver compiles your WGSL shader into native backend instructions (such as HLSL for Direct3D, MSL for Metal, or GLSL/SPIR-V for Vulkan), it often expands WGSL pointer parameters into the backend's native parameter representation.

In Vulkan (SPIR-V) or Metal (MSL), pointers are compiled as physical memory spaces or restricted register references. If they aliased with writes, hardware execution would cause memory ordering undefined behaviors, or trigger severe pipeline stalls while waiting for cache flushes. 

In DX12 (HLSL), user-declared functions with `inout` pointer parameters are often compiled as a **Copy-In / Copy-Out** register operations. If you alias the same variable across two parameters, the value written back to the root variable when the function returns would be non-deterministic, as each parameter copies its local register back to the variable in an arbitrary sequence. 

WGSL prevents all of these hardware-specific compilation and concurrency disasters by stopping compilation at the high-level stage!

!!! note "Valid Disjoint Accesses"
    If you declare two separate variables `var a: i32;` and `var b: i32;`, you can freely call `f2(&a, &b)`. Because `a` and `b` represent completely independent allocations with disjoint roots, there is no overlap hazard. The compiler can promote both to registers, run instructions in parallel, and execute the helper functions at maximum hardware speed.