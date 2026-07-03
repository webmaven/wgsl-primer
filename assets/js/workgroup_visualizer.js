import{t as e}from"./visualizer-YcQigS6C.js";var t=class{constructor(e,t,n,r,i,a,o,s,c,l,u,d){this.threadElements=[],this.sramElements=[],this.stepButtons=[],this.currentStep=0,this.executeFrequency=`once`,this.output=`none`,this.device=e,this.container=t,this.pipeline=n,this.traceBuffer=r,this.outputBuffer=i,this.traceReadbackBuffer=a,this.outputReadbackBuffer=o,this.bindGroup=s,this.threadElements=c,this.sramElements=l,this.stepButtons=u,this.timelineDescription=d,this.setupTimelineInteractions()}setupTimelineInteractions(){this.stepButtons.forEach((e,t)=>{e.addEventListener(`click`,()=>{this.setTimelineStep(t)})}),this.setTimelineStep(0)}setTimelineStep(e){this.currentStep=e,this.stepButtons.forEach((t,n)=>{n===e?t.classList.add(`step-active`):t.classList.remove(`step-active`)}),this.animateStep(e)}animateStep(e){let t=[`Step 1: Thread-Local Initialization. Each of the 64 GPU threads starts in parallel. Local registers are set up, but no shared data is loaded.`,`Step 2: Collaborative load into Fast SRAM var&lt;workgroup&gt; memory. All threads cooperatively read data from slow global storage buffers.`,`Step 3: workgroupBarrier() Synchronization. Fast threads halt and wait for slower drifting threads. Amber pulse locks execution alignment.`,`Step 4: Calculations Complete &amp; Writeback. Threads read safe shared values from the cache and write outputs back to global memory.`];this.timelineDescription.innerHTML=t[e],this.threadElements.forEach((t,n)=>{t.className=`thread-node`,e===0?t.classList.add(`state-cyan`):e===1?t.classList.add(`state-cyan-pulse`):e===2?t.classList.add(`state-amber`):e===3&&t.classList.add(`state-green`)}),this.sramElements.forEach((t,n)=>{t.className=`sram-cell`,e>=1?(t.classList.add(`sram-loaded`),t.innerText=`S[${n}]`):t.innerText=`-`})}async execute(){try{let e=this.device.createCommandEncoder(),t=e.beginComputePass();t.setPipeline(this.pipeline),t.setBindGroup(0,this.bindGroup),t.dispatchWorkgroups(1),t.end(),e.copyBufferToBuffer(this.traceBuffer,0,this.traceReadbackBuffer,0,256*4),e.copyBufferToBuffer(this.outputBuffer,0,this.outputReadbackBuffer,0,256),this.device.queue.submit([e.finish()]),await Promise.all([this.traceReadbackBuffer.mapAsync(GPUMapMode.READ),this.outputReadbackBuffer.mapAsync(GPUMapMode.READ)]),new Uint32Array(this.traceReadbackBuffer.getMappedRange()),new Float32Array(this.outputReadbackBuffer.getMappedRange()),this.traceReadbackBuffer.unmap(),this.outputReadbackBuffer.unmap(),this.setTimelineStep(this.currentStep)}catch(e){console.error(`WorkgroupVisualizer execution error:`,e)}}},n=class{constructor(e){this.device=null,this.outputContainer=null,this.threadElements=[],this.sramElements=[],this.stepButtons=[]}async configure(e){this.outputContainer=e;let t=await navigator.gpu?.requestAdapter();if(!t){this.renderFallback(e,`WebGPU not supported. Showing interactive local simulation.`);return}if(this.device=await t.requestDevice(),!this.device){this.renderFallback(e,`WebGPU failed to initialize. Showing local simulation.`);return}this.renderLayout(e)}renderFallback(e,t){this.renderLayout(e);let n=document.createElement(`div`);n.className=`visualizer-notice`,n.innerText=t,e.insertBefore(n,e.firstChild)}renderLayout(e){let t=document.createElement(`div`);t.className=`workgroup-visualizer-wrapper`,t.innerHTML=`
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
    `,e.appendChild(t);let n=t.querySelector(`#threads-grid-8x8`),r=t.querySelector(`#sram-cache-grid`);this.timelineDescription=t.querySelector(`.timeline-description-panel`),this.stepButtons=Array.from(t.querySelectorAll(`.step-btn`)),this.threadElements=[],this.sramElements=[];for(let e=0;e<64;e++){let t=document.createElement(`div`);t.className=`thread-node`,t.innerHTML=`<span class="node-id">T${e}</span>`,n.appendChild(t),this.threadElements.push(t);let i=document.createElement(`div`);i.className=`sram-cell`,i.innerText=`-`,r.appendChild(i),this.sramElements.push(i)}this.injectStyles(e)}injectStyles(e){let t=e.getRootNode();if(`querySelector`in t?t.querySelector(`#workgroup-visualizer-styles`):document.getElementById(`workgroup-visualizer-styles`))return;let n=document.createElement(`style`);n.id=`workgroup-visualizer-styles`,n.textContent=`
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
    `,(`appendChild`in t?t:document.head).appendChild(n)}async build(n){if(!this.device)return new t(null,this.outputContainer,null,null,null,null,null,null,this.threadElements,this.sramElements,this.stepButtons,this.timelineDescription);let r=256*4,i=this.device.createBuffer({size:r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),a=this.device.createBuffer({size:256,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),o=this.device.createBuffer({size:r,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),s=this.device.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),c=this.device.createShaderModule({code:n}),l=await c.getCompilationInfo();if(l.messages.some(e=>e.type===`error`))throw new e(l.messages.map(e=>({line:e.lineNum,column:e.linePos,length:e.length,msg:e.message,kind:e.type})));let u=this.device.createComputePipeline({layout:`auto`,compute:{module:c,entryPoint:`main`}}),d=this.device.createBindGroup({layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}},{binding:1,resource:{buffer:a}}]});return new t(this.device,this.outputContainer,u,i,a,o,s,d,this.threadElements,this.sramElements,this.stepButtons,this.timelineDescription)}};export{t as WorkgroupVisualizer,n as default};