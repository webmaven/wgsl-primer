/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

/**
 * Copyright 2023 The Tour of WGSL Authors
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

import VisualizerBuilder, { CompilationFailure, VisualizerError, Visualizer } from './visualizer';
import WGSLDocs from './wgsl-docs';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { hoverTooltip, keymap, activateHover, closeHoverTooltip } from '@codemirror/view';
import { wgsl } from '@iizukak/codemirror-lang-wgsl';
import { syntaxTree, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { lintGutter, setDiagnostics, Diagnostic } from '@codemirror/lint';

export class WGSLTour extends HTMLElement {
  visualization: Visualizer | undefined = undefined;
  visualizationBuilder: VisualizerBuilder | undefined = undefined;
  bootstrap: string = '';
  editor!: EditorView;
  output!: HTMLElement;
  innerOutput!: HTMLElement;
  errorOutput!: HTMLElement;
  statusIndicator!: HTMLElement;
  frame_number: number = 0;
  key_timer: ReturnType<typeof setTimeout> | undefined = undefined;
  autorun: boolean = true;
  themeObserver: MutationObserver | undefined = undefined;
  animationPaused: boolean = false;
  mobileRevealTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  animationFrameId: number | undefined = undefined;
  globalKeyDownHandler: ((event: KeyboardEvent) => void) | undefined = undefined;

  constructor() {
    super();
  }

  disconnectedCallback() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    if (this.globalKeyDownHandler) {
      window.removeEventListener('keydown', this.globalKeyDownHandler);
    }
  }

  connectedCallback() {
    const savedAutorun = localStorage.getItem('wgsl-tour-autorun');
    if (savedAutorun !== null) {
      this.autorun = savedAutorun === 'true';
    }

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: var(--md-text-font-family, inherit);

        /* Default / Light Theme Color Tokens */
        --cm-bg: var(--md-code-bg-color, #f8fafc);
        --cm-fg: var(--md-code-fg-color, #0f172a);
        --cm-gutter-bg: var(--md-code-bg-color, #f8fafc);
        --cm-gutter-fg: #64748b;
        --cm-active-line-bg: rgba(0, 0, 0, 0.03);
        --cm-active-line-gutter-bg: rgba(0, 0, 0, 0.01);
        --cm-cursor: #0f172a;
        --cm-selection: rgba(59, 130, 246, 0.2);
        --cm-matching-bracket: rgba(16, 185, 129, 0.25);

        --cm-keyword: #7c3aed;       /* Purple */
        --cm-type: #0284c7;          /* Sky Blue */
        --cm-number: #0d9488;        /* Teal */
        --cm-string: #16a34a;        /* Green */
        --cm-comment: #94a3b8;       /* Slate Grey */
        --cm-variable: #0f172a;      /* Dark Slate */
        --cm-function: #2563eb;      /* Blue */
        --cm-operator: #475569;      /* Medium Slate */
        --cm-attribute: #b45309;     /* Amber */
      }
      .editor-container.dark {
        /* Dark Theme Color Tokens */
        --cm-bg: var(--md-code-bg-color, #1e293b);
        --cm-fg: var(--md-code-fg-color, #cbd5e1);
        --cm-gutter-bg: var(--md-code-bg-color, #1e293b);
        --cm-gutter-fg: #64748b;
        --cm-active-line-bg: rgba(255, 255, 255, 0.05);
        --cm-active-line-gutter-bg: rgba(255, 255, 255, 0.02);
        --cm-cursor: #f8fafc;
        --cm-selection: rgba(59, 130, 246, 0.35);
        --cm-matching-bracket: rgba(45, 212, 191, 0.35);

        --cm-keyword: #c084fc;       /* Vibrant Purple */
        --cm-type: #38bdf8;          /* Radiant Sky Blue */
        --cm-number: #2dd4bf;        /* Bright Teal */
        --cm-string: #4ade80;        /* Light Green */
        --cm-comment: #64748b;       /* Medium Slate */
        --cm-variable: #e2e8f0;      /* Silver-White */
        --cm-function: #60a5fa;      /* Light Blue */
        --cm-operator: #94a3b8;      /* Soft Slate */
        --cm-attribute: #fb923c;     /* Bright Orange */
      }
      h2 {
        font-family: var(--md-text-font-family, inherit);
        font-size: 1.05rem;
        margin-top: 4px;
        margin-bottom: 8px;
        color: var(--md-default-fg-color, #0f172a);
        font-weight: 600;
        flex: none;
      }
      canvas,
      #wgsl-tour-output-canvas {
        width: 100%;
        max-width: 640px;
        aspect-ratio: 1 / 1;
        height: auto !important;
        margin-top: 10px;
        display: block;
      }
      #wgsl-tour-output-text {
        width: 100%;
        max-width: 640px;
        margin-top: 10px;
        margin-bottom: 0;
        display: block;
        font-size: var(--md-code-font-size, 0.85em);
      }
      .editor-container {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .editor-container.short-code .cm-editor {
        height: auto !important;
      }
      #canvas {
        display: flex;
        justify-content: center;
        align-items: start;
        position: relative;
      }
      .cm-editor {
        border: 1px solid var(--md-default-fg-color--lite, #e2e8f0);
        height: 260px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        font-size: var(--md-code-font-size, 0.85em);
      }
      .wgsl-tooltip {
        border-radius: 5px;
        margin: 0;
        margin-left: 2px;
        padding: 4px;
        border: 1px solid #14b8a6;
        overflow: auto;
        background-color: var(--md-code-bg-color, #f8fafc);
        color: var(--md-code-fg-color, #0f172a);
      }
      .controls-container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin: 0;
        padding: 6px 12px;
        background-color: var(--md-code-bg-color, #f8fafc);
        border: 1px solid var(--md-default-fg-color--lite, #e2e8f0);
        border-top: none;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
        box-sizing: border-box;
      }
      .run-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background-color: #3b82f6;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        padding: 4px 12px;
        height: 28px;
        box-sizing: border-box;
        font-family: var(--md-text-font-family, inherit);
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
      }
      .run-button:hover {
        background-color: #2563eb;
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.35);
        transform: translateY(-1px);
      }
      .run-button:active {
        transform: translateY(1px);
        box-shadow: 0 1px 2px rgba(59, 130, 246, 0.15);
      }
      .run-button:disabled {
        background-color: var(--md-default-fg-color--lite, #cbd5e1);
        color: var(--md-default-fg-color--light, #94a3b8);
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
        pointer-events: none;
      }
      .run-icon {
        width: 12px;
        height: 12px;
        fill: currentColor;
        transition: transform 0.2s ease;
      }
      .run-button:hover .run-icon {
        transform: scale(1.1);
      }
      .switch-container {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
        font-family: var(--md-text-font-family, inherit);
        font-size: 0.8em;
        font-weight: 500;
        color: var(--md-default-fg-color--light, #64748b);
      }
      .switch-container input {
        display: none;
      }
      .switch-slider {
        position: relative;
        width: 32px;
        height: 18px;
        background-color: var(--md-default-fg-color--lightest, #cbd5e1);
        border-radius: 9px;
        transition: background-color 0.2s ease;
      }
      .switch-slider::before {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        left: 2px;
        bottom: 2px;
        background-color: #ffffff;
        border-radius: 50%;
        transition: transform 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }
      .switch-container input:checked + .switch-slider {
        background-color: #10b981;
      }
      .switch-container input:checked + .switch-slider::before {
        transform: translateX(14px);
      }
      .control-divider {
        width: 1px;
        height: 18px;
        background-color: var(--md-default-fg-color--lightest, #cbd5e1);
      }
      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--md-text-font-family, inherit);
        font-size: 0.8em;
        font-weight: 500;
        color: var(--md-default-fg-color--light, #64748b);
        user-select: none;
      }
      .status-dot {
        position: relative;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #64748b;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
      }
      .status-dot.ready {
        background-color: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      }
      .status-dot.compiling {
        background-color: #3b82f6;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        animation: status-pulse 1s infinite alternate;
      }
      .status-dot.success {
        background-color: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      }
      .status-dot.error {
        background-color: #ef4444;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
      }
      .status-dot.paused {
        background-color: #f59e0b;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
      }
      @keyframes status-pulse {
        from {
          opacity: 0.4;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1.1);
        }
      }

      #output::-webkit-scrollbar,
      #wgsl-tour-output-text::-webkit-scrollbar,
      .buffer-viewer-wrapper::-webkit-scrollbar,
      .workgroup-visualizer-wrapper::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      #output::-webkit-scrollbar-track,
      #wgsl-tour-output-text::-webkit-scrollbar-track,
      .buffer-viewer-wrapper::-webkit-scrollbar-track,
      .workgroup-visualizer-wrapper::-webkit-scrollbar-track {
        background: transparent;
      }
      #output::-webkit-scrollbar-thumb,
      #wgsl-tour-output-text::-webkit-scrollbar-thumb,
      .buffer-viewer-wrapper::-webkit-scrollbar-thumb,
      .workgroup-visualizer-wrapper::-webkit-scrollbar-thumb {
        background-color: var(--md-default-fg-color--lightest, #cbd5e1);
        border-radius: 3px;
      }

      #inner-output,
      #error-output {
        width: 100%;
        box-sizing: border-box;
      }
      #inner-output {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: start;
        flex: 1 1 0%;
        min-height: 0;
      }

      .desktop-only {
        display: none !important;
      }

      /* Play/Pause Control Overlay on Canvas */
      .animation-control-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0);
        cursor: pointer;
        transition: background-color 0.25s ease;
        z-index: 10;
        -webkit-tap-highlight-color: transparent;
      }
      
      .animation-control-overlay:hover,
      .animation-control-overlay.user-revealed {
        background: rgba(0, 0, 0, 0.2);
      }
      
      .animation-play-pause-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, border-color 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        pointer-events: none; /* Let overlay handle clicks */
        padding: 0;
        margin: 0;
        outline: none;
        cursor: pointer;
      }
      
      /* On hover or user revealed (for touch devices), show the button */
      .animation-control-overlay:hover .animation-play-pause-btn,
      .animation-control-overlay.user-revealed .animation-play-pause-btn {
        opacity: 1;
        transform: scale(1);
      }
      
      .animation-play-pause-btn:hover {
        background: rgba(15, 23, 42, 0.85);
        border-color: rgba(255, 255, 255, 0.4);
      }
      
      .animation-play-pause-btn svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
        transition: transform 0.2s ease;
      }
      
      /* When animation is paused, overlay keeps a slight dim and always displays play button */
      #canvas.paused .animation-control-overlay {
        background: rgba(0, 0, 0, 0.25);
      }
      
      #canvas.paused .animation-play-pause-btn {
        opacity: 1;
        transform: scale(1);
        background: rgba(15, 23, 42, 0.8);
      }

      /* By default, we are playing, so show the pause icon, hide the play icon */
      .animation-play-pause-btn .icon-play {
        display: none;
      }
      .animation-play-pause-btn .icon-pause {
        display: block;
      }

      /* When paused, show play, hide pause */
      #canvas.paused .animation-play-pause-btn .icon-play {
        display: block;
        margin-left: 2px; /* Offset asymmetric play triangle visually */
      }
      #canvas.paused .animation-play-pause-btn .icon-pause {
        display: none;
      }

      @media (min-width: 1200px) {
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          gap: 0;
        }
        .desktop-only {
          display: block !important;
        }
        .desktop-only.control-divider {
          display: block !important;
          margin-left: auto;
        }
        .layout-toggle-group.desktop-only {
          display: inline-flex !important;
        }
        .layout-toggle-group {
          border: 1px solid var(--md-default-fg-color--lite, #e2e8f0);
          border-radius: 6px;
          overflow: hidden;
          background-color: var(--md-default-bg-color, #ffffff);
          padding: 2px;
          align-items: center;
        }
        .layout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 24px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--md-default-fg-color--light, #64748b);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }
        .layout-btn:hover {
          color: var(--md-default-fg-color, #0f172a);
          background-color: var(--md-default-fg-color--lightest, #f1f5f9);
        }
        .layout-btn.active {
          color: #0ea5e9;
          background-color: rgba(14, 165, 233, 0.1);
        }
        .layout-icon {
          width: 14px;
          height: 14px;
        }

        .editor-container {
          flex: 1 1 0%;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          min-height: 0;
        }
        :host(.has-output) .editor-container {
          flex: 1 1 0%;
        }
        :host(.has-output) .editor-container.expanded {
          flex: 0 1 auto !important;
          height: auto !important;
          min-height: 50% !important;
          max-height: calc(100% - 320px) !important;
        }
        :host(.has-output) .editor-container.collapsed {
          flex: 0 0 auto !important;
          height: 110px !important;
        }
        :host(.has-output) .editor-container.short-code {
          flex: 0 0 auto !important;
          height: auto !important;
        }
        :host(.has-output) .editor-container.short-code .cm-editor {
          height: auto !important;
        }
        :host(.has-output) .editor-container.short-code .layout-toggle-group,
        :host(.has-output) .editor-container.short-code .desktop-only {
          display: none !important;
        }
        .cm-editor {
          height: 100% !important;
          flex: 1 1 auto;
          min-height: 0;
        }
        :host(.has-output) .editor-container.expanded .cm-editor {
          height: 100% !important;
        }
        :host(.has-output) .editor-container.collapsed .cm-editor {
          height: 100% !important;
        }
        .controls-container {
          box-sizing: border-box;
          flex: none;
        }
        #output {
          display: none !important;
        }
        :host(.has-output) #output {
          display: flex !important;
          flex: 1 1 0%;
          height: auto !important;
          min-height: 0;
          flex-direction: column;
          align-items: stretch;
          justify-content: start;
          width: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        #canvas {
          height: 100%;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 0;
          margin-top: 0;
          position: relative;
        }
        canvas,
        #wgsl-tour-output-canvas {
          width: auto !important;
          height: auto !important;
          max-width: 100% !important;
          max-height: 100% !important;
          aspect-ratio: 1 / 1 !important;
          margin-top: 0 !important;
          object-fit: contain;
        }
        #wgsl-tour-output-text {
          width: 100% !important;
          flex: 1 1 0%;
          min-height: 0;
          height: auto !important;
          margin-top: 0 !important;
          overflow: auto;
          box-sizing: border-box;
        }
        .buffer-viewer-wrapper,
        .workgroup-visualizer-wrapper,
        .pointer-vis-wrapper {
          width: 100%;
          box-sizing: border-box;
          margin-top: 0 !important;
          flex-shrink: 0 !important;
        }
      }
    `;
    shadow.appendChild(style);

    const editorContainer = document.createElement('div');
    editorContainer.className = 'editor-container';
    shadow.appendChild(editorContainer);

    this.output = document.createElement('div');
    this.output.setAttribute('id', 'output');
    shadow.appendChild(this.output);

    this.innerOutput = document.createElement('div');
    this.innerOutput.setAttribute('id', 'inner-output');
    this.innerOutput.style.display = 'block';
    this.output.appendChild(this.innerOutput);

    this.errorOutput = document.createElement('div');
    this.errorOutput.setAttribute('id', 'error-output');
    this.errorOutput.style.display = 'none';
    this.output.appendChild(this.errorOutput);

    // Theme synchronization with body[data-md-color-scheme]
    const updateTheme = () => {
      const isDark = document.body.getAttribute('data-md-color-scheme') === 'slate';
      if (isDark) {
        editorContainer.classList.add('dark');
      } else {
        editorContainer.classList.remove('dark');
      }
    };
    updateTheme();

    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-md-color-scheme') {
          updateTheme();
        }
      });
    });
    this.themeObserver.observe(document.body, { attributes: true });

    const pre = this.querySelector('#tour-content');
    const code = (pre ? pre.textContent : this.textContent) || '';

    const rebuild = () => {
      this.frame_number = 0;
      if (this.visualizationBuilder) {
        this.buildVisualization();
      }
    };

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    const runButton = document.createElement('button');
    runButton.className = 'run-button';
    runButton.setAttribute('title', 'Manually run and compile code');
    runButton.innerHTML = `
      <svg class="run-icon" viewBox="0 0 24 24">
        <polygon points="5,3 19,12 5,21"></polygon>
      </svg>
      <span>Run</span>
    `;

    const liveUpdatesLabel = document.createElement('label');
    liveUpdatesLabel.className = 'switch-container';
    liveUpdatesLabel.setAttribute('title', 'Compile and run code automatically as you type');
    liveUpdatesLabel.innerHTML = `
      <input type="checkbox" id="live-updates-toggle">
      <span class="switch-slider"></span>
      <span class="switch-label">Live Updates</span>
    `;
    const liveUpdatesToggle = liveUpdatesLabel.querySelector('input') as HTMLInputElement;
    liveUpdatesToggle.checked = this.autorun;
    runButton.disabled = this.autorun;

    const controlDivider1 = document.createElement('div');
    controlDivider1.className = 'control-divider';

    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator';
    statusIndicator.innerHTML =
      '<span class="status-dot ready"></span><span class="status-label">Ready</span>';
    this.statusIndicator = statusIndicator;

    const layoutDivider = document.createElement('div');
    layoutDivider.className = 'control-divider desktop-only';

    const layoutGroup = document.createElement('div');
    layoutGroup.className = 'layout-toggle-group desktop-only';
    layoutGroup.innerHTML = `
      <button class="layout-btn layout-btn-minimize" title="Minimize Editor (Maximize Output)" aria-label="Minimize Editor">
        <svg class="layout-icon" viewBox="0 0 24 24">
          <rect x="3" y="14" width="18" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="2"></rect>
          <rect x="3" y="4" width="18" height="8" rx="1" fill="currentColor" opacity="0.3"></rect>
        </svg>
      </button>
      <button class="layout-btn layout-btn-split active" title="Split View" aria-label="Split View">
        <svg class="layout-icon" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="7" rx="1" fill="currentColor" opacity="0.3"></rect>
          <rect x="3" y="13" width="18" height="7" rx="1" fill="currentColor" opacity="0.3"></rect>
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"></line>
        </svg>
      </button>
      <button class="layout-btn layout-btn-maximize" title="Maximize Editor" aria-label="Maximize Editor">
        <svg class="layout-icon" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="12" rx="1" fill="currentColor"></rect>
          <rect x="3" y="18" width="18" height="2" rx="0.5" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"></rect>
        </svg>
      </button>
    `;

    const btnMinimize = layoutGroup.querySelector('.layout-btn-minimize') as HTMLButtonElement;
    const btnSplit = layoutGroup.querySelector('.layout-btn-split') as HTMLButtonElement;
    const btnMaximize = layoutGroup.querySelector('.layout-btn-maximize') as HTMLButtonElement;

    const updateActiveLayoutButton = (activeBtn: HTMLButtonElement) => {
      [btnMinimize, btnSplit, btnMaximize].forEach((btn) => btn.classList.remove('active'));
      activeBtn.classList.add('active');
    };

    btnMinimize.addEventListener('click', () => {
      editorContainer.classList.remove('expanded');
      editorContainer.classList.add('collapsed');
      updateActiveLayoutButton(btnMinimize);
      this.editor.requestMeasure();
    });

    btnSplit.addEventListener('click', () => {
      editorContainer.classList.remove('expanded', 'collapsed');
      updateActiveLayoutButton(btnSplit);
      this.editor.requestMeasure();
    });

    btnMaximize.addEventListener('click', () => {
      editorContainer.classList.add('expanded');
      editorContainer.classList.remove('collapsed');
      updateActiveLayoutButton(btnMaximize);
      this.editor.requestMeasure();
    });

    controlsContainer.appendChild(runButton);
    controlsContainer.appendChild(liveUpdatesLabel);
    controlsContainer.appendChild(controlDivider1);
    controlsContainer.appendChild(statusIndicator);
    controlsContainer.appendChild(layoutDivider);
    controlsContainer.appendChild(layoutGroup);

    runButton.addEventListener('click', () => {
      rebuild();
    });

    liveUpdatesToggle.addEventListener('change', () => {
      this.autorun = liveUpdatesToggle.checked;
      runButton.disabled = this.autorun;
      localStorage.setItem('wgsl-tour-autorun', String(this.autorun));
      if (this.autorun) {
        rebuild();
      } else {
        if (this.key_timer !== undefined) {
          clearTimeout(this.key_timer);
          this.key_timer = undefined;
        }
        this.updateStatus('paused', 'Paused');
      }
    });

    const docsTooltip = hoverTooltip(
      (view, pos, side) => {
        const tree = syntaxTree(view.state);

        // Try resolving with the provided side
        let token = tree.resolveInner(pos, side);
        let text = view.state.sliceDoc(token.from, token.to);
        let docs = WGSLDocs.getDocsFor(text, token.name);

        // Fallback for keyboard activation when the cursor is at word boundaries (try opposite side)
        if (!docs) {
          token = tree.resolveInner(pos, -side as -1 | 1);
          text = view.state.sliceDoc(token.from, token.to);
          docs = WGSLDocs.getDocsFor(text, token.name);
        }

        // Additional fallback if cursor is immediately after a word (try pos - 1)
        if (!docs && pos > 0) {
          token = tree.resolveInner(pos - 1, -1);
          text = view.state.sliceDoc(token.from, token.to);
          docs = WGSLDocs.getDocsFor(text, token.name);
        }

        if (!docs) return null;

        return {
          pos: token.from,
          end: token.to,
          above: true,
          create() {
            const dom = document.createElement('div');
            dom.className = 'wgsl-tooltip';
            dom.innerHTML = `<pre>${docs}</pre>`;
            return { dom };
          },
        };
      },
      {
        hideOnChange: true,
      }
    );

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (this.key_timer !== undefined) {
          clearTimeout(this.key_timer);
          this.key_timer = undefined;
        }
        if (this.autorun) {
          this.key_timer = setTimeout(rebuild, 1000);
        } else {
          this.updateStatus('paused', 'Paused');
        }

        // Dynamically toggle short-code class based on current line count
        const currentLines = update.state.doc.lines;
        if (currentLines <= 10) {
          editorContainer.classList.add('short-code');
        } else {
          editorContainer.classList.remove('short-code');
        }
      }
    });

    const docsKeymap = keymap.of([
      {
        key: 'Ctrl-o',
        run: (view) => {
          const pos = view.state.selection.main.head;
          activateHover(view, pos, 1);
          return true;
        },
        preventDefault: true,
      },
      {
        key: 'Cmd-o',
        run: (view) => {
          const pos = view.state.selection.main.head;
          activateHover(view, pos, 1);
          return true;
        },
        preventDefault: true,
      },
    ]);

    const domHandlers = EditorView.domEventHandlers({
      blur: (event, view) => {
        view.dispatch({
          effects: closeHoverTooltip(docsTooltip),
        });
      },
      keydown: (event, view) => {
        if (event.key === 'Escape') {
          view.dispatch({
            effects: closeHoverTooltip(docsTooltip),
          });
        }
      },
    });

    this.globalKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.editor.dispatch({
          effects: closeHoverTooltip(docsTooltip),
        });
      }
    };
    window.addEventListener('keydown', this.globalKeyDownHandler);

    const customTheme = EditorView.theme({
      '&': {
        backgroundColor: 'var(--cm-bg)',
        color: 'var(--cm-fg)',
      },
      '.cm-content': {
        caretColor: 'var(--cm-cursor)',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--cm-cursor)',
      },
      '.cm-scroller': {
        fontFamily: 'var(--md-code-font-family), monospace',
        fontSize: 'inherit',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--cm-gutter-bg)',
        color: 'var(--cm-gutter-fg)',
        borderRight: '1px solid var(--md-default-fg-color--lite, #e2e8f0)',
      },
      '.cm-activeLine': {
        backgroundColor: 'var(--cm-active-line-bg)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--cm-active-line-gutter-bg)',
      },
      '&.cm-focused .cm-matchingBracket': {
        backgroundColor: 'var(--cm-matching-bracket)',
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--cm-selection) !important',
      },
    });

    const customHighlight = HighlightStyle.define([
      { tag: t.keyword, color: 'var(--cm-keyword)', fontWeight: 'bold' },
      { tag: t.typeName, color: 'var(--cm-type)' },
      { tag: t.number, color: 'var(--cm-number)' },
      { tag: t.string, color: 'var(--cm-string)' },
      { tag: t.comment, color: 'var(--cm-comment)', fontStyle: 'italic' },
      { tag: t.variableName, color: 'var(--cm-variable)' },
      { tag: t.function(t.variableName), color: 'var(--cm-function)' },
      { tag: t.operator, color: 'var(--cm-operator)' },
      { tag: t.punctuation, color: 'var(--cm-operator)' },
      { tag: t.attributeName, color: 'var(--cm-attribute)', fontWeight: '500' },
    ]);

    this.editor = new EditorView({
      doc: code,
      extensions: [
        basicSetup,
        wgsl(),
        lintGutter(),
        docsTooltip,
        updateListener,
        docsKeymap,
        domHandlers,
        customTheme,
        syntaxHighlighting(customHighlight),
      ],
      parent: editorContainer,
    });

    editorContainer.appendChild(controlsContainer);

    // Initial short-code class assignment based on line count
    if (this.editor.state.doc.lines <= 10) {
      editorContainer.classList.add('short-code');
    }
  }

  setBootstrap(src: string) {
    this.bootstrap = src;
  }

  async setVisualizationBuilder(val: VisualizerBuilder) {
    this.visualizationBuilder = val;
    try {
      if (!navigator.gpu) {
        throw new VisualizerError('WebGPU is not supported in this browser');
      }
      this.innerOutput.innerHTML = '';
      await this.visualizationBuilder.configure(this.innerOutput);
      this.setupPlayPauseOverlay();
    } catch (e: any) {
      this.onPipelineFailure({ message: e.message || e.toString() } as VisualizerError);
      return false;
    }

    if (this.innerOutput.children.length > 0) {
      this.classList.add('has-output');
    } else {
      this.classList.remove('has-output');
    }

    this.buildVisualization();
    return true;
  }

  setupPlayPauseOverlay() {
    const canvasWrapper = this.innerOutput.querySelector('#canvas');
    if (!canvasWrapper) return;

    if (canvasWrapper.querySelector('.animation-control-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'animation-control-overlay';
    overlay.innerHTML = `
      <button class="animation-play-pause-btn" aria-label="Play/Pause Animation">
        <svg class="icon-play" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"></polygon></svg>
        <svg class="icon-pause" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      </button>
    `;

    canvasWrapper.appendChild(overlay);

    const toggle = (e: Event) => {
      e.stopPropagation();
      this.togglePlayPause();
    };

    canvasWrapper.addEventListener('click', toggle);

    const btn = overlay.querySelector('.animation-play-pause-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlayPause();
      });
    }
  }

  togglePlayPause() {
    if (this.visualization === undefined || this.visualization.executeFrequency !== 'repeat')
      return;

    const canvasWrapper = this.innerOutput.querySelector('#canvas');
    const overlay = canvasWrapper?.querySelector('.animation-control-overlay');
    if (!canvasWrapper || !overlay) return;

    this.animationPaused = !this.animationPaused;

    if (this.animationPaused) {
      canvasWrapper.classList.add('paused');
      overlay.classList.remove('user-revealed');
      if (this.mobileRevealTimeout) {
        clearTimeout(this.mobileRevealTimeout);
        this.mobileRevealTimeout = undefined;
      }
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = undefined;
      }
    } else {
      canvasWrapper.classList.remove('paused');
      overlay.classList.add('user-revealed');
      if (this.mobileRevealTimeout) {
        clearTimeout(this.mobileRevealTimeout);
      }
      this.mobileRevealTimeout = setTimeout(() => {
        overlay.classList.remove('user-revealed');
        this.mobileRevealTimeout = undefined;
      }, 1500);

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = requestAnimationFrame(() => this.frame());
    }
  }

  updateStatus(state: 'compiling' | 'success' | 'error' | 'ready' | 'paused', text: string) {
    if (!this.statusIndicator) return;
    const dot = this.statusIndicator.querySelector('.status-dot');
    const label = this.statusIndicator.querySelector('.status-label');
    if (dot && label) {
      dot.className = `status-dot ${state}`;
      label.textContent = text;
    }
  }

  buildVisualization() {
    if (!this.visualizationBuilder) return;

    this.editor.dispatch(setDiagnostics(this.editor.state, []));
    this.visualization = undefined;
    this.updateStatus('compiling', 'Compiling...');

    this.visualizationBuilder
      .build(this.editor.state.doc.toString() + this.bootstrap)
      .then((visualization) => {
        this.visualization = visualization;
        if (this.autorun) {
          this.updateStatus('success', 'Live');
        } else {
          this.updateStatus('paused', 'Paused');
        }

        // Clean error outputs and restore inner output
        this.errorOutput.style.display = 'none';
        this.errorOutput.innerHTML = '';
        this.innerOutput.style.display = '';

        // Reset play/pause state for a fresh compile
        this.animationPaused = false;
        const canvasWrapper = this.innerOutput.querySelector('#canvas');
        if (canvasWrapper) {
          canvasWrapper.classList.remove('paused');
          const overlay = canvasWrapper.querySelector('.animation-control-overlay');
          if (overlay) {
            overlay.classList.remove('user-revealed');
          }
        }

        if (this.innerOutput.children.length > 0) {
          this.classList.add('has-output');
        } else {
          this.classList.remove('has-output');
        }

        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => this.frame());
      })
      .catch((err: any) => {
        // Hide inner visualization output and expose error diagnostics container
        this.innerOutput.style.display = 'none';
        this.errorOutput.style.display = '';
        this.classList.add('has-output');

        if (err.hasOwnProperty('diagnostics')) {
          this.updateStatus('error', 'Compilation Error');
          this.onCompilationFailure(err as CompilationFailure);
          const rendered = this.renderAliasingCollisionDiagram(err as CompilationFailure);
          if (!rendered) {
            this.renderGenericCompilationError(err as CompilationFailure);
          }
        } else if (err.hasOwnProperty('visualizer_error') || err.message) {
          this.updateStatus('error', 'Pipeline Error');
          const visualizerErr = err.hasOwnProperty('visualizer_error')
            ? (err as VisualizerError)
            : ({ message: err.message || err.toString() } as VisualizerError);
          this.onPipelineFailure(visualizerErr);
          this.renderPipelineError(visualizerErr);
        } else {
          this.updateStatus('error', 'Error');
          const msg = err && err.message ? err.message : String(err);
          const fallbackErr = { message: msg } as VisualizerError;
          this.onPipelineFailure(fallbackErr);
          this.renderPipelineError(fallbackErr);
          console.log(err);
        }
      });
  }

  frame() {
    if (this.visualization === undefined) return;
    if (this.animationPaused) return;

    this.frame_number++;
    this.visualization.execute(this.frame_number);

    if (this.visualization.executeFrequency === 'repeat') {
      this.animationFrameId = requestAnimationFrame(() => this.frame());
    }
  }

  onCompilationFailure(failure: CompilationFailure) {
    const diagnostics: Diagnostic[] = failure.diagnostics.map((diag) => {
      const lineInfo = this.editor.state.doc.line(diag.line);
      const from = lineInfo.from + Math.max(0, diag.column - 1);
      const to = Math.min(from + (diag.length || 1), lineInfo.to);
      return {
        from,
        to,
        severity: diag.kind === 'error' ? 'error' : 'warning',
        message: diag.msg,
      };
    });
    this.editor.dispatch(setDiagnostics(this.editor.state, diagnostics));
  }

  onPipelineFailure(failure: VisualizerError) {
    const diag: Diagnostic = {
      from: 0,
      to: 0,
      severity: 'error',
      message: failure.message,
    };
    this.editor.dispatch(setDiagnostics(this.editor.state, [diag]));
  }

  renderAliasingCollisionDiagram(failure: CompilationFailure): boolean {
    // 1. Scan for aliasing errors
    const aliasingDiag = failure.diagnostics.find((d) =>
      /alias|aliasing|overlapping|two views|same root|conflicting access/i.test(d.msg)
    );

    if (!aliasingDiag) return false;

    // 2. Try to extract variable name or function name
    let rootVar = 'root_variable';
    const varMatch = aliasingDiag.msg.match(
      /view[s]? of '([^']+)'|view[s]? of ([a-zA-Z_][a-zA-Z0-9_]*)|root identifier '([^']+)'|root ([a-zA-Z_][a-zA-Z0-9_]*)/i
    );
    if (varMatch) {
      rootVar = varMatch[1] || varMatch[2] || varMatch[3] || varMatch[4];
    }

    // 3. Render the card to this.errorOutput
    this.errorOutput.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 24px; font-family: var(--md-text-font-family, sans-serif); color: #cbd5e1; margin-top: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 640px; margin-left: auto; margin-right: auto; box-sizing: border-box; overflow: hidden; position: relative;">
        <!-- Glowing Red background effect -->
        <div style="position: absolute; top: -100px; left: -100px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none; border-radius: 50%;"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(239, 68, 68, 0.15); padding-bottom: 12px;">
          <svg style="width: 24px; height: 24px; fill: #ef4444; flex-shrink: 0;" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3 style="color: #ef4444; font-weight: 700; font-size: 16px; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
            Compile-Time Aliasing Hazard Detected
          </h3>
        </div>

        <p style="font-size: 13.5px; line-height: 1.6; color: #94a3b8; margin: 0; margin-bottom: 20px;">
          The GPU compiler blocked shader creation because multiple overlapping views were passed to a function call where at least one view is used for a potential write.
        </p>

        <!-- Overlapping Path Diagram -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-around; width: 100%; font-size: 11px; font-family: monospace;">
            <div style="color: #ef4444; border: 1.5px solid rgba(239, 68, 68, 0.4); padding: 5px 10px; border-radius: 6px; background: rgba(239, 68, 68, 0.08); font-weight: 700; box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);">
              View 1: Pointer (Write)
            </div>
            <div style="color: #38bdf8; border: 1.5px solid rgba(56, 189, 248, 0.4); padding: 5px 10px; border-radius: 6px; background: rgba(56, 189, 248, 0.08); font-weight: 700;">
              View 2: Pointer/Ref (Read)
            </div>
          </div>

          <div style="height: 60px; display: flex; justify-content: center; align-items: center; position: relative; width: 100%;">
            <svg style="width: 100%; height: 100%;" viewBox="0 0 300 60">
              <defs>
                <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ef4444" />
                  <stop offset="100%" stop-color="#7f1d1d" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path d="M 75,5 L 150,55" stroke="#ef4444" stroke-width="2" stroke-dasharray="3 3" />
              <path d="M 225,5 L 150,55" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3 3" />
              
              <circle cx="150" cy="30" r="16" fill="url(#redGrad)" opacity="0.6" filter="url(#glow)">
                <animate attributeName="r" values="8;20;8" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
              </circle>
              
              <circle cx="150" cy="30" r="8" fill="#ef4444" />
              <text x="150" y="34" fill="#ffffff" font-size="12px" font-weight="900" text-anchor="middle">!</text>
            </svg>
          </div>

          <div style="border: 2px solid #ef4444; border-radius: 6px; background: rgba(239, 68, 68, 0.15); padding: 8px 16px; font-family: monospace; font-size: 13px; font-weight: 700; color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); text-align: center;">
            Shared Root Memory: ${rootVar}
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 16px; font-size: 12.5px; line-height: 1.6;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 8px;">💡 Compiler Diagnostic:</strong>
          <div style="font-family: monospace; color: #ef4444; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 12px; white-space: pre-wrap; word-break: break-all;">${aliasingDiag.msg}</div>
          <strong style="color: #10b981; display: block; margin-top: 12px; margin-bottom: 8px;">🛠️ Resolving the Hazard:</strong>
          <ul style="margin: 0; padding-left: 20px; color: #94a3b8; display: flex; flex-direction: column; gap: 6px;">
            <li>Pass completely disjoint variables (separate allocations) as arguments.</li>
            <li>If modifying a single module-scope variable, do not pass its pointer parameter as an argument.</li>
            <li>Store the read value in a local thread register variable first, then perform the write operation.</li>
          </ul>
        </div>
      </div>
    `;
    return true;
  }

  renderGenericCompilationError(failure: CompilationFailure): void {
    const errorCount = failure.diagnostics.filter((d) => d.kind === 'error').length;
    const warningCount = failure.diagnostics.filter((d) => d.kind === 'warning').length;

    let statsText = '';
    if (errorCount > 0 && warningCount > 0) {
      statsText = `${errorCount} error${errorCount > 1 ? 's' : ''}, ${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    } else if (errorCount > 0) {
      statsText = `${errorCount} error${errorCount > 1 ? 's' : ''}`;
    } else if (warningCount > 0) {
      statsText = `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    } else {
      statsText = 'Compilation issue';
    }

    const diagnosticsHtml = failure.diagnostics
      .map((diag) => {
        const isError = diag.kind === 'error';
        const color = isError ? '#ef4444' : '#f59e0b';
        const bg = isError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)';
        const border = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
        const badgeText = diag.kind.toUpperCase();

        return `
        <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid ${border}; padding-bottom: 8px; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${color}; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${badgeText}
              </span>
              <span style="font-family: monospace; font-size: 12px; color: #94a3b8;">
                Line ${diag.line}, Column ${diag.column}
              </span>
            </div>
          </div>
          <div style="font-family: monospace; font-size: 13px; line-height: 1.5; color: ${color}; white-space: pre-wrap; word-break: break-all;">${diag.msg}</div>
        </div>
      `;
      })
      .join('');

    this.errorOutput.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 24px; font-family: var(--md-text-font-family, sans-serif); color: #cbd5e1; margin-top: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 640px; margin-left: auto; margin-right: auto; box-sizing: border-box; overflow: hidden; position: relative;">
        <!-- Glowing Red background effect -->
        <div style="position: absolute; top: -100px; left: -100px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none; border-radius: 50%;"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(239, 68, 68, 0.15); padding-bottom: 12px;">
          <svg style="width: 24px; height: 24px; fill: #ef4444; flex-shrink: 0;" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3 style="color: #ef4444; font-weight: 700; font-size: 16px; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
            Shader Compilation Failed
          </h3>
          <span style="margin-left: auto; font-size: 12px; color: #94a3b8; background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 10px; font-weight: 500;">
            ${statsText}
          </span>
        </div>

        <div style="margin-top: 16px; display: flex; flex-direction: column;">
          ${diagnosticsHtml}
        </div>
      </div>
    `;
  }

  renderPipelineError(failure: VisualizerError): void {
    this.errorOutput.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 24px; font-family: var(--md-text-font-family, sans-serif); color: #cbd5e1; margin-top: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 640px; margin-left: auto; margin-right: auto; box-sizing: border-box; overflow: hidden; position: relative;">
        <!-- Glowing Red background effect -->
        <div style="position: absolute; top: -100px; left: -100px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none; border-radius: 50%;"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(239, 68, 68, 0.15); padding-bottom: 12px;">
          <svg style="width: 24px; height: 24px; fill: #ef4444; flex-shrink: 0;" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3 style="color: #ef4444; font-weight: 700; font-size: 16px; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
            WebGPU Pipeline Error
          </h3>
        </div>

        <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 16px; font-size: 12.5px; line-height: 1.6;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 8px;">💡 Pipeline Diagnostic:</strong>
          <div style="font-family: monospace; color: #ef4444; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">${failure.message}</div>
        </div>
      </div>
    `;
  }
}
customElements.define('wgsl-tour', WGSLTour);
