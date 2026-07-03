---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'No Aliasing Allowed With Pointer Parameters'
shader: ./no_aliasing.wgsl
---
To achieve maximum throughput, GPU compilers must aggressively optimize memory accesses. They load values into physical registers, reorder read and write instructions to hide latency, and combine consecutive operations. However, if two different variables in a function can refer to the exact same physical memory cell—a condition known as **aliasing**—these optimizations become incredibly hazardous.

To guarantee safety and allow peak performance without complex runtime checks, WGSL enforces a strict **Static Alias Analysis** rule at compile time. 

---

## Why WGSL Bans Pointer Aliasing

In traditional systems languages like C, if two pointers `p1` and `p2` point to the same variable, writing to `*p1` silently changes the value read from `*p2`. Because the compiler cannot always prove whether two pointers alias, it must defensively reload values from slow RAM or cache instead of keeping them in ultra-fast registers.

On massive GPU architectures, this defensive reloading would severely bottleneck execution. WGSL's no-aliasing rule guarantees to the compiler that **no two active access paths within a function call stack can point to overlapping memory if any of them is used to write.** This enables:

1. **Aggressive Register Promotion**: The compiler can confidently keep variables in GPU core registers for the entire duration of a function call.
2. **Instruction Pipelining & Reordering**: The hardware can execute reads and writes in parallel or out of order to saturate the memory bus.
3. **Deterministic Execution**: Prevents silent, vendor-dependent memory corruption or race conditions within a single thread.

---

## Visualizing Aliasing Access Paths

Below is a comparison of how WGSL's static analysis evaluates pointer access paths.

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 24px 0;">
  <!-- Overlapping Paths -->
  <div style="background: rgba(239, 68, 68, 0.02); border: 1.5px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.05); display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="color: #ef4444; font-size: 14px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">OVERLAPPING ACCESS PATHS</h4>
        <span style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;">COMPILER ERROR</span>
      </div>
      <p style="color: #94a3b8; font-size: 12.5px; line-height: 1.5; margin: 0; margin-bottom: 20px;">
        Two pointers (or a pointer and a module-scope variable) both target the same root memory location, and at least one path is used for writing.
      </p>
    </div>
    
    <!-- Visual Representation -->
    <div style="background: #0f172a; border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 8px; padding: 16px; font-family: monospace; display: flex; flex-direction: column; gap: 12px; align-items: center;">
      <!-- Inputs -->
      <div style="display: flex; justify-content: space-around; width: 100%; font-size: 11px;">
        <div style="color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 8px; border-radius: 4px; background: rgba(56, 189, 248, 0.05);">p1 (Write)</div>
        <div style="color: #cbd5e1; border: 1px solid rgba(203, 213, 225, 0.3); padding: 4px 8px; border-radius: 4px; background: rgba(203, 213, 225, 0.05);">p2 (Read)</div>
      </div>
      
      <!-- Connectors -->
      <div style="height: 32px; display: flex; justify-content: center; align-items: center; position: relative; width: 100%;">
        <svg style="width: 100%; height: 100%;" viewBox="0 0 200 30">
          <line x1="50" y1="2" x2="100" y2="28" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2 2" />
          <line x1="150" y1="2" x2="100" y2="28" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2 2" />
          <!-- Conflict Marker -->
          <circle cx="100" cy="15" r="8" fill="#ef4444" />
          <text x="100" y="19" fill="#ffffff" font-size="10px" font-weight="900" text-anchor="middle">!</text>
        </svg>
      </div>
      
      <!-- Shared Target -->
      <div style="color: #ef4444; border: 1.5px solid #ef4444; padding: 6px 12px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); font-weight: 700; font-size: 12px; width: 80%; text-anchor: middle; text-align: center; box-shadow: 0 0 10px rgba(239, 68, 68, 0.15);">
        var a: i32
      </div>
    </div>
  </div>

  <!-- Disjoint Paths -->
  <div style="background: rgba(16, 185, 129, 0.02); border: 1.5px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.05); display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="color: #10b981; font-size: 14px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">DISJOINT ACCESS PATHS</h4>
        <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;">VALID COMPILE</span>
      </div>
      <p style="color: #94a3b8; font-size: 12.5px; line-height: 1.5; margin: 0; margin-bottom: 20px;">
        Pointers target completely separate, independent memory allocations. No overlap is possible, ensuring hazard-free optimization.
      </p>
    </div>
    
    <!-- Visual Representation -->
    <div style="background: #0f172a; border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 16px; font-family: monospace; display: flex; flex-direction: column; gap: 12px; align-items: center;">
      <!-- Inputs -->
      <div style="display: flex; justify-content: space-around; width: 100%; font-size: 11px;">
        <div style="color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 8px; border-radius: 4px; background: rgba(56, 189, 248, 0.05);">p1 (Write)</div>
        <div style="color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 8px; border-radius: 4px; background: rgba(16, 185, 129, 0.05);">p2 (Read)</div>
      </div>
      
      <!-- Connectors -->
      <div style="height: 32px; display: flex; justify-content: center; align-items: center; position: relative; width: 100%;">
        <svg style="width: 100%; height: 100%;" viewBox="0 0 200 30">
          <line x1="50" y1="2" x2="50" y2="28" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2" />
          <line x1="150" y1="2" x2="150" y2="28" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2" />
          <!-- Checkmark style -->
          <circle cx="100" cy="15" r="8" fill="#10b981" />
          <path d="M97 15 l2 2 l4 -4" stroke="#ffffff" stroke-width="2" fill="none" />
        </svg>
      </div>
      
      <!-- Separate Targets -->
      <div style="display: flex; justify-content: space-around; width: 100%; font-size: 12px; font-weight: 700;">
        <div style="color: #38bdf8; border: 1.5px solid #38bdf8; padding: 6px 8px; border-radius: 4px; background: rgba(56, 189, 248, 0.1); width: 40%; text-align: center;">var a</div>
        <div style="color: #10b981; border: 1.5px solid #10b981; padding: 6px 8px; border-radius: 4px; background: rgba(16, 185, 129, 0.1); width: 40%; text-align: center;">var b</div>
      </div>
    </div>
  </div>
</div>

---

## The Static No-Aliasing Rule

WGSL's static analysis checker determines whether a program is valid using a precise checklist. Specifically, **shader creation fails** if:

1. A pointer is passed as an argument to a user-declared function.
2. The called function (or any function in the call stack it triggers) has **two distinct views** (pointers or references) into the **same original root variable**.
3. At least one of those views is used for a **potential write**.

!!! important "Control Flow Ignored Completely"
    The compiler's check for a "potential write" is a **static syntactic analysis**. It completely ignores control flow.
    
    If a function contains a branch like `if (false) { *p = 5; }`, the write is physically impossible at runtime. However, the static analysis still classifies this as a **potential write**. Consequently, passing the same root variable as an alias to this function will trigger a compile-time error. This keeps the compiler extremely fast and completely deterministic.

The interactive code editor demonstrates valid and invalid cases where a helper function writes via a pointer parameter `p`, but reads from a module-scope private variable `x`. Passing the address of `x` (i.e. `&x`) as the argument `p` would result in two overlapping views, creating an illegal alias!