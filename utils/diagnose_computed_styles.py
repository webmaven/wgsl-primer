# Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
# See root README.md for global project-wide upstream attributions.

import asyncio
import os
import sys
import subprocess
import time
import socket
import shutil
from playwright.async_api import async_playwright

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

async def monitor_cell_styles(page, selector, duration_ms, interval_ms, label):
    """Samples the computed style of elements matching the selector over a duration."""
    samples = []
    start_time = time.time()
    steps = int(duration_ms / interval_ms)
    
    for step in range(steps):
        elapsed = int((time.time() - start_time) * 1000)
        
        # Evaluate styles inside the browser
        styles = await page.evaluate(f"""() => {{
            const tour = document.querySelector('wgsl-tour');
            if (!tour) return [];
            const shadow = tour.shadowRoot;
            if (!shadow) return [];
            
            const targets = Array.from(shadow.querySelectorAll('{selector}'));
            return targets.map((el, idx) => {{
                const style = window.getComputedStyle(el);
                // Also check nested input cell if any
                const inputCell = el.querySelector('.input-cell');
                const inputStyle = inputCell ? window.getComputedStyle(inputCell) : null;
                
                return {{
                    index: idx,
                    classes: el.className,
                    background: style.backgroundColor,
                    borderColor: style.borderColor,
                    boxShadow: style.boxShadow,
                    opacity: style.opacity,
                    transform: style.transform,
                    inputBg: inputStyle ? inputStyle.backgroundColor : null,
                    inputColor: inputStyle ? inputStyle.color : null,
                    inputBoxShadow: inputStyle ? inputStyle.boxShadow : null
                }};
            }});
        }}""")
        
        samples.append((elapsed, styles))
        await page.wait_for_timeout(interval_ms)
        
    return samples

async def main():
    # Dynamically resolve paths relative to this script's directory
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    repo_dir = os.path.dirname(utils_dir)
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve_style_debug")
    
    os.makedirs(test_serve_dir, exist_ok=True)
    
    # Ensure site is built
    print("Building site with npm run build...")
    subprocess.run(["npm", "run", "build"], cwd=repo_dir, stdout=subprocess.DEVNULL)
        
    # Symlink to tour-of-wgsl to handle site_url prefix
    symlink_path = os.path.join(test_serve_dir, "tour-of-wgsl")
    if os.path.exists(symlink_path):
        os.unlink(symlink_path)
    os.symlink(site_dir, symlink_path)
    
    port = find_free_port()
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--directory", test_serve_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.0)
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--enable-unsafe-webgpu", "--no-sandbox"]
            )
            context = await browser.new_context(viewport={"width": 1280, "height": 960})
            page = await context.new_page()
            
            url = f"http://localhost:{port}/wgsl-primer/types/arrays/runtime-sized-arrays/index.html"
            print(f"Navigating to {url}...")
            await page.goto(url)
            await page.wait_for_timeout(1000)
            
            # Find the custom element
            tour_exists = await page.evaluate("() => document.querySelectorAll('wgsl-tour').length > 0")
            if not tour_exists:
                print("Error: <wgsl-tour> element not found on page.")
                return
                
            print("\n--- TEST 1: ADD CELL INTERACTION (AMBER REALLOCATION GLOW) ---")
            # Hover over first cell wrapper to show controls
            await page.evaluate("""() => {
                const tour = document.querySelector('wgsl-tour');
                const firstCell = tour.shadowRoot.querySelector('#input-cells-grid .cell-wrapper');
                if (firstCell) {
                    const event = new MouseEvent('mouseenter', { bubbles: true });
                    firstCell.dispatchEvent(event);
                }
            }""")
            await page.wait_for_timeout(200)
            
            # Click add button and immediately monitor styles of existing cell wrappers
            print("Clicking Add Button and monitoring existing cell style transitions...")
            await page.evaluate("""() => {
                const tour = document.querySelector('wgsl-tour');
                const addBtn = tour.shadowRoot.querySelector('.add-cell-btn');
                if (addBtn) addBtn.click();
            }""")
            
            add_samples = await monitor_cell_styles(page, "#input-cells-grid .cell-wrapper", 450, 50, "Add")
            
            print("\nAnalyzing Add Cell samples (Existing Cells):")
            for elapsed, styles in add_samples:
                if len(styles) > 0:
                    # Let's inspect cell 0 (as a representative existing cell)
                    cell = styles[0]
                    print(f"[{elapsed:3d}ms] Class: '{cell['classes']}'\n"
                          f"        OuterBg: {cell['background']} | InnerBg: {cell['inputBg']}\n"
                          f"        InnerColor: {cell['inputColor']} | InnerBoxShadow: {cell['inputBoxShadow']}")
            
            # Wait for reallocation to settle
            await page.wait_for_timeout(1000)
            
            print("\n--- TEST 2: DELETE CELL INTERACTION (RED DEALLOCATION GLOW) ---")
            # Hover first cell wrapper to show delete controls
            await page.evaluate("""() => {
                const tour = document.querySelector('wgsl-tour');
                const firstCell = tour.shadowRoot.querySelector('#input-cells-grid .cell-wrapper');
                if (firstCell) {
                    const event = new MouseEvent('mouseenter', { bubbles: true });
                    firstCell.dispatchEvent(event);
                }
            }""")
            await page.wait_for_timeout(200)
            
            # We will delete the first cell (index 0).
            # We want to monitor:
            # - The first cell (index 0) which is clicked.
            # - The tail cell (index N-1) which is actually removed.
            print("Clicking Delete Button on first cell (index 0) and monitoring styles...")
            await page.evaluate("""() => {
                const tour = document.querySelector('wgsl-tour');
                const deleteBtn = tour.shadowRoot.querySelector('.delete-cell');
                if (deleteBtn) deleteBtn.click();
            }""")
            
            delete_samples = await monitor_cell_styles(page, "#input-cells-grid .cell-wrapper", 450, 50, "Delete")
            
            print("\nAnalyzing Delete Cell samples:")
            for elapsed, styles in delete_samples:
                if len(styles) > 0:
                    # Clicked cell (index 0)
                    cell_0 = styles[0]
                    # Tail cell (the last one)
                    cell_tail = styles[-1]
                    print(f"[{elapsed:3d}ms]\n"
                          f"   CLICKED CELL (idx 0): Class: '{cell_0['classes']}'\n"
                          f"        OuterBg: {cell_0['background']} | InnerBg: {cell_0['inputBg']} | InnerColor: {cell_0['inputColor']}\n"
                          f"        InnerBoxShadow: {cell_0['inputBoxShadow']}\n"
                          f"   TAIL CELL (idx {cell_tail['index']}): Class: '{cell_tail['classes']}'\n"
                          f"        OuterBg: {cell_tail['background']} | InnerBg: {cell_tail['inputBg']} | InnerColor: {cell_tail['inputColor']}")
                          
            await browser.close()
    finally:
        server_process.terminate()
        server_process.wait()
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)

if __name__ == "__main__":
    asyncio.run(main())
