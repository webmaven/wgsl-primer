import{n as e,t}from"./visualizer-YcQigS6C.js";var n=class{constructor(e,t,n,r,i){this.currentStep=0,this.steps=[],this.stepButtons=[],this.stepDots=[],this.codeLines=[],this.executeFrequency=`once`,this.output=`none`,this.device=e,this.container=t,this.pipeline=n,this.storageBuffer=r,this.outputText=i,this.initializeSteps(),this.setupDOMElements(),this.setupInteractions(),this.setStep(0),window.addEventListener(`resize`,()=>this.updatePointerArrows()),setTimeout(()=>this.updatePointerArrows(),200)}initializeSteps(){this.steps=[{title:`0. Initial State: Unallocated Stack`,code:`// Thread registers unallocated`,description:`No local variables or pointer values have been allocated in the thread stack yet. The global private variable <code>age</code> starts uninitialized at <code>0.0</code>.`,xPrevValue:`?`,xNewValue:`?`,pxPrevValue:`?`,pxNewValue:`?`,agePrevValue:`0.0`,ageNewValue:`0.0`,agePtrPrevValue:`?`,agePtrNewValue:`?`,xActive:!1,pxActive:!1,ageActive:!0,agePtrActive:!1,xAlloc:!1,pxAlloc:!1,ageAlloc:!1,agePtrAlloc:!1,arrowPxVisible:!1,arrowAgePtrVisible:!1,pulsePx:!1,pulseAgePtr:!1},{title:`1. Local Allocation: Variable x`,code:`var x: f32 = 1.5;`,description:`A local variable <span class="template">x</span> is allocated on the thread stack frame (Function Address Space). It is initialized with the value <code>1.5</code>, taking up 4 bytes of register/L1 storage.`,xPrevValue:`?`,xNewValue:`1.5`,pxPrevValue:`?`,pxNewValue:`?`,agePrevValue:`0.0`,ageNewValue:`0.0`,agePtrPrevValue:`?`,agePtrNewValue:`?`,xActive:!0,pxActive:!1,ageActive:!0,agePtrActive:!1,xAlloc:!0,pxAlloc:!1,ageAlloc:!1,agePtrAlloc:!1,arrowPxVisible:!1,arrowAgePtrVisible:!1,pulsePx:!1,pulseAgePtr:!1},{title:`2. Pointer Initialization (Address-of)`,code:`let px = &x;`,description:`We apply the address-of operator <code>&amp;</code> to get a pointer <span class="template">px</span> pointing to <code>x</code>. The pointer stores the high-level reference/address of <code>x</code> (synthesized as <code>0x1004</code>). Notice the cyan curved path representing this reference.`,xPrevValue:`1.5`,xNewValue:`1.5`,pxPrevValue:`?`,pxNewValue:`&amp;x (0x1004)`,agePrevValue:`0.0`,ageNewValue:`0.0`,agePtrPrevValue:`?`,agePtrNewValue:`?`,xActive:!0,pxActive:!0,ageActive:!0,agePtrActive:!1,xAlloc:!1,pxAlloc:!0,ageAlloc:!1,agePtrAlloc:!1,arrowPxVisible:!0,arrowAgePtrVisible:!1,pulsePx:!1,pulseAgePtr:!1},{title:`3. Dereference & Write Access`,code:`*px = 3.0;`,description:`Applying the dereference operator <code>*</code> turns the pointer back into an active memory Reference. Writing to <code>*px</code> resolves the stored address and overwrites <code>x</code> directly. Variable <span class="template">x</span> updates to <code>3.0</code>, while <code>px</code> itself is untouched!`,xPrevValue:`1.5`,xNewValue:`3.0`,pxPrevValue:`&amp;x (0x1004)`,pxNewValue:`&amp;x (0x1004)`,agePrevValue:`0.0`,ageNewValue:`0.0`,agePtrPrevValue:`?`,agePtrNewValue:`?`,xActive:!0,pxActive:!0,ageActive:!0,agePtrActive:!1,xAlloc:!1,pxAlloc:!1,ageAlloc:!1,agePtrAlloc:!1,arrowPxVisible:!0,arrowAgePtrVisible:!1,pulsePx:!0,pulseAgePtr:!1},{title:`4. Module/Private Variable Allocation`,code:`age = 18.0;`,description:`We allocate and assign <code>18.0</code> to the module-scope variable <span class="template">age</span>, located in the Private Address Space. This memory is persistent and accessible across all function calls within this individual GPU execution thread.`,xPrevValue:`3.0`,xNewValue:`3.0`,pxPrevValue:`&amp;x (0x1004)`,pxNewValue:`&amp;x (0x1004)`,agePrevValue:`0.0`,ageNewValue:`18.0`,agePtrPrevValue:`?`,agePtrNewValue:`?`,xActive:!1,pxActive:!1,ageActive:!0,agePtrActive:!1,xAlloc:!1,pxAlloc:!1,ageAlloc:!0,agePtrAlloc:!1,arrowPxVisible:!1,arrowAgePtrVisible:!1,pulsePx:!1,pulseAgePtr:!1},{title:`5. Pointer Initialization (Address-of)`,code:`let age_ptr = &age;`,description:`We apply the address-of operator <code>&amp;</code> to get a pointer <span class="template">age_ptr</span> pointing to <code>age</code>. The pointer stores the high-level reference/address of <code>age</code> (synthesized as <code>0x2000</code>). Notice the green curving path representing this reference, flowing left-to-right to the pointer cell.`,xPrevValue:`3.0`,xNewValue:`3.0`,pxPrevValue:`&amp;x (0x1004)`,pxNewValue:`&amp;x (0x1004)`,agePrevValue:`18.0`,ageNewValue:`18.0`,agePtrPrevValue:`?`,agePtrNewValue:`&amp;age (0x2000)`,xActive:!1,pxActive:!1,ageActive:!0,agePtrActive:!0,xAlloc:!1,pxAlloc:!1,ageAlloc:!1,agePtrAlloc:!0,arrowPxVisible:!1,arrowAgePtrVisible:!0,pulsePx:!1,pulseAgePtr:!1},{title:`6. Pointer Dereference Read Access`,code:`*age_ptr = *age_ptr + 1.0;`,description:`To perform the addition, we dereference <span class="template">age_ptr</span> using <code>*</code> to read its current value. A right-to-left sweep represents reading the address from <code>age_ptr</code>, followed by a flow along the green path to <code>age</code>, and another right-to-left sweep there representing the read of its value (<code>18.0</code>).`,xPrevValue:`3.0`,xNewValue:`3.0`,pxPrevValue:`&amp;x (0x1004)`,pxNewValue:`&amp;x (0x1004)`,agePrevValue:`18.0`,ageNewValue:`18.0`,agePtrPrevValue:`&amp;age (0x2000)`,agePtrNewValue:`&amp;age (0x2000)`,xActive:!1,pxActive:!1,ageActive:!0,agePtrActive:!0,xAlloc:!1,pxAlloc:!1,ageAlloc:!1,agePtrAlloc:!1,arrowPxVisible:!1,arrowAgePtrVisible:!0,pulsePx:!1,pulseAgePtr:!1},{title:`7. Dereference Write & Transitive Update`,code:`*age_ptr = *age_ptr + 1.0;`,description:`We add <code>1.0</code> and perform a dereference write, sending <code>19.0</code> back to the private variable <code>age</code>. The green dotted path advances right-to-left representing the write direction, and a continuous dereference loop runs to show the transitive update.`,xPrevValue:`3.0`,xNewValue:`3.0`,pxPrevValue:`&amp;x (0x1004)`,pxNewValue:`&amp;x (0x1004)`,agePrevValue:`18.0`,ageNewValue:`19.0`,agePtrPrevValue:`&amp;age (0x2000)`,agePtrNewValue:`&amp;age (0x2000)`,xActive:!1,pxActive:!1,ageActive:!0,agePtrActive:!0,xAlloc:!1,pxAlloc:!1,ageAlloc:!1,agePtrAlloc:!1,arrowPxVisible:!1,arrowAgePtrVisible:!0,pulsePx:!1,pulseAgePtr:!0}]}setupDOMElements(){this.cellX=this.container.querySelector(`#cell-x`),this.cellPx=this.container.querySelector(`#cell-px`),this.cellAge=this.container.querySelector(`#cell-age`),this.cellAgePtr=this.container.querySelector(`#cell-age-ptr`),this.dotPxSource=this.container.querySelector(`#dot-px-source`),this.dotXTarget=this.container.querySelector(`#dot-x-target`),this.dotAgePtrSource=this.container.querySelector(`#dot-age-ptr-source`),this.dotAgeTarget=this.container.querySelector(`#dot-age-target`),this.svgContainer=this.container.querySelector(`#pointer-svg-overlay`),this.pathPx=this.container.querySelector(`#path-px`),this.pathAgePtr=this.container.querySelector(`#path-age-ptr`),this.descriptionEl=this.container.querySelector(`#step-description`),this.stepTitleEl=this.container.querySelector(`#step-title`),this.stepButtons=Array.from(this.container.querySelectorAll(`.step-nav-btn`)),this.stepDots=Array.from(this.container.querySelectorAll(`.step-dot`)),this.codeLines=Array.from(this.container.querySelectorAll(`.vis-code-line`))}setupInteractions(){let e=this.container.querySelector(`#btn-prev`),t=this.container.querySelector(`#btn-next`);e&&t&&(e.addEventListener(`click`,()=>{this.currentStep>0&&this.setStep(this.currentStep-1)}),t.addEventListener(`click`,()=>{this.currentStep<this.steps.length-1&&this.setStep(this.currentStep+1)})),this.stepDots.forEach((e,t)=>{e.addEventListener(`click`,()=>this.setStep(t))}),this.codeLines.forEach((e,t)=>{e.addEventListener(`click`,()=>{t<this.steps.length&&this.setStep(t)})})}setStep(e){this.currentStep=e;let t=this.steps[e];this.stepDots.forEach((t,n)=>{n===e?t.classList.add(`active`):t.classList.remove(`active`)});let n=this.container.querySelector(`#btn-prev`),r=this.container.querySelector(`#btn-next`);n&&(n.disabled=e===0),r&&(r.disabled=e===this.steps.length-1),this.stepTitleEl&&(this.stepTitleEl.innerText=t.title),this.descriptionEl&&(this.descriptionEl.innerHTML=t.description);let i=e;e>=6&&(i=6),this.codeLines.forEach((e,t)=>{t===i?e.classList.add(`highlighted`):e.classList.remove(`highlighted`)}),this.updateCell(this.cellX,t.xPrevValue,t.xNewValue,t.xActive,t.xAlloc,`cyan`),this.updateCell(this.cellPx,t.pxPrevValue,t.pxNewValue,t.pxActive,t.pxAlloc,`rose`),this.updateCell(this.cellAge,t.agePrevValue,t.ageNewValue,t.ageActive,t.ageAlloc,`green`),this.updateCell(this.cellAgePtr,t.agePtrPrevValue,t.agePtrNewValue,t.agePtrActive,t.agePtrAlloc,`green`),e===3?(this.cellX.classList.add(`pulse-write`),setTimeout(()=>this.cellX.classList.remove(`pulse-write`),1e3)):(e===4||e===7)&&(this.cellAge.classList.add(`pulse-write`),setTimeout(()=>this.cellAge.classList.remove(`pulse-write`),1e3)),this.cellPx.classList.remove(`deref-active-px`),this.cellX.classList.remove(`deref-active-x`),this.pathPx.classList.remove(`deref-active-path`),this.cellAgePtr.classList.remove(`deref-active-ageptr`),this.cellAge.classList.remove(`deref-active-age`),this.pathAgePtr.classList.remove(`deref-active-path-green`),this.cellAgePtr.classList.remove(`deref-read-active-ageptr`),this.cellAge.classList.remove(`deref-read-active-age`),this.pathAgePtr.classList.remove(`deref-read-active-path-green`),e===3?(this.cellPx.classList.add(`deref-active-px`),this.cellX.classList.add(`deref-active-x`),this.pathPx.classList.add(`deref-active-path`)):e===6?(this.cellAgePtr.classList.add(`deref-read-active-ageptr`),this.cellAge.classList.add(`deref-read-active-age`),this.pathAgePtr.classList.add(`deref-read-active-path-green`)):e===7&&(this.cellAgePtr.classList.add(`deref-active-ageptr`),this.cellAge.classList.add(`deref-active-age`),this.pathAgePtr.classList.add(`deref-active-path-green`)),this.updatePointerArrows()}updateCell(e,t,n,r,i,a){if(!e)return;let o=e.querySelector(`.val-prev`),s=e.querySelector(`.val-new`);o&&(o.innerHTML=t),s&&(s.innerHTML=n),e.classList.remove(`alloc-active`,`pointer-alloc-active`),r?(e.classList.remove(`disabled`),e.classList.add(`active`,`theme-${a}`),i&&(e.offsetHeight,e.id===`cell-px`?e.classList.add(`pointer-alloc-active`):e.classList.add(`alloc-active`))):(e.classList.add(`disabled`),e.classList.remove(`active`,`theme-cyan`,`theme-rose`,`theme-green`))}updatePointerArrows(){if(!this.svgContainer)return;let e=this.steps[this.currentStep],t=this.svgContainer.getBoundingClientRect();if(e.arrowPxVisible&&this.dotPxSource&&this.dotXTarget){this.pathPx.style.display=`block`;let n=this.dotPxSource.getBoundingClientRect(),r=this.dotXTarget.getBoundingClientRect(),i=n.left-t.left+n.width/2,a=n.top-t.top+n.height/2,o=r.left-t.left+r.width/2,s=r.top-t.top+r.height/2,c=s-a,l=o-45,u=a+c*.5;this.currentStep===2?this.pathPx.setAttribute(`d`,`M ${o} ${s} Q ${l} ${u} ${i} ${a}`):this.pathPx.setAttribute(`d`,`M ${i} ${a} Q ${l} ${u} ${o} ${s}`),e.pulsePx?this.pathPx.classList.add(`write-pulse`):this.pathPx.classList.remove(`write-pulse`)}else this.pathPx.style.display=`none`;if(e.arrowAgePtrVisible&&this.dotAgePtrSource&&this.dotAgeTarget){this.pathAgePtr.style.display=`block`;let n=this.dotAgePtrSource.getBoundingClientRect(),r=this.dotAgeTarget.getBoundingClientRect(),i=n.left-t.left+n.width/2,a=n.top-t.top+n.height/2,o=r.left-t.left+r.width/2,s=r.top-t.top+r.height/2,c=s-a,l=o-45,u=a+c*.5;this.currentStep===5?this.pathAgePtr.setAttribute(`d`,`M ${o} ${s} Q ${l} ${u} ${i} ${a}`):this.pathAgePtr.setAttribute(`d`,`M ${i} ${a} Q ${l} ${u} ${o} ${s}`),e.pulseAgePtr?this.pathAgePtr.classList.add(`write-pulse-green`):this.pathAgePtr.classList.remove(`write-pulse-green`)}else this.pathAgePtr.style.display=`none`}async execute(){if(!(!this.pipeline||!this.storageBuffer))try{let e=this.device.createBuffer({size:this.storageBuffer.size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(this.pipeline);let r=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.storageBuffer}}]});n.setBindGroup(0,r),n.dispatchWorkgroups(1),n.end(),t.copyBufferToBuffer(this.storageBuffer,0,e,0,this.storageBuffer.size),this.device.queue.submit([t.finish()]),await e.mapAsync(GPUMapMode.READ);let i=new Float32Array(e.getMappedRange())[0];if(e.unmap(),this.steps[7].ageNewValue=i.toFixed(1),this.currentStep===7){let e=this.cellAge.querySelector(`.val-new`);e&&(e.innerText=this.steps[7].ageNewValue)}}catch(e){console.error(`PointerVisualizer execute error:`,e)}}},r=class{constructor(e){this.device=null,this.outputFields=[{expr:`run_test_age()`,type:`f32`}],this.outputContainer=null}async configure(e){let t=await navigator.gpu?.requestAdapter();t&&(this.device=await t.requestDevice()),this.outputContainer=e,this.renderLayout(e)}renderLayout(e){let t=document.createElement(`style`);t.innerHTML=`
      .pointer-vis-wrapper {
        box-sizing: border-box !important;
        flex-shrink: 0 !important;
        background: #0b0f19;
        border: 1.5px solid #1e293b;
        border-radius: 12px;
        padding: 12px 16px;
        margin: 12px 0 20px 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        font-family: var(--md-text-font-family, sans-serif);
        color: #cbd5e1;
        overflow: hidden;
      }

      .pointer-vis-header {
        border-bottom: 1.5px solid #1e293b;
        padding-bottom: 8px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .pointer-vis-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #f1f5f9;
        display: flex;
        align-items: center;
        gap: 8px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }

      .pointer-vis-header-pill {
        background: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.25);
        color: #38bdf8;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .pointer-vis-grid {
        display: grid;
        grid-template-columns: 1.1fr 1.4fr;
        gap: 12px;
      }

      @media (max-width: 768px) {
        .pointer-vis-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Left Column */
      .pointer-vis-left {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .pointer-vis-code-card {
        background: #070a13;
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 8px 10px;
        font-family: monospace;
        font-size: 11px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
      }

      .vis-code-line {
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        color: #64748b;
        border-left: 3px solid transparent;
        transition: all 0.2s ease;
      }

      .vis-code-line:hover {
        background: rgba(255, 255, 255, 0.02);
        color: #94a3b8;
      }

      .vis-code-line.highlighted {
        background: rgba(56, 189, 248, 0.05);
        color: #f1f5f9;
        border-left-color: #38bdf8;
        font-weight: 600;
      }

      .vis-code-line.highlighted.theme-green {
        background: rgba(16, 185, 129, 0.05);
        border-left-color: #10b981;
      }

      .pointer-vis-desc-card {
        background: rgba(30, 41, 59, 0.4);
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 10px 12px;
        min-height: 75px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .pointer-vis-desc-card h4 {
        margin: 0 0 6px 0;
        font-size: 12px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .pointer-vis-desc-card p {
        margin: 0;
        font-size: 12px;
        line-height: 1.4 !important;
        color: #cbd5e1;
      }

      .pointer-vis-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 8px 12px;
      }

      .step-nav-btn {
        background: #1e293b;
        border: 1px solid #334155;
        color: #cbd5e1;
        font-size: 11px;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .step-nav-btn:hover:not(:disabled) {
        background: #334155;
        color: #f1f5f9;
        border-color: #475569;
      }

      .step-nav-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .step-indicators {
        display: flex;
        gap: 6px;
      }

      .step-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #334155;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .step-dot.active {
        background: #38bdf8;
        transform: scale(1.25);
        box-shadow: 0 0 8px #38bdf8;
      }

      /* Right Column - Hardware Memory Spaces */
      .pointer-vis-right {
        background: rgba(15, 23, 42, 0.4);
        border: 1.5px solid #1e293b;
        border-radius: 8px;
        padding: 12px 14px;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 240px;
      }

      .mem-section-header {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .mem-section {
        border-radius: 8px;
        padding: 6px 8px;
        background: rgba(7, 10, 19, 0.5);
        border: 1px solid #1e293b;
      }

      .mem-section.sec-private {
        border-color: rgba(16, 185, 129, 0.2);
        background: rgba(16, 185, 129, 0.01);
      }

      .mem-section.sec-function {
        border-color: rgba(56, 189, 248, 0.2);
        background: rgba(56, 189, 248, 0.01);
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .mem-cell-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mem-cell {
        display: flex;
        border: 1.5px solid #1e293b;
        border-radius: 6px;
        background: rgba(15, 23, 42, 0.8);
        overflow: hidden;
        transition: all 0.3s ease;
        position: relative;
      }

      .mem-cell.disabled {
        opacity: 0.25;
        filter: grayscale(1);
      }

      .cell-meta {
        flex: 2;
        padding: 5px 8px;
        border-right: 1.5px solid #1e293b;
        background: rgba(7, 10, 19, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative; /* Added relative positioning for nested connection dots */
      }

      .cell-value-container {
        flex: 3;
        padding: 5px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-size: 12px;
        font-weight: 600;
        position: relative;
      }

      .cell-name {
        font-size: 12px;
        font-weight: 700;
        color: #94a3b8;
      }

      .cell-addr {
        font-size: 9px;
        color: #475569;
        font-family: monospace;
        margin-top: 2px;
      }

      /* Cell active themes */
      .mem-cell.active.theme-cyan {
        border-color: #38bdf8;
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.05);
      }
      .mem-cell.active.theme-cyan .cell-meta {
        background: rgba(56, 189, 248, 0.08);
        border-right-color: #38bdf8;
      }
      .mem-cell.active.theme-cyan .cell-name {
        color: #38bdf8;
      }

      .mem-cell.active.theme-rose {
        border-color: #f43f5e;
        box-shadow: 0 0 10px rgba(244, 63, 94, 0.05);
      }
      .mem-cell.active.theme-rose .cell-meta {
        background: rgba(244, 63, 94, 0.08);
        border-right-color: #f43f5e;
      }
      .mem-cell.active.theme-rose .cell-name {
        color: #f43f5e;
      }

      .mem-cell.active.theme-green {
        border-color: #10b981;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.05);
      }
      .mem-cell.active.theme-green .cell-meta {
        background: rgba(16, 185, 129, 0.08);
        border-right-color: #10b981;
      }
      .mem-cell.active.theme-green .cell-name {
        color: #10b981;
      }

      /* Glowing connection dots for SVG arrows */
      .connection-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #38bdf8;
        border-radius: 50%;
        display: none;
        z-index: 10;
        box-shadow: 0 0 6px #38bdf8;
      }

      .mem-cell.active .connection-dot {
        display: block;
      }

      /* Anchor sources to right of value slot, targets to left of metadata slot */
      .connection-dot.source {
        right: 0;
        left: auto;
        top: 50%;
        transform: translate(50%, -50%);
      }

      .connection-dot.target {
        left: 0;
        right: auto;
        top: 50%;
        transform: translate(-50%, -50%);
      }

      .connection-dot.theme-green {
        background: #10b981;
        box-shadow: 0 0 6px #10b981;
      }

      /* Swipe line layout inside registers */
      .cell-swipe-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 4px;
        left: 0;
        background: linear-gradient(to right, transparent, #38bdf8, transparent);
        opacity: 0;
        pointer-events: none;
        z-index: 8;
      }
      .mem-cell.theme-rose .cell-swipe-line {
        background: linear-gradient(to right, transparent, #f43f5e, transparent);
      }
      .mem-cell.theme-green .cell-swipe-line {
        background: linear-gradient(to right, transparent, #10b981, transparent);
      }

      /* Write flashes */
      @keyframes pulse-red-write {
        0% { border-color: #f43f5e; box-shadow: 0 0 20px #f43f5e; background: rgba(244, 63, 94, 0.2); }
        100% { border-color: inherit; box-shadow: inherit; background: inherit; }
      }
      .mem-cell.pulse-write {
        animation: pulse-red-write 0.8s ease-out;
      }

      /* Dual-span value positioning inside containers */
      .cell-value {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        white-space: nowrap;
        display: inline-block;
        transition: opacity 0.15s ease;
      }
      .cell-value.val-prev {
        opacity: 0;
      }
      .cell-value.val-new {
        opacity: 1;
      }

      /* --- Allocation Coordinated Sweep Animation (One-Shot 0.8s) --- */
      .alloc-active .val-prev {
        animation: alloc-prev-fade 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }
      .alloc-active .val-new {
        animation: alloc-new-fade 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }
      .alloc-active .cell-swipe-line {
        animation: cell-swipe-once 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }

      @keyframes alloc-prev-fade {
        0%, 60% { opacity: 1; }
        65%, 100% { opacity: 0; }
      }
      @keyframes alloc-new-fade {
        0%, 60% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); filter: blur(2px); }
        65% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); filter: none; }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: none; }
      }
      @keyframes cell-swipe-once {
        0% { left: 0; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { left: 100%; opacity: 0; }
      }

      /* --- Pointer Allocation Coordinated Sweep Animation (One-Shot 1.6s) --- */
      .pointer-alloc-active .val-prev {
        animation: pointer-alloc-prev-fade 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }
      .pointer-alloc-active .val-new {
        animation: pointer-alloc-new-fade 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }
      .pointer-alloc-active .cell-swipe-line {
        animation: pointer-cell-swipe-once 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }

      @keyframes pointer-alloc-prev-fade {
        0%, 68.75% { opacity: 1; }
        75%, 100% { opacity: 0; }
      }
      @keyframes pointer-alloc-new-fade {
        0%, 75% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); filter: blur(2px); }
        81.25% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); filter: none; }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: none; }
      }
      @keyframes pointer-cell-swipe-once {
        0%, 37.5% { left: 0; opacity: 0; }
        42.5% { opacity: 1; }
        70% { opacity: 1; }
        75% { left: 100%; opacity: 0; }
        100% { left: 100%; opacity: 0; }
      }

      /* SVG Overlay styling */
      .pointer-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
      }

      @keyframes flow-dash {
        to { stroke-dashoffset: -20; }
      }

      .pointer-svg path {
        fill: none;
        stroke-width: 2.5;
        stroke-linecap: round;
        filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.4));
        transition: stroke 0.3s ease, stroke-dasharray 0.3s ease;
      }

      .pointer-svg path.path-cyan {
        stroke: #38bdf8;
        stroke-dasharray: 6 4;
        animation: flow-dash 1.2s linear infinite;
      }

      .pointer-svg path.path-green {
        stroke: #10b981;
        stroke-dasharray: 6 4;
        filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));
        animation: flow-dash 1.2s linear infinite;
      }

      @keyframes arrow-pulse {
        0% { stroke-width: 2.5; stroke: #f43f5e; filter: drop-shadow(0 0 8px #f43f5e); }
        50% { stroke-width: 4; stroke: #ff4d6d; filter: drop-shadow(0 0 15px #ff4d6d); }
        100% { stroke-width: 2.5; stroke: #f43f5e; filter: drop-shadow(0 0 8px #f43f5e); }
      }

      .pointer-svg path.write-pulse {
        animation: arrow-pulse 0.4s ease infinite;
      }

      .pointer-svg path.write-pulse-green {
        animation: arrow-pulse 0.4s ease infinite;
        stroke: #10b981;
        filter: drop-shadow(0 0 8px #10b981);
      }

      /* --- Coordinated Dereference Animation (Step 3: *px = 3.0) --- */
      .deref-active-px .cell-meta {
        animation: deref-px-meta 3s infinite;
      }
      .deref-active-px .cell-swipe-line {
        animation: deref-px-swipe 3s infinite;
      }

      @keyframes deref-px-meta {
        0%, 25% { background: rgba(244, 63, 94, 0.2); box-shadow: inset 0 0 10px rgba(244, 63, 94, 0.3); }
        26%, 100% { background: rgba(7, 10, 19, 0.8); box-shadow: none; }
      }
      @keyframes deref-px-swipe {
        0% { left: 0; opacity: 0; }
        5% { opacity: 1; }
        20% { opacity: 1; }
        25% { left: 100%; opacity: 0; }
        26%, 100% { left: 0; opacity: 0; }
      }

      .deref-active-path {
        animation: deref-path-flow 3s infinite !important;
      }

      @keyframes deref-path-flow {
        0%, 25% { stroke-width: 2.5; stroke: #38bdf8; filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.4)); stroke-dashoffset: 0; }
        25% { stroke-width: 4; stroke: #f43f5e; filter: drop-shadow(0 0 12px #f43f5e); }
        50% { stroke-width: 2.5; stroke: #f43f5e; filter: drop-shadow(0 0 4px #f43f5e); stroke-dashoffset: -40; }
        51%, 100% { stroke-width: 2.5; stroke: #38bdf8; filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.4)); stroke-dashoffset: 0; }
      }

      .deref-active-x .cell-meta {
        animation: deref-x-meta 3s infinite;
      }
      .deref-active-x .cell-swipe-line {
        animation: deref-x-swipe 3s infinite;
      }
      .deref-active-x .cell-value-container {
        animation: deref-x-val 3s infinite;
      }
      .deref-active-x .val-prev {
        animation: deref-val-prev 3s infinite;
      }
      .deref-active-x .val-new {
        animation: deref-val-new 3s infinite;
      }

      @keyframes deref-x-meta {
        0%, 50% { background: rgba(7, 10, 19, 0.8); }
        50%, 75% { background: rgba(56, 189, 248, 0.2); box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.3); }
        76%, 100% { background: rgba(7, 10, 19, 0.8); }
      }
      @keyframes deref-x-swipe {
        0%, 50% { left: 0; opacity: 0; }
        55% { opacity: 1; }
        70% { opacity: 1; }
        75% { left: 100%; opacity: 0; }
        76%, 100% { left: 0; opacity: 0; }
      }
      @keyframes deref-x-val {
        0%, 75% { background: rgba(15, 23, 42, 0.8); box-shadow: none; border-color: transparent; }
        75% { background: rgba(244, 63, 94, 0.3); box-shadow: 0 0 15px #f43f5e; }
        90% { background: rgba(244, 63, 94, 0.1); box-shadow: 0 0 5px #f43f5e; }
        100% { background: rgba(15, 23, 42, 0.8); box-shadow: none; }
      }

      /* --- Coordinated Dereference Read Animation (Step 5: let age_ptr = &age; *age_ptr) --- */
      .deref-read-active-ageptr .cell-meta {
        animation: deref-read-ageptr-meta 3s infinite;
      }
      .deref-read-active-ageptr .cell-swipe-line {
        animation: deref-read-ageptr-swipe 3s infinite;
      }

      @keyframes deref-read-ageptr-meta {
        0%, 25% { background: rgba(16, 185, 129, 0.2); box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.3); }
        26%, 100% { background: rgba(7, 10, 19, 0.8); box-shadow: none; }
      }
      @keyframes deref-read-ageptr-swipe {
        0% { left: 100%; opacity: 0; }
        5% { opacity: 1; }
        20% { opacity: 1; }
        25% { left: 0; opacity: 0; }
        26%, 100% { left: 100%; opacity: 0; }
      }

      .deref-read-active-path-green {
        animation: deref-read-path-flow-green 3s infinite !important;
      }

      @keyframes deref-read-path-flow-green {
        0%, 25% { stroke-width: 2.5; stroke: #10b981; filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4)); stroke-dashoffset: 0; }
        25% { stroke-width: 4; stroke: #10b981; filter: drop-shadow(0 0 12px #10b981); }
        50% { stroke-width: 2.5; stroke: #10b981; filter: drop-shadow(0 0 4px #10b981); stroke-dashoffset: -40; }
        51%, 100% { stroke-width: 2.5; stroke: #10b981; filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4)); stroke-dashoffset: 0; }
      }

      .deref-read-active-age .cell-meta {
        animation: deref-read-age-meta 3s infinite;
      }
      .deref-read-active-age .cell-swipe-line {
        animation: deref-read-age-swipe 3s infinite;
      }
      .deref-read-active-age .cell-value-container {
        animation: deref-read-age-val 3s infinite;
      }

      @keyframes deref-read-age-meta {
        0%, 50% { background: rgba(7, 10, 19, 0.8); }
        50%, 75% { background: rgba(16, 185, 129, 0.2); box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.3); }
        76%, 100% { background: rgba(7, 10, 19, 0.8); }
      }
      @keyframes deref-read-age-swipe {
        0%, 50% { left: 100%; opacity: 0; }
        55% { opacity: 1; }
        70% { opacity: 1; }
        75% { left: 0; opacity: 0; }
        76%, 100% { left: 100%; opacity: 0; }
      }
      @keyframes deref-read-age-val {
        0%, 75% { background: rgba(15, 23, 42, 0.8); box-shadow: none; border-color: transparent; }
        75% { background: rgba(16, 185, 129, 0.15); box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        90% { background: rgba(16, 185, 129, 0.05); box-shadow: 0 0 3px rgba(16, 185, 129, 0.1); }
        100% { background: rgba(15, 23, 42, 0.8); box-shadow: none; }
      }

      /* --- Coordinated Dereference Animation (Step 6: *age_ptr = *age_ptr + 1.0) --- */
      .deref-active-ageptr .cell-meta {
        animation: deref-ageptr-meta 3s infinite;
      }
      .deref-active-ageptr .cell-swipe-line {
        animation: deref-ageptr-swipe 3s infinite;
      }

      @keyframes deref-ageptr-meta {
        0%, 25% { background: rgba(16, 185, 129, 0.2); box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.3); }
        26%, 100% { background: rgba(7, 10, 19, 0.8); box-shadow: none; }
      }
      @keyframes deref-ageptr-swipe {
        0% { left: 0; opacity: 0; }
        5% { opacity: 1; }
        20% { opacity: 1; }
        25% { left: 100%; opacity: 0; }
        26%, 100% { left: 0; opacity: 0; }
      }

      .deref-active-path-green {
        animation: deref-path-flow-green 3s infinite !important;
      }

      @keyframes deref-path-flow-green {
        0%, 25% { stroke-width: 2.5; stroke: #10b981; filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4)); stroke-dashoffset: 0; }
        25% { stroke-width: 4; stroke: #10b981; filter: drop-shadow(0 0 12px #10b981); }
        50% { stroke-width: 2.5; stroke: #10b981; filter: drop-shadow(0 0 4px #10b981); stroke-dashoffset: -40; }
        51%, 100% { stroke-width: 2.5; stroke: #10b981; filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4)); stroke-dashoffset: 0; }
      }

      .deref-active-age .cell-meta {
        animation: deref-age-meta 3s infinite;
      }
      .deref-active-age .cell-swipe-line {
        animation: deref-age-swipe 3s infinite;
      }
      .deref-active-age .cell-value-container {
        animation: deref-age-val 3s infinite;
      }
      .deref-active-age .val-prev {
        animation: deref-val-prev 3s infinite;
      }
      .deref-active-age .val-new {
        animation: deref-val-new 3s infinite;
      }

      @keyframes deref-age-meta {
        0%, 50% { background: rgba(7, 10, 19, 0.8); }
        50%, 75% { background: rgba(16, 185, 129, 0.2); box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.3); }
        76%, 100% { background: rgba(7, 10, 19, 0.8); }
      }
      @keyframes deref-age-swipe {
        0%, 50% { left: 0; opacity: 0; }
        55% { opacity: 1; }
        70% { opacity: 1; }
        75% { left: 100%; opacity: 0; }
        76%, 100% { left: 0; opacity: 0; }
      }
      @keyframes deref-age-val {
        0%, 75% { background: rgba(15, 23, 42, 0.8); box-shadow: none; border-color: transparent; }
        75% { background: rgba(16, 185, 129, 0.3); box-shadow: 0 0 15px #10b981; }
        90% { background: rgba(16, 185, 129, 0.1); box-shadow: 0 0 5px #10b981; }
        100% { background: rgba(15, 23, 42, 0.8); box-shadow: none; }
      }

      /* Global keyframes for deref value swaps (shared by cyan and green theme target cells) */
      @keyframes deref-val-prev {
        0%, 75% { opacity: 1; }
        76%, 100% { opacity: 0; }
      }
      @keyframes deref-val-new {
        0%, 75% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); filter: blur(1px); }
        76% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); filter: none; }
        85%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: none; }
      }
    </style>
    `,e.appendChild(t);let n=document.createElement(`div`);n.className=`pointer-vis-wrapper`,n.innerHTML=`
      <div class="pointer-vis-header">
        <h3>
          <svg style="width: 18px; height: 18px; fill: #38bdf8;" viewBox="0 0 24 24">
            <path d="M19 15v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3zM11 5H5v14h6v-6h2v6h6v-5h-2v3h-2v-6h-2v3h-2V5zm-2 4H7V7h2v2z"/>
          </svg>
          Pointer-Stack Memory Visualizer
        </h3>
        <span class="pointer-vis-header-pill">Active Thread Frame</span>
      </div>

      <div class="pointer-vis-grid">
        <!-- Left Column: Code & Controllers -->
        <div class="pointer-vis-left">
          <div class="pointer-vis-code-card">
            <div class="vis-code-line" style="color: #64748b; font-style: italic; pointer-events: none;">// Thread execution trace...</div>
            <div class="vis-code-line vis-line-1">var x: f32 = 1.5;</div>
            <div class="vis-code-line vis-line-2">let px = &amp;x;</div>
            <div class="vis-code-line vis-line-3">*px = 3.0;</div>
            <div class="vis-code-line vis-line-4">age = 18.0;</div>
            <div class="vis-code-line vis-line-5 theme-green">let age_ptr = &amp;age;</div>
            <div class="vis-code-line vis-line-6 theme-green">*age_ptr = *age_ptr + 1.0;</div>
          </div>

          <div class="pointer-vis-desc-card">
            <h4 id="step-title">Step Info</h4>
            <p id="step-description">Explanation of current instruction</p>
          </div>

          <div class="pointer-vis-controls">
            <button class="step-nav-btn" id="btn-prev">&larr; Prev</button>
            <div class="step-indicators">
              <span class="step-dot" title="Initial Frame"></span>
              <span class="step-dot" title="Alloc x"></span>
              <span class="step-dot" title="Pointer px"></span>
              <span class="step-dot" title="Dereference Write"></span>
              <span class="step-dot" title="Private age"></span>
              <span class="step-dot" title="Pointer age_ptr"></span>
              <span class="step-dot" title="Age Read"></span>
              <span class="step-dot" title="Age Increment"></span>
            </div>
            <button class="step-nav-btn" id="btn-next">Next &rarr;</button>
          </div>
        </div>

        <!-- Right Column: Visual hardware Memory cells -->
        <div class="pointer-vis-right">
          <!-- SVG arrow connector overlay -->
          <svg class="pointer-svg" id="pointer-svg-overlay">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
              </marker>
            </defs>
            <path id="path-px" class="path-cyan" marker-end="url(#arrow)" />
            <path id="path-age-ptr" class="path-green" marker-end="url(#arrow-green)" />
          </svg>

          <!-- Private Address Space (off-chip persistent VRAM/L1) -->
          <div class="mem-section sec-private">
            <div class="mem-section-header">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></span>
              Private Address Space (Global VRAM / L1 Cache)
            </div>
            <div class="mem-cell-container">
              <div class="mem-cell active theme-green" id="cell-age">
                <div class="cell-swipe-line"></div>
                <div class="cell-meta">
                  <div class="connection-dot target theme-green" id="dot-age-target"></div>
                  <span class="cell-name">Variable age</span>
                  <span class="cell-addr">Addr: 0x2000</span>
                </div>
                <div class="cell-value-container">
                  <span class="cell-value val-prev" style="color: #10b981;">0.0</span>
                  <span class="cell-value val-new" style="color: #10b981;">0.0</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Function Address Space (on-chip Core Registers) -->
          <div class="mem-section sec-function">
            <div class="mem-section-header">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #38bdf8; border-radius: 50%;"></span>
              Function Address Space (Thread Registers)
            </div>
            <div class="mem-cell-container" style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Variable x -->
              <div class="mem-cell" id="cell-x">
                <div class="cell-swipe-line"></div>
                <div class="cell-meta">
                  <div class="connection-dot target" id="dot-x-target"></div>
                  <span class="cell-name">Variable x</span>
                  <span class="cell-addr">Addr: 0x1004</span>
                </div>
                <div class="cell-value-container">
                  <span class="cell-value val-prev" style="color: #38bdf8;">1.5</span>
                  <span class="cell-value val-new" style="color: #38bdf8;">1.5</span>
                </div>
              </div>

              <!-- Pointer px -->
              <div class="mem-cell" id="cell-px">
                <div class="cell-swipe-line"></div>
                <div class="cell-meta">
                  <span class="cell-name">Pointer px</span>
                  <span class="cell-addr">Addr: 0x1008</span>
                </div>
                <div class="cell-value-container">
                  <div class="connection-dot source" id="dot-px-source"></div>
                  <span class="cell-value val-prev" style="color: #f43f5e;">&amp;x (0x1004)</span>
                  <span class="cell-value val-new" style="color: #f43f5e;">&amp;x (0x1004)</span>
                </div>
              </div>

              <!-- Pointer age_ptr -->
              <div class="mem-cell" id="cell-age-ptr">
                <div class="cell-swipe-line"></div>
                <div class="cell-meta">
                  <span class="cell-name">Pointer age_ptr</span>
                  <span class="cell-addr">Addr: 0x100C</span>
                </div>
                <div class="cell-value-container">
                  <div class="connection-dot source theme-green" id="dot-age-ptr-source"></div>
                  <span class="cell-value val-prev" style="color: #10b981;">&amp;age (0x2000)</span>
                  <span class="cell-value val-new" style="color: #10b981;">&amp;age (0x2000)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `,e.appendChild(n)}async build(r){let i=this.outputContainer||document.getElementById(`tour`),a=this.outputContainer?this.outputContainer.querySelector(`#wgsl-tour-output-text`):document.getElementById(`wgsl-tour-output-text`);if(!this.device)return new n(null,i,null,null,a);try{this.device.pushErrorScope(`validation`);let o=this.device.createShaderModule({code:r}),s=await o.getCompilationInfo();if(s.messages.some(e=>e.type===`error`))throw new t(s.messages.map(e=>({line:e.lineNum,column:e.linePos,length:e.length,msg:e.message,kind:e.type})));let c=this.device.createComputePipeline({layout:`auto`,compute:{module:o,entryPoint:`main`}}),l=await this.device.popErrorScope();if(l)throw new e(l.message);let u=this.device.createBuffer({size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});return new n(this.device,i,c,u,a)}catch(e){if(e instanceof t)throw e;return new n(this.device,i,null,null,a)}}};export{n as PointerVisualizer,r as default};