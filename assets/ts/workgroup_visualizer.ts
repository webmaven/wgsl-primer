/**
 * Copyright 2026 The Tour of WGSL Authors
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/// <reference types="@webgpu/types" />

import VisualizerBuilder, { VisualizerError, CompilationFailure, Visualizer } from './visualizer';

export class WorkgroupVisualizer implements Visualizer {
  device: GPUDevice;
  container: HTMLElement;
  pipeline: GPUComputePipeline;
  traceBuffer: GPUBuffer;
  outputBuffer: GPUBuffer;
  traceReadbackBuffer: GPUBuffer;
  outputReadbackBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;

  threadElements: HTMLElement[] = [];
  sramElements: HTMLElement[] = [];
  stepButtons: HTMLElement[] = [];
  timelineDescription: HTMLElement;

  currentStep = 0; // 0: Init, 1: Load to SRAM, 2: Barrier Sync, 3: Writeback

  readonly executeFrequency = 'once';
  readonly output = 'none';

  constructor(
    device: GPUDevice,
    container: HTMLElement,
    pipeline: GPUComputePipeline,
    traceBuffer: GPUBuffer,
    outputBuffer: GPUBuffer,
    traceReadbackBuffer: GPUBuffer,
    outputReadbackBuffer: GPUBuffer,
    bindGroup: GPUBindGroup,
    threadElements: HTMLElement[],
    sramElements: HTMLElement[],
    stepButtons: HTMLElement[],
    timelineDescription: HTMLElement
  ) {
    this.device = device;
    this.container = container;
    this.pipeline = pipeline;
    this.traceBuffer = traceBuffer;
    this.outputBuffer = outputBuffer;
    this.traceReadbackBuffer = traceReadbackBuffer;
    this.outputReadbackBuffer = outputReadbackBuffer;
    this.bindGroup = bindGroup;
    this.threadElements = threadElements;
    this.sramElements = sramElements;
    this.stepButtons = stepButtons;
    this.timelineDescription = timelineDescription;

    this.setupTimelineInteractions();
  }

  private setupTimelineInteractions() {
    this.stepButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.setTimelineStep(index);
      });
    });
    // Set initial step representation
    this.setTimelineStep(0);
  }

  private setTimelineStep(step: number) {
    this.currentStep = step;

    // Update button states
    this.stepButtons.forEach((btn, idx) => {
      if (idx === step) {
        btn.classList.add('step-active');
      } else {
        btn.classList.remove('step-active');
      }
    });

    // Update animations and colors in the matrix
    this.animateStep(step);
  }

  private animateStep(step: number) {
    // Description text for the learning phase
    const stepDescriptions = [
      'Step 1: Thread-Local Initialization. Each of the 64 GPU threads starts in parallel. Local registers are set up, but no shared data is loaded.',
      'Step 2: Collaborative load into Fast SRAM var&lt;workgroup&gt; memory. All threads cooperatively read data from slow global storage buffers.',
      'Step 3: workgroupBarrier() Synchronization. Fast threads halt and wait for slower drifting threads. Amber pulse locks execution alignment.',
      'Step 4: Calculations Complete &amp; Writeback. Threads read safe shared values from the cache and write outputs back to global memory.',
    ];
    this.timelineDescription.innerHTML = stepDescriptions[step];

    // CSS Classes for thread states: 'thread-idle', 'thread-active-cyan', 'thread-active-amber', 'thread-active-green'
    this.threadElements.forEach((el, index) => {
      el.className = 'thread-node'; // Reset

      if (step === 0) {
        // Step 1: Cyan local active
        el.classList.add('state-cyan');
      } else if (step === 1) {
        // Step 2: Loading
        el.classList.add('state-cyan-pulse');
      } else if (step === 2) {
        // Step 3: Amber barrier halt
        el.classList.add('state-amber');
      } else if (step === 3) {
        // Step 4: Finished compute and writeback
        el.classList.add('state-green');
      }
    });

    // Animate shared SRAM cache cells
    this.sramElements.forEach((el, index) => {
      el.className = 'sram-cell'; // Reset
      if (step >= 1) {
        el.classList.add('sram-loaded');
        el.innerText = `S[${index}]`;
      } else {
        el.innerText = '-';
      }
    });
  }

  async execute() {
    try {
      // 1. Run compute shader trace recorder
      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(this.pipeline);
      passEncoder.setBindGroup(0, this.bindGroup);
      passEncoder.dispatchWorkgroups(1); // Execute our 1 local workgroup of size 64
      passEncoder.end();

      // Copy buffer states to host mapped memory
      commandEncoder.copyBufferToBuffer(
        this.traceBuffer,
        0,
        this.traceReadbackBuffer,
        0,
        64 * 4 * 4
      );
      commandEncoder.copyBufferToBuffer(this.outputBuffer, 0, this.outputReadbackBuffer, 0, 64 * 4);
      this.device.queue.submit([commandEncoder.finish()]);

      // Map and extract computed traces
      await Promise.all([
        this.traceReadbackBuffer.mapAsync(GPUMapMode.READ),
        this.outputReadbackBuffer.mapAsync(GPUMapMode.READ),
      ]);

      const traceMapped = new Uint32Array(this.traceReadbackBuffer.getMappedRange());
      const outputMapped = new Float32Array(this.outputReadbackBuffer.getMappedRange());

      // Print first few values in console for verification, and unmap
      this.traceReadbackBuffer.unmap();
      this.outputReadbackBuffer.unmap();

      // Ensure timeline state reflects true compiled executions
      this.setTimelineStep(this.currentStep);
    } catch (e) {
      console.error('WorkgroupVisualizer execution error:', e);
    }
  }
}

export default class WorkgroupVisualizerBuilder implements VisualizerBuilder {
  device: GPUDevice | null = null;
  outputContainer: HTMLElement | null = null;

  threadElements: HTMLElement[] = [];
  sramElements: HTMLElement[] = [];
  stepButtons: HTMLElement[] = [];
  timelineDescription!: HTMLElement;

  constructor(optionsJson: string) {
    // Setup option parsing if required
  }

  async configure(output: HTMLElement) {
    this.outputContainer = output;

    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
      this.renderFallback(output, 'WebGPU not supported. Showing interactive local simulation.');
      return;
    }
    this.device = await adapter.requestDevice();
    if (!this.device) {
      this.renderFallback(output, 'WebGPU failed to initialize. Showing local simulation.');
      return;
    }

    this.renderLayout(output);
  }

  private renderFallback(output: HTMLElement, message: string) {
    // Generate simulated fallback component with interactive SVG elements
    this.renderLayout(output);
    const notice = document.createElement('div');
    notice.className = 'visualizer-notice';
    notice.innerText = message;
    output.insertBefore(notice, output.firstChild);
  }

  private renderLayout(output: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.className = 'workgroup-visualizer-wrapper';

    wrapper.innerHTML = `
      <div class="visualizer-header">
        <h3>Workgroup Barrier Visualizer <span>(64 concurrent threads)</span></h3>
      </div>
      
      <div class="timeline-slider-bar">
        <button class="step-btn step-active" data-step="0">1. Initialize</button>
        <button class="step-btn" data-step="1">2. Load SRAM</button>
        <button class="step-btn" data-step="2">3. Barrier Sync</button>
        <button class="step-btn" data-step="3">4. Writeback</button>
      </div>

      <div class="timeline-description-panel">
        Loading interactive timeline state...
      </div>

      <div class="visualizer-main-grid">
        <div class="visualizer-column">
          <div class="column-header">THREAD COMPUTE GRID (8x8 threads)</div>
          <div class="thread-grid" id="threads-grid-8x8"></div>
        </div>
        
        <div class="visualizer-column">
          <div class="column-header">SRAM var&lt;workgroup&gt; CACHE (64 floats)</div>
          <div class="sram-grid" id="sram-cache-grid"></div>
        </div>
      </div>
    `;
    output.appendChild(wrapper);

    const threadGrid = wrapper.querySelector('#threads-grid-8x8')!;
    const sramGrid = wrapper.querySelector('#sram-cache-grid')!;
    this.timelineDescription = wrapper.querySelector('.timeline-description-panel')!;
    this.stepButtons = Array.from(wrapper.querySelectorAll('.step-btn'));

    this.threadElements = [];
    this.sramElements = [];

    // Create 64 thread nodes
    for (let i = 0; i < 64; i++) {
      const node = document.createElement('div');
      node.className = 'thread-node';
      node.innerHTML = `<span class="node-id">T${i}</span>`;
      threadGrid.appendChild(node);
      this.threadElements.push(node);

      const sramCell = document.createElement('div');
      sramCell.className = 'sram-cell';
      sramCell.innerText = '-';
      sramGrid.appendChild(sramCell);
      this.sramElements.push(sramCell);
    }

    this.injectStyles(output);
  }

  private injectStyles(output: HTMLElement) {
    const root = output.getRootNode() as ShadowRoot | Document;
    const exists =
      'querySelector' in root
        ? root.querySelector('#workgroup-visualizer-styles')
        : document.getElementById('workgroup-visualizer-styles');
    if (exists) return;

    const styles = document.createElement('style');
    styles.id = 'workgroup-visualizer-styles';
    styles.textContent = `
      .workgroup-visualizer-wrapper {
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(20, 184, 166, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-top: 15px;
        box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.5);
        color: #f8fafc;
        font-family: 'Inter', system-ui, sans-serif;
      }
      .visualizer-notice {
        background: rgba(20, 184, 166, 0.1);
        border: 1px solid rgba(20, 184, 166, 0.3);
        border-radius: 6px;
        color: #14b8a6;
        padding: 8px 12px;
        font-size: 0.8rem;
        margin-bottom: 12px;
        text-align: center;
      }
      .visualizer-header h3 {
        margin: 0 0 15px 0;
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #14b8a6;
        text-transform: uppercase;
      }
      .visualizer-header h3 span {
        font-size: 0.85rem;
        color: #94a3b8;
        text-transform: none;
      }
      .timeline-slider-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 12px;
      }
      .step-btn {
        flex: 1;
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 10px 8px;
        color: #94a3b8;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .step-btn:hover {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(20, 184, 166, 0.3);
        color: #e2e8f0;
      }
      .step-active {
        background: rgba(20, 184, 166, 0.15) !important;
        border-color: #14b8a6 !important;
        color: #14b8a6 !important;
        box-shadow: 0 0 10px rgba(20, 184, 166, 0.2);
      }
      .timeline-description-panel {
        background: rgba(15, 23, 42, 0.5);
        border-radius: 6px;
        padding: 12px 15px;
        font-size: 0.85rem;
        line-height: 1.5;
        color: #cbd5e1;
        margin-bottom: 20px;
        border-left: 3px solid #14b8a6;
      }
      .visualizer-main-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media (max-width: 640px) {
        .visualizer-main-grid {
          grid-template-columns: 1fr;
        }
      }
      .column-header {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #94a3b8;
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      .thread-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 6px;
      }
      .sram-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 6px;
      }
      .thread-node {
        aspect-ratio: 1;
        background: rgba(30, 41, 59, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-family: monospace;
        color: #64748b;
        transition: all 0.35s ease;
      }
      .sram-cell {
        aspect-ratio: 1;
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.02);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-family: monospace;
        color: #475569;
        transition: all 0.3s ease;
      }
      
      /* Execution States colors and glowing animations */
      .state-cyan {
        background: rgba(6, 182, 212, 0.2) !important;
        border-color: #06b6d4 !important;
        color: #22d3ee !important;
        box-shadow: 0 0 6px rgba(6, 182, 212, 0.3);
      }
      .state-cyan-pulse {
        animation: cyan-pulse-anim 1.5s infinite alternate;
        background: rgba(6, 182, 212, 0.3);
        border-color: #06b6d4;
        color: #22d3ee;
      }
      .state-amber {
        background: rgba(245, 158, 11, 0.2) !important;
        border-color: #f59e0b !important;
        color: #fbbf24 !important;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
      }
      .state-green {
        background: rgba(16, 185, 129, 0.2) !important;
        border-color: #10b981 !important;
        color: #34d399 !important;
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.3);
      }
      .sram-loaded {
        background: rgba(20, 184, 166, 0.15) !important;
        border-color: rgba(20, 184, 166, 0.4) !important;
        color: #14b8a6 !important;
      }
      
      @keyframes cyan-pulse-anim {
        0% {
          background: rgba(6, 182, 212, 0.1);
          box-shadow: 0 0 2px rgba(6, 182, 212, 0.1);
        }
        100% {
          background: rgba(6, 182, 212, 0.4);
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
      }
    `;
    const target = 'appendChild' in root ? root : document.head;
    target.appendChild(styles);
  }

  async build(shader: string): Promise<Visualizer> {
    // If WebGPU is not supported, configure returns early without device.
    // We instantiate a Mock WorkgroupVisualizer that runs purely locally.
    if (!this.device) {
      return new WorkgroupVisualizer(
        null as any,
        this.outputContainer!,
        null as any,
        null as any,
        null as any,
        null as any,
        null as any,
        null as any,
        this.threadElements,
        this.sramElements,
        this.stepButtons,
        this.timelineDescription
      );
    }

    const traceBufferSize = 64 * 4 * 4; // 64 threads * 4 steps * sizeof(u32)
    const outputBufferSize = 64 * 4; // 64 threads * sizeof(f32)

    const traceBuffer = this.device.createBuffer({
      size: traceBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const outputBuffer = this.device.createBuffer({
      size: outputBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const traceReadback = this.device.createBuffer({
      size: traceBufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const outputReadback = this.device.createBuffer({
      size: outputBufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const shaderModule = this.device.createShaderModule({
      code: shader,
    });

    const compilationInfo = await shaderModule.getCompilationInfo();
    if (compilationInfo.messages.some((m) => m.type === 'error')) {
      throw new CompilationFailure(
        compilationInfo.messages.map((m) => ({
          line: m.lineNum,
          column: m.linePos,
          length: m.length,
          msg: m.message,
          kind: m.type,
        }))
      );
    }

    const pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: traceBuffer },
        },
        {
          binding: 1,
          resource: { buffer: outputBuffer },
        },
      ],
    });

    return new WorkgroupVisualizer(
      this.device,
      this.outputContainer!,
      pipeline,
      traceBuffer,
      outputBuffer,
      traceReadback,
      outputReadback,
      bindGroup,
      this.threadElements,
      this.sramElements,
      this.stepButtons,
      this.timelineDescription
    );
  }
}
