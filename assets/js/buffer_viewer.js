import{n as e,t}from"./visualizer-YcQigS6C.js";var n=class{constructor(e,t,n,r,i,a,o,s,c){this.inputCells=[],this.outputCells=[],this.executeFrequency=`once`,this.output=`none`,this.isQuestionModeActive=!1,this.tooltipElement=null,this.globalClickListener=null,this.isReallocating=!1,this.handleMouseOver=e=>{if(!this.isQuestionModeActive||!this.tooltipElement)return;let t=e.composedPath(),n=null;for(let e of t)if(e instanceof HTMLElement&&e.hasAttribute(`data-help`)){n=e;break}if(n){let e=n.getAttribute(`data-help`);e&&(this.tooltipElement.innerHTML=e,this.tooltipElement.style.opacity=`1`)}else this.tooltipElement.style.opacity=`0`},this.handleMouseMove=e=>{if(!this.isQuestionModeActive||!this.tooltipElement)return;let t=this.container.querySelector(`.buffer-viewer-wrapper`);if(t){let n=t.getBoundingClientRect(),r=e.clientX-n.left,i=e.clientY-n.top,a=n.width,o=n.height,s=this.tooltipElement.offsetWidth||250,c=this.tooltipElement.offsetHeight||120,l=r+15,u=i+15;l+s>a-10&&(l=r-s-15),u+c>o-10&&(u=i-c-15),l=Math.max(10,Math.min(l,a-s-10)),u=Math.max(10,Math.min(u,o-c-10)),this.tooltipElement.style.left=`${l}px`,this.tooltipElement.style.top=`${u}px`}},this.handleMouseOut=e=>{if(!this.isQuestionModeActive||!this.tooltipElement)return;let t=this.container.querySelector(`.buffer-viewer-wrapper`);t&&(!e.relatedTarget||!t.contains(e.relatedTarget))&&(this.tooltipElement.style.opacity=`0`)},this.device=e,this.container=t,this.length=n,this.datatype=r,this.pipeline=i,this.inputBuffer=a,this.outputBuffer=o,this.readbackBuffer=s,this.bindGroup=c,this.rebuildDOM(Array.from({length:this.length},(e,t)=>t+1));let l=this.container.querySelector(`.help-inspector-toggle`);l&&l.addEventListener(`click`,e=>{e.stopPropagation(),this.toggleQuestionMode()})}rebuildDOM(e,t){if(this.inputGrid=this.container.querySelector(`#input-cells-grid`),this.outputGrid=this.container.querySelector(`#output-cells-grid`),!this.inputGrid||!this.outputGrid)return;this.inputGrid.innerHTML=``,this.outputGrid.innerHTML=``,this.inputCells=[],this.outputCells=[];let n=e.length<=1,r=e.length>=16;for(let r=0;r<e.length;r++){let i=document.createElement(`div`);i.className=`cell-wrapper`,t===r&&(i.className+=` animate-add`),i.setAttribute(`data-help`,`<strong>Input Scalar Cell (index ${r})</strong><br>Represents the scalar value at index <code>${r}</code> inside the input storage array in GPU memory. Click the cell in normal mode to edit its value manually.`);let a=document.createElement(`div`);a.className=`cell-controls`;let o=document.createElement(`button`);o.className=`control-btn`,o.innerHTML=`◀`,o.title=`Move Left`,r===0&&(o.disabled=!0),o.setAttribute(`data-help`,`<strong>Move Left</strong><br>Swaps this element's position with its left neighbor in-place. This triggers an immediate execution pass and displays a glowing animation on both swapped cells.`),o.addEventListener(`click`,e=>{e.stopPropagation(),this.swapCells(r,r-1)});let s=document.createElement(`button`);s.className=`control-btn delete-cell`,s.innerHTML=`×`,s.title=`Delete`,n&&(s.disabled=!0),s.setAttribute(`data-help`,`<strong>Delete Element</strong><br>Removes this element. Under the hood, this destroys the old GPU buffers, allocates a smaller buffer, recreates the GPUBindGroup, and re-executes instantly.`),s.addEventListener(`click`,t=>{t.stopPropagation();let n=this.inputCells.map(e=>parseFloat(e.value)||0);n.splice(r,1),this.reallocate(e.length-1,n)});let c=document.createElement(`button`);c.className=`control-btn`,c.innerHTML=`▶`,c.title=`Move Right`,r===e.length-1&&(c.disabled=!0),c.setAttribute(`data-help`,`<strong>Move Right</strong><br>Swaps this element's position with its right neighbor in-place. This triggers an immediate execution pass and displays a glowing animation on both swapped cells.`),c.addEventListener(`click`,e=>{e.stopPropagation(),this.swapCells(r,r+1)}),a.appendChild(o),a.appendChild(s),a.appendChild(c),i.appendChild(a);let l=document.createElement(`input`);l.type=`number`,l.step=this.datatype===`f32`?`0.1`:`1`,l.value=e[r].toString(),l.className=`visualizer-cell input-cell`,l.addEventListener(`input`,()=>{this.execute()}),i.appendChild(l),this.inputGrid.appendChild(i),this.inputCells.push(l);let u=document.createElement(`div`);u.className=`visualizer-cell output-cell`,t===r&&(u.className+=` animate-add`),u.innerText=`-`,u.setAttribute(`data-help`,`<strong>Output Scalar Cell (index ${r})</strong><br>Displays the computed result written by the GPU compute shader at index <code>${r}</code>. Flashes with a glowing teal wave when modified.`),this.outputGrid.appendChild(u),this.outputCells.push(u)}if(!r){let t=document.createElement(`button`);t.className=`add-cell-btn`,t.innerHTML=`+`,t.title=`Add Element`,t.setAttribute(`data-help`,`<strong>Add Element</strong><br>Appends a new cell. Dynamically reallocates a larger GPU storage buffer and recreates the GPUBindGroup instantly—with <strong>zero shader recompilation overhead</strong>!`),t.addEventListener(`click`,()=>{let t=this.inputCells.map(e=>parseFloat(e.value)||0),n=t.length>0?Math.max(...t)+1:1;t.push(n),this.reallocate(e.length+1,t,e.length)}),this.inputGrid.appendChild(t)}}async reallocate(e,t,n){this.isReallocating=!0;try{let r=e<this.length,i=this.inputGrid.querySelectorAll(`.cell-wrapper`),a=this.outputGrid.querySelectorAll(`.output-cell`);r?(i.forEach(e=>e.classList.add(`buffer-deallocating`)),a.forEach(e=>e.classList.add(`buffer-deallocating`))):(i.forEach(e=>e.classList.add(`buffer-deallocating-all`)),a.forEach(e=>e.classList.add(`buffer-deallocating-all`))),await new Promise(e=>setTimeout(e,400)),this.inputBuffer&&this.inputBuffer.destroy(),this.outputBuffer&&this.outputBuffer.destroy(),this.readbackBuffer&&this.readbackBuffer.destroy(),this.length=e;let o=this.length*4;this.inputBuffer=this.device.createBuffer({size:o,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.outputBuffer=this.device.createBuffer({size:o,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.readbackBuffer=this.device.createBuffer({size:o,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.bindGroup=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.inputBuffer}},{binding:1,resource:{buffer:this.outputBuffer}}]}),this.rebuildDOM(t||Array.from({length:this.length},(e,t)=>t+1),n),await this.execute()}catch(e){console.error(`BufferViewer reallocation error:`,e)}finally{this.isReallocating=!1}}swapCells(e,t){if(e<0||e>=this.length||t<0||t>=this.length)return;let n=this.inputCells[e].value;this.inputCells[e].value=this.inputCells[t].value,this.inputCells[t].value=n,this.inputCells[e].classList.add(`mutated-glow`),this.inputCells[t].classList.add(`mutated-glow`),setTimeout(()=>{this.inputCells[e].classList.remove(`mutated-glow`),this.inputCells[t].classList.remove(`mutated-glow`)},1e3),this.execute()}async execute(){try{let e=new ArrayBuffer(this.length*4);if(this.datatype===`f32`){let t=new Float32Array(e);for(let e=0;e<this.length;e++)t[e]=parseFloat(this.inputCells[e].value)||0}else if(this.datatype===`i32`){let t=new Int32Array(e);for(let e=0;e<this.length;e++)t[e]=parseInt(this.inputCells[e].value,10)||0}else{let t=new Uint32Array(e);for(let e=0;e<this.length;e++)t[e]=Math.max(0,parseInt(this.inputCells[e].value,10)||0)}this.device.queue.writeBuffer(this.inputBuffer,0,e);let t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(this.pipeline),n.setBindGroup(0,this.bindGroup);let r=Math.ceil(this.length/64);n.dispatchWorkgroups(r),n.end(),t.copyBufferToBuffer(this.outputBuffer,0,this.readbackBuffer,0,this.length*4),this.device.queue.submit([t.finish()]),await this.readbackBuffer.mapAsync(GPUMapMode.READ);let i=this.readbackBuffer.getMappedRange(),a=[];a=this.datatype===`f32`?Array.from(new Float32Array(i)):this.datatype===`i32`?Array.from(new Int32Array(i)):Array.from(new Uint32Array(i)),this.readbackBuffer.unmap();for(let e=0;e<this.length;e++){let t=this.outputCells[e];if(!t)continue;let n=t.innerText,r=this.datatype===`f32`?a[e].toFixed(2):a[e].toString();t.innerText=r,n!==r&&n!==``&&!this.isReallocating&&(t.classList.add(`mutated-glow`),setTimeout(()=>t.classList.remove(`mutated-glow`),1e3))}}catch(e){console.error(`BufferViewer execution error:`,e)}}toggleQuestionMode(){this.isQuestionModeActive?this.deactivateQuestionMode():this.activateQuestionMode()}activateQuestionMode(){this.isQuestionModeActive=!0;let e=this.container.querySelector(`.buffer-viewer-wrapper`),t=this.container.querySelector(`.help-inspector-toggle`);if(e){e.classList.add(`question-mode-active`);let t=e.querySelector(`.help-inspector-banner`);t||(t=document.createElement(`div`),t.className=`help-inspector-banner`,t.innerText=`Help Inspector Active`,t.setAttribute(`data-help`,`<strong>Help Inspector Guide</strong><br>Hover any highlighted element in the visualizer to learn about buffer memory layouts and WebGPU concepts. Click anywhere inside or outside the visualizer to exit Question Mode.`),e.insertBefore(t,e.querySelector(`.visualizer-grid-columns`)))}t&&t.classList.add(`active`),this.createTooltip(),this.globalClickListener=e=>{t&&t.contains(e.target)||(e.stopPropagation(),e.preventDefault(),this.deactivateQuestionMode())},document.addEventListener(`click`,this.globalClickListener,{capture:!0})}deactivateQuestionMode(){this.isQuestionModeActive=!1;let e=this.container.querySelector(`.buffer-viewer-wrapper`),t=this.container.querySelector(`.help-inspector-toggle`);if(e){e.classList.remove(`question-mode-active`);let t=e.querySelector(`.help-inspector-banner`);t&&t.remove()}t&&t.classList.remove(`active`),this.removeTooltip(),this.globalClickListener&&=(document.removeEventListener(`click`,this.globalClickListener,{capture:!0}),null)}createTooltip(){if(this.tooltipElement)return;let e=this.container.querySelector(`.buffer-viewer-wrapper`);e&&(this.tooltipElement=document.createElement(`div`),this.tooltipElement.className=`help-inspector-tooltip`,e.appendChild(this.tooltipElement),e.addEventListener(`mouseover`,this.handleMouseOver),e.addEventListener(`mousemove`,this.handleMouseMove),e.addEventListener(`mouseout`,this.handleMouseOut))}removeTooltip(){let e=this.container.querySelector(`.buffer-viewer-wrapper`);this.tooltipElement&&=(this.tooltipElement.remove(),null),e&&(e.removeEventListener(`mouseover`,this.handleMouseOver),e.removeEventListener(`mousemove`,this.handleMouseMove),e.removeEventListener(`mouseout`,this.handleMouseOut))}},r=class{constructor(e){this.device=null,this.outputContainer=null;try{this.options=JSON.parse(e||`{}`)}catch{this.options={}}this.options.length=this.options.length??8,this.options.datatype=this.options.datatype??`f32`}async configure(e){this.outputContainer=e;let t=await navigator.gpu?.requestAdapter();if(!t){this.renderFallback(e,`WebGPU not supported. Showing static simulation.`);return}if(this.device=await t.requestDevice(),!this.device){this.renderFallback(e,`Unable to initialize WebGPU device. Showing static simulation.`);return}this.renderLayout(e)}renderFallback(e,t){let n=document.createElement(`div`);n.className=`visualizer-fallback`,n.innerHTML=`
      <div class="fallback-banner">${t}</div>
      <div class="fallback-grid-container">
        <div class="fallback-grid">
          <h4>INPUT ARRAY</h4>
          <div class="cells-row">
            ${Array.from({length:this.options.length},(e,t)=>`<div class="cell fallback-input">${(t+1).toFixed(1)}</div>`).join(``)}
          </div>
        </div>
        <div class="fallback-grid">
          <h4>OUTPUT ARRAY</h4>
          <div class="cells-row">
            ${Array.from({length:this.options.length},(e,t)=>`<div class="cell fallback-output">${((t+1)*3).toFixed(1)}</div>`).join(``)}
          </div>
        </div>
      </div>
    `,e.appendChild(n),this.injectStyles(e)}renderLayout(e){let t=document.createElement(`div`);t.className=`buffer-viewer-wrapper`,t.innerHTML=`
      <div class="visualizer-header" data-help="<strong>WebGPU Buffer Viewer</strong><br>A live visualizer that maps CPU TypeScript arrays directly to GPU <code>storage</code> buffer bindings. Computes shaders in real-time.">
        <h3>Buffer Viewer <span>(${this.options.datatype} array)</span></h3>
        <button class="help-inspector-toggle" title="Explore Buffer Viewer Concepts" aria-label="Explore Buffer Viewer Concepts" data-help="<strong>Help Inspector Guide</strong><br>Hover any highlighted element in the visualizer to learn about buffer memory layouts and WebGPU concepts. Click anywhere inside or outside the visualizer to exit Question Mode.">?</button>
      </div>
      <div class="visualizer-grid-columns">
        <div class="column-panel input-panel" data-help="<strong>Input Storage Buffer Panel</strong><br>Represents the input buffer declared as <code>binding(0)</code> in WGSL. This storage buffer is read-only inside the compute shader. Editing cells here updates GPU memory dynamically.">
          <div class="panel-title">INPUT STORAGE BUFFER</div>
          <div class="cells-container" id="input-cells-grid"></div>
          <div class="panel-hint">Hover a cell for controls; click to edit</div>
        </div>
        <div class="column-panel output-panel" data-help="<strong>Output Storage Buffer Panel</strong><br>Represents the output buffer declared as <code>binding(1)</code> in WGSL. The compute shader writes its results here, which are then copied to a staging buffer and read back to display live output values.">
          <div class="panel-title">OUTPUT STORAGE BUFFER</div>
          <div class="cells-container" id="output-cells-grid"></div>
          <div class="panel-hint">Updated live by compute shader</div>
        </div>
      </div>
    `,e.appendChild(t),this.injectStyles(e)}injectStyles(e){let t=e.getRootNode();if(`querySelector`in t?t.querySelector(`#buffer-viewer-styles`):document.getElementById(`buffer-viewer-styles`))return;let n=document.createElement(`style`);n.id=`buffer-viewer-styles`,n.textContent=`
      .buffer-viewer-wrapper {
        position: relative; /* Positioning parent for help tooltip */
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(20, 184, 166, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin-top: 15px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
        color: #f8fafc;
        font-family: 'Inter', system-ui, sans-serif;
        transition: border 0.3s ease, box-shadow 0.3s ease;
      }
      .visualizer-header {
        margin: 0 0 12px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .visualizer-header h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #14b8a6;
        display: flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
      }
      .visualizer-header h3 span {
        font-size: 0.8rem;
        color: #94a3b8;
        text-transform: none;
      }
      .visualizer-grid-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media (max-width: 640px) {
        .visualizer-grid-columns {
          grid-template-columns: 1fr;
        }
      }
      .column-panel {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        transition: outline 0.2s ease;
      }
      .panel-title {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #94a3b8;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      .cells-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
        gap: 8px;
        margin-bottom: 10px;
        align-items: center;
      }
      .cell-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        transition: outline 0.2s ease, transform 0.25s ease, filter 0.25s ease;
      }
      .cell-controls {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        display: flex;
        align-items: center;
        gap: 2px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(20, 184, 166, 0.4);
        border-radius: 20px;
        padding: 2px 4px;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(20, 184, 166, 0.2);
      }
      .cell-wrapper:hover .cell-controls {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }
      .control-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 0.6rem;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 15px;
        height: 15px;
        transition: all 0.15s ease;
      }
      .control-btn:hover:not(:disabled) {
        color: #14b8a6;
        background: rgba(20, 184, 166, 0.15);
      }
      .control-btn.delete-cell {
        font-size: 0.75rem;
      }
      .control-btn.delete-cell:hover:not(:disabled) {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.15);
      }
      .control-btn:disabled {
        color: #475569;
        cursor: not-allowed;
        opacity: 0.25;
      }
      .add-cell-btn {
        height: 30px;
        background: rgba(20, 184, 166, 0.04);
        border: 1px dashed rgba(20, 184, 166, 0.3);
        color: #14b8a6;
        font-size: 0.95rem;
        font-weight: 500;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        padding: 0;
      }
      .add-cell-btn:hover {
        background: rgba(20, 184, 166, 0.12);
        border-color: #14b8a6;
        box-shadow: 0 0 12px rgba(20, 184, 166, 0.15);
        transform: scale(1.02);
      }
      .add-cell-btn:active {
        transform: scale(0.98);
      }

      /* Help Toggle Styles */
      .help-inspector-toggle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid rgba(20, 184, 166, 0.4);
        background: rgba(20, 184, 166, 0.05);
        color: #14b8a6;
        cursor: pointer;
        font-weight: bold;
        font-size: 0.85rem;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .help-inspector-toggle:hover {
        background: rgba(20, 184, 166, 0.2);
        box-shadow: 0 0 10px rgba(20, 184, 166, 0.4);
        transform: scale(1.08);
      }
      .help-inspector-toggle.active {
        background: #14b8a6;
        color: #0f172a;
        box-shadow: 0 0 15px rgba(20, 184, 166, 0.6);
        border-color: #14b8a6;
      }

      /* Question Mode Overlay Banner & Active States */
      .question-mode-active {
        cursor: help !important;
        border-color: rgba(20, 184, 166, 0.6) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(20, 184, 166, 0.25) !important;
      }
      .question-mode-active input, 
      .question-mode-active button, 
      .question-mode-active .cell-wrapper,
      .question-mode-active .column-panel {
        cursor: help !important;
      }
      .question-mode-active .cell-controls {
        opacity: 0 !important;
        pointer-events: none !important;
      }
      .question-mode-active [data-help]:hover {
        outline: 1.5px dashed #14b8a6 !important;
        outline-offset: 3px;
        border-radius: 6px;
      }
      
      .help-inspector-banner {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translate(-50%, 0);
        background: rgba(20, 184, 166, 0.15);
        border: 1px solid rgba(20, 184, 166, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #2dd4bf;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
        margin: 0;
        width: fit-content;
        animation: slide-down 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        cursor: help;
        transition: all 0.2s ease;
        z-index: 10;
      }
      .help-inspector-banner:hover {
        background: rgba(20, 184, 166, 0.25);
        box-shadow: 0 0 12px rgba(20, 184, 166, 0.35);
      }
      @keyframes slide-down {
        from {
          opacity: 0;
          transform: translate(-50%, -10px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }

      /* Help Tooltip Box */
      .help-inspector-tooltip {
        position: absolute;
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(20, 184, 166, 0.5);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(20, 184, 166, 0.1);
        border-radius: 8px;
        padding: 8px 12px;
        color: #f8fafc;
        font-size: 0.725rem;
        max-width: 250px;
        width: max-content;
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
        line-height: 1.4;
        box-sizing: border-box;
      }
      .help-inspector-tooltip strong {
        color: #14b8a6;
        display: block;
        margin-bottom: 4px;
        font-size: 0.775rem;
        letter-spacing: 0.02em;
        border-bottom: 1px solid rgba(20, 184, 166, 0.2);
        padding-bottom: 4px;
      }
      .help-inspector-tooltip code {
        font-family: 'Fira Code', monospace;
        background: rgba(20, 184, 166, 0.15);
        color: #2dd4bf;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 0.75rem;
      }

      /* Deallocation Animations */
      .buffer-deallocating {
        animation: dissolve-fade 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      /* Animate nested input cells during buffer deallocation (red destruction glow) */
      .buffer-deallocating .input-cell, .output-cell.buffer-deallocating {
        animation: cell-dissolve-glow 0.4s cubic-bezier(0.4, 0, 1, 1) forwards !important;
      }
      .buffer-deallocating-all {
        animation: dissolve-fade-all 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      /* Animate nested input cells during general reallocation (amber updating glow) */
      .buffer-deallocating-all .input-cell, .output-cell.buffer-deallocating-all {
        animation: cell-realloc-glow 0.4s cubic-bezier(0.4, 0, 1, 1) forwards !important;
      }
      @keyframes dissolve-fade {
        0% {
          opacity: 1;
          transform: scale(1);
          filter: blur(0);
        }
        30% {
          opacity: 1;
          transform: scale(1.02);
          filter: blur(0);
        }
        100% {
          opacity: 0;
          transform: scale(0.8) translateY(10px);
          filter: blur(4px);
        }
      }
      @keyframes cell-dissolve-glow {
        0% {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          box-shadow: none;
          transform: scale(1);
        }
        20%, 65% {
          background: rgba(239, 68, 68, 0.95);
          border-color: #ef4444;
          color: #ffffff;
          box-shadow: 0 0 25px #ef4444, inset 0 0 10px #ef4444;
          transform: scale(1.08);
        }
        100% {
          background: rgba(239, 68, 68, 0);
          border-color: rgba(239, 68, 68, 0);
          color: rgba(255, 255, 255, 0);
          box-shadow: 0 0 0px rgba(239, 68, 68, 0);
          transform: scale(0.8);
        }
      }
      @keyframes dissolve-fade-all {
        0% {
          transform: scale(1);
        }
        40% {
          transform: scale(1.03);
        }
        100% {
          transform: scale(1);
        }
      }
      @keyframes cell-realloc-glow {
        0% {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          box-shadow: none;
          transform: scale(1);
        }
        20%, 65% {
          background: rgba(245, 158, 11, 0.85);
          border-color: #f59e0b;
          color: #ffffff;
          box-shadow: 0 0 25px #f59e0b, inset 0 0 10px #f59e0b;
          transform: scale(1.06);
        }
        100% {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          box-shadow: none;
          transform: scale(1);
        }
      }
 
      /* Allocation Animations */
      .cell-wrapper.animate-add, .output-cell.animate-add {
        animation: allocate-pulse 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      @keyframes allocate-pulse {
        from {
          opacity: 0;
          transform: scale(0.8);
          box-shadow: 0 0 20px rgba(20, 184, 166, 0.8);
          background: rgba(20, 184, 166, 0.3);
          border-color: #14b8a6;
        }
        50% {
          opacity: 0.8;
          transform: scale(1.08);
          box-shadow: 0 0 25px rgba(20, 184, 166, 0.9);
          background: rgba(20, 184, 166, 0.4);
          border-color: #14b8a6;
        }
        to {
          opacity: 1;
          transform: scale(1);
          box-shadow: none;
        }
      }
 
      .visualizer-cell {
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Fira Code', monospace;
        font-size: 0.725rem;
        font-weight: 500;
        border-radius: 6px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
      }
      .input-cell {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #e2e8f0;
        text-align: center;
        width: 100%;
        padding: 0;
      }
      .input-cell:focus {
        outline: none;
        border-color: #14b8a6;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25);
        background: rgba(15, 23, 42, 0.9);
      }
      .input-cell:hover {
        border-color: rgba(20, 184, 166, 0.4);
      }
      .output-cell {
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(20, 184, 166, 0.1);
        color: #14b8a6;
        transition: outline 0.2s ease, transform 0.25s ease, filter 0.25s ease, background 0.25s ease;
      }
      .panel-hint {
        font-size: 0.7rem;
        color: #64748b;
        text-align: center;
        margin-top: auto;
        padding-top: 8px;
      }
      .mutated-glow {
        background: rgba(20, 184, 166, 0.3) !important;
        border-color: #14b8a6 !important;
        color: #fff !important;
        box-shadow: 0 0 12px rgba(20, 184, 166, 0.6);
        transform: scale(1.05);
      }
      
      /* Fallback Styles */
      .visualizer-fallback {
        background: #0f172a;
        border: 1px solid #dc2626;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }
      .fallback-banner {
        color: #ef4444;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .fallback-grid-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .fallback-grid h4 {
        margin: 0 0 8px 0;
        font-size: 0.75rem;
        color: #94a3b8;
      }
      .cells-row {
        display: flex;
        gap: 6px;
        overflow-x: auto;
      }
      .cell {
        min-width: 45px;
        height: 36px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-size: 0.8rem;
      }
      .fallback-input {
        background: rgba(30, 41, 59, 0.5);
        color: #cbd5e1;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .fallback-output {
        background: rgba(20, 184, 166, 0.1);
        color: #14b8a6;
        border: 1px solid rgba(20, 184, 166, 0.2);
      }
    `,(`appendChild`in t?t:document.head).appendChild(n)}async build(r){if(!this.device)throw new e(`WebGPU device not initialized`);let i=this.options.length,a=i*4,o=this.device.createBuffer({size:a,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),s=this.device.createBuffer({size:a,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),c=this.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),l=this.device.createShaderModule({code:r}),u=await l.getCompilationInfo();if(u.messages.some(e=>e.type===`error`))throw new t(u.messages.map(e=>({line:e.lineNum,column:e.linePos,length:e.length,msg:e.message,kind:e.type})));let d=this.device.createComputePipeline({layout:`auto`,compute:{module:l,entryPoint:`main`}}),f=this.device.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}},{binding:1,resource:{buffer:s}}]});return new n(this.device,this.outputContainer,i,this.options.datatype,d,o,s,c,f)}};export{n as BufferViewer,r as default};