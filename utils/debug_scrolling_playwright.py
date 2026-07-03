# Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
# See root README.md for global project-wide upstream attributions.

import asyncio
import os
import sys
import socket
import subprocess
import time
import shutil
from playwright.async_api import async_playwright

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

async def main():
    # Dynamically resolve paths relative to this script's directory
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    repo_dir = os.path.dirname(utils_dir)
    site_dir = os.path.join(repo_dir, "site")
    
    print("=== Atomic Operations Scrolling & Layout Diagnostic ===")
    print(f"Repository Root: {repo_dir}")
    print(f"Static Site Path: {site_dir}")
    
    # 1. Build site first to ensure it is updated
    print("\nBuilding site with 'npm run build'...")
    subprocess.run(["npm", "run", "build"], cwd=repo_dir, check=True)
    
    # Set up test_serve directory and symlink
    test_serve_dir = os.path.join(repo_dir, "test_serve_scroll_debug")
    if os.path.exists(test_serve_dir):
        if os.path.islink(test_serve_dir):
            os.unlink(test_serve_dir)
        elif os.path.isdir(test_serve_dir):
            shutil.rmtree(test_serve_dir)
            
    os.makedirs(test_serve_dir, exist_ok=True)
    symlink_path = os.path.join(test_serve_dir, "tour-of-wgsl")
    os.symlink(site_dir, symlink_path)
    
    port = find_free_port()
    print(f"\nStarting HTTP server on port {port} serving from: {test_serve_dir}")
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--directory", test_serve_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Allow the server a moment to spin up
    time.sleep(1.0)
    
    try:
        async with async_playwright() as p:
            print("Launching headless Chromium with WebGPU flags...")
            browser = await p.chromium.launch(
                headless=True,
                args=["--enable-unsafe-webgpu", "--no-sandbox"]
            )
            context = await browser.new_context(viewport={"width": 1280, "height": 900})
            page = await context.new_page()
            
            page.on("console", lambda msg: print(f"Browser Console {msg.type}: {msg.text}"))
            page.on("pageerror", lambda err: print(f"Browser Page Error: {err.message}"))
            
            url = f"http://localhost:{port}/wgsl-primer/types/atomics/atomic-operations/index.html"
            print(f"Navigating to: {url}")
            await page.goto(url)
            await page.wait_for_timeout(2000)
            
            # Print initial page info
            print("\n=== Initial Scroll and Page Info ===")
            metrics = await page.evaluate("""() => {
                return {
                    windowInnerHeight: window.innerHeight,
                    documentScrollHeight: document.documentElement.scrollHeight,
                    bodyScrollHeight: document.body.scrollHeight,
                    windowScrollY: window.scrollY
                };
            }""")
            print(f"Viewport Height: {metrics['windowInnerHeight']}px")
            print(f"Document Scroll Height: {metrics['documentScrollHeight']}px")
            print(f"Body Scroll Height: {metrics['bodyScrollHeight']}px")
            print(f"Initial Scroll Y: {metrics['windowScrollY']}px")
            
            # Scroll down
            print("\nAttempting to scroll to the bottom of the page...")
            await page.evaluate("window.scrollTo(0, 100000);")
            await page.wait_for_timeout(1000)
            
            metrics_after = await page.evaluate("""() => {
                return {
                    windowScrollY: window.scrollY
                };
            }""")
            print(f"Scroll Y after scrolling to bottom: {metrics_after['windowScrollY']}px")
            
            # Dump element bounds and overflow properties
            print("\n=== Inspecting DOM Elements ===")
            elements_info = await page.evaluate("""() => {
                const results = [];
                const selectors = [
                    'html',
                    'body',
                    '.md-container',
                    'main.md-main',
                    '.md-main__inner',
                    '.md-content',
                    'article.md-content__inner',
                    '.tour-left-column',
                    '#tour-wrapper'
                ];
                
                selectors.forEach(sel => {
                    const el = document.querySelector(sel);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        results.push({
                            selector: sel,
                            rect: {
                                top: rect.top,
                                bottom: rect.bottom,
                                left: rect.left,
                                right: rect.right,
                                width: rect.width,
                                height: rect.height
                            },
                            style: {
                                display: style.display,
                                position: style.position,
                                overflow: style.overflow,
                                overflowY: style.overflowY,
                                height: style.height,
                                minHeight: style.minHeight,
                                maxHeight: style.maxHeight,
                                boxSizing: style.boxSizing
                            }
                        });
                    } else {
                        results.push({ selector: sel, found: false });
                    }
                });
                return results;
            }""")
            
            for el in elements_info:
                if 'found' in el and not el['found']:
                    print(f"Selector '{el['selector']}' not found.")
                else:
                    print(f"\nSelector: {el['selector']}")
                    print(f"  Bounds: top={el['rect']['top']:.1f}, bottom={el['rect']['bottom']:.1f}, height={el['rect']['height']:.1f}")
                    print(f"  Style: display={el['style']['display']}, position={el['style']['position']}")
                    print(f"  Overflow: overflow={el['style']['overflow']}, overflowY={el['style']['overflowY']}")
                    print(f"  Heights: height={el['style']['height']}, minHeight={el['style']['minHeight']}, maxHeight={el['style']['maxHeight']}")
            
            # Save screenshot inside utils directory
            screenshot_path = os.path.join(utils_dir, "scrolling_diagnostics.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"\nScreenshot of full-page scrolling state saved to:\n  {screenshot_path}")
            
    finally:
        print("\nStopping HTTP server...")
        server_process.terminate()
        server_process.wait()
        
        # Clean up symlink and test directory
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)
        print("Cleanup completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
