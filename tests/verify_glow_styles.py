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

async def run():
    print("Scientific Diagnostic: Checking deallocation glow computed styles...")
    
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve")
    
    # Ensure site is built
    if not os.path.exists(site_dir):
        print("Site not built. Building now...")
        subprocess.run(["npm", "run", "build"], cwd=repo_dir, stdout=subprocess.DEVNULL)
        
    os.makedirs(test_serve_dir, exist_ok=True)
    symlink_path = os.path.join(test_serve_dir, "wgsl-primer")
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
            context = await browser.new_context()
            page = await context.new_page()
            
            url = f"http://localhost:{port}/wgsl-primer/types/arrays/runtime-sized-arrays/index.html"
            await page.goto(url)
            await page.wait_for_timeout(1000)
            
            # Locate first cell and its input cell
            first_cell = page.locator("wgsl-tour").locator("#input-cells-grid .cell-wrapper").first
            await first_cell.hover()
            await page.wait_for_timeout(200)
            
            delete_btn = first_cell.locator(".delete-cell")
            await delete_btn.wait_for(state="visible")
            
            # Record styles safely using page-level evaluation to avoid Playwright locator auto-waiting
            styles_recorded = []
            
            async def record_styles():
                for i in range(25):
                    try:
                        res = await page.evaluate("""() => {
                            const tour = document.querySelector("wgsl-tour");
                            if (!tour) return { hasClass: false, bgColor: 'no-tour', boxShadow: 'none' };
                            const shadow = tour.shadowRoot;
                            if (!shadow) return { hasClass: false, bgColor: 'no-shadow', boxShadow: 'none' };
                            const grid = shadow.getElementById("input-cells-grid");
                            if (!grid) return { hasClass: false, bgColor: 'no-grid', boxShadow: 'none' };
                            const wrappers = grid.querySelectorAll(".cell-wrapper");
                            // We are tracking the 8th cell (index 7), which is the old tail cell being deallocated
                            const wrapper = wrappers[7];
                            if (!wrapper) return { hasClass: false, bgColor: 'no-wrapper', boxShadow: 'none' };
                            const input = wrapper.querySelector(".input-cell");
                            if (!input) return { hasClass: false, bgColor: 'no-input', boxShadow: 'none' };
                            const computed = window.getComputedStyle(input);
                            return {
                                hasClass: wrapper.classList.contains('buffer-deallocating'),
                                bgColor: computed.backgroundColor,
                                boxShadow: computed.boxShadow
                            };
                        }""")
                        styles_recorded.append((i * 20, res['bgColor'], res['boxShadow'], res['hasClass']))
                    except Exception as e:
                        styles_recorded.append((i * 20, f"Error: {e}", "", False))
                    await asyncio.sleep(0.02) # 20ms intervals
            
            print("Clicking delete on index 0 to shrink buffer size from 8 to 7...")
            recording_task = asyncio.create_task(record_styles())
            await delete_btn.click()
            
            await recording_task
            await page.wait_for_timeout(500)
            
            print("\n--- Recorded Computed Styles of Deallocating Cell (Index 7) ---")
            print(f"{'Time (ms)':<10} | {'Has Class':<10} | {'Background Color':<25} | {'Box Shadow'}")
            print("-" * 105)
            for t, bg, shadow, has_class in styles_recorded:
                print(f"{t:<10} | {str(has_class):<10} | {bg:<25} | {shadow[:50]}")
                
            await browser.close()
    finally:
        server_process.terminate()
        server_process.wait()
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)

if __name__ == "__main__":
    asyncio.run(run())
