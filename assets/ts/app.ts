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

/**
 * Entry point file for the WGSLTour application
 *
 * @module app
 */

import './wgsl-primer';
import '../sass/style.scss';

// Wrap left-column elements for responsive two-column scrolling layout
document.addEventListener('DOMContentLoaded', () => {
  const tourWrapper = document.getElementById('tour-wrapper');
  if (tourWrapper) {
    const parent = tourWrapper.parentElement;
    if (parent && parent.classList.contains('md-content__inner')) {
      // Create left column container
      const leftCol = document.createElement('div');
      leftCol.className = 'tour-left-column';

      // Move all children except h1, script tags, and #tour-wrapper into leftCol
      const children = Array.from(parent.children);
      children.forEach((child) => {
        if (
          child !== tourWrapper &&
          child.tagName.toLowerCase() !== 'h1' &&
          child.tagName.toLowerCase() !== 'script'
        ) {
          leftCol.appendChild(child);
        }
      });

      // Append the left column container before tourWrapper
      parent.insertBefore(leftCol, tourWrapper);

      // Measure and update the left column midpoint for scroll-to-top button alignment
      const updateLeftColMidpoint = () => {
        const rect = leftCol.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        document.documentElement.style.setProperty('--tour-left-col-midpoint', `${midpoint}px`);
      };

      // Update midpoint initially and on window resizing/loading
      updateLeftColMidpoint();
      window.addEventListener('resize', updateLeftColMidpoint);
      window.addEventListener('load', updateLeftColMidpoint);
    }
  }
});

// Enable arrow key navigation between pages (if not focusing an input, code editor, or visualizer component, and no modifier keys are pressed)
document.addEventListener('keydown', (event: KeyboardEvent) => {
  // Ignore arrow navigation if modifier keys (Cmd, Ctrl, Alt, Shift) are pressed
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return;
  }

  // Use event.composedPath() to robustly check all traversed elements, crossing Shadow DOM boundaries.
  const path = event.composedPath();
  const isEditingOrTour = path.some((target) => {
    if (target instanceof HTMLElement || target instanceof Element) {
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.hasAttribute('contenteditable') ||
        target.classList.contains('cm-editor') ||
        target.classList.contains('cm-content') ||
        tagName === 'wgsl-tour'
      ) {
        return true;
      }
    }
    return false;
  });

  if (isEditingOrTour) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    const prevLink = document.querySelector('a.md-footer__link--prev') as HTMLAnchorElement | null;
    if (prevLink && prevLink.href) {
      event.preventDefault();
      window.location.href = prevLink.href;
    }
  } else if (event.key === 'ArrowRight') {
    const nextLink = document.querySelector('a.md-footer__link--next') as HTMLAnchorElement | null;
    if (nextLink && nextLink.href) {
      event.preventDefault();
      window.location.href = nextLink.href;
    }
  }
});

// Synchronize scroll-to-top button (.md-top) visibility across window resizes
document.addEventListener('DOMContentLoaded', () => {
  let lastScrollY = window.scrollY;
  let scrollDirection: 'up' | 'down' = 'up';

  const syncTopButton = () => {
    const el = document.querySelector('.md-top') as HTMLElement | null;
    if (!el) return;
    const isOverThreshold = window.scrollY > 100;
    const isScrollingUp = scrollDirection === 'up';
    if (isOverThreshold && isScrollingUp) {
      if (el.hasAttribute('hidden')) {
        el.removeAttribute('hidden');
      }
    } else {
      if (!el.hasAttribute('hidden')) {
        el.setAttribute('hidden', '');
      }
    }
  };

  // Sync initially and on load/scroll/resize events
  syncTopButton();

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY !== lastScrollY) {
      scrollDirection = currentScrollY < lastScrollY ? 'up' : 'down';
      lastScrollY = currentScrollY;
    }
    syncTopButton();
  });

  window.addEventListener('load', syncTopButton);
  window.addEventListener('resize', () => {
    setTimeout(syncTopButton, 100);
  });
});
