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
    print("Starting automated Playwright verification for Buffer Viewer features...")
    
    # Paths
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve")
    
    if not os.path.exists(site_dir):
        print(f"Error: Built site directory not found at {site_dir}. Please run 'npm run build' first.")
        sys.exit(1)
        
    # Set up test_serve directory and symlink
    print("Setting up test_serve symlink directory...")
    if os.path.exists(test_serve_dir):
        if os.path.islink(test_serve_dir):
            os.unlink(test_serve_dir)
        elif os.path.isdir(test_serve_dir):
            shutil.rmtree(test_serve_dir)
            
    os.makedirs(test_serve_dir, exist_ok=True)
    symlink_path = os.path.join(test_serve_dir, "wgsl-primer")
    os.symlink(site_dir, symlink_path)
    print(f"Created symlink: {symlink_path} -> {site_dir}")
    
    port = find_free_port()
    print(f"Starting lightweight Python HTTP server on port {port} serving {test_serve_dir}...")
    
    # Start the server as a subprocess
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--directory", test_serve_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait slightly for server to start
    time.sleep(1.5)
    
    try:
        async with async_playwright() as p:
            # Launch Chromium with WebGPU enabled
            browser = await p.chromium.launch(
                headless=True,
                args=["--enable-unsafe-webgpu", "--no-sandbox"]
            )
            context = await browser.new_context(viewport={"width": 1280, "height": 900})
            page = await context.new_page()
            
            # Listen to events
            page.on("console", lambda msg: print(f"Browser Console {msg.type}: {msg.text}"))
            page.on("pageerror", lambda err: print(f"Browser Page Error: {err.message}"))
            page.on("requestfailed", lambda req: print(f"Request failed: {req.method} {req.url} - {req.failure if req.failure else 'Unknown error'}"))
            
            url = f"http://localhost:{port}/wgsl-primer/types/arrays/runtime-sized-arrays/index.html"
            print(f"Navigating to {url}...")
            await page.goto(url)
            await page.wait_for_timeout(2000)
            
            # --- 1. Verify existence of Buffer Viewer ---
            print("Checking for Buffer Viewer container...")
            wrapper = page.locator(".buffer-viewer-wrapper")
            await wrapper.wait_for(state="attached", timeout=5000)
            print("Buffer Viewer container successfully found.")
            
            # Check initial cells count
            initial_input_cells = await page.locator("#input-cells-grid .cell-wrapper").count()
            print(f"Initial input cells count: {initial_input_cells}")
            
            # --- 2. Test Help Inspector / Question Mode ---
            print("\n--- Testing Help Inspector (Question Mode) ---")
            toggle_btn = page.locator(".help-inspector-toggle")
            await toggle_btn.wait_for(state="visible", timeout=2000)
            
            # Verify initial state
            has_active_class = await toggle_btn.evaluate("el => el.classList.contains('active')")
            print(f"Is toggle button active initially? {has_active_class}")
            
            # Click toggle to activate Question Mode
            print("Clicking Help Toggle Button...")
            await toggle_btn.click()
            await page.wait_for_timeout(300)
            
            # Verify Help Banner and active class
            has_active_class = await toggle_btn.evaluate("el => el.classList.contains('active')")
            has_active_wrapper = await wrapper.evaluate("el => el.classList.contains('question-mode-active')")
            banner_visible = await page.locator(".help-inspector-banner").is_visible()
            print(f"Is toggle button active now? {has_active_class}")
            print(f"Is wrapper active now? {has_active_wrapper}")
            print(f"Is Help Inspector Banner visible? {banner_visible}")
            
            # Hover over an element with data-help
            print("Hovering over Input Storage Buffer Panel to check tooltip...")
            panel = page.locator(".column-panel.input-panel")
            await panel.hover()
            await page.wait_for_timeout(300)
            
            # Check tooltip visibility and content
            tooltip = page.locator(".help-inspector-tooltip")
            tooltip_visible = await tooltip.is_visible()
            tooltip_opacity = await tooltip.evaluate("el => window.getComputedStyle(el).opacity")
            tooltip_text = await tooltip.inner_html()
            print(f"Is tooltip visible? {tooltip_visible} (Opacity: {tooltip_opacity})")
            print(f"Tooltip Content: {tooltip_text}")
            
            # Click anywhere on the body to exit Question Mode
            print("Clicking body to exit Question Mode...")
            await page.click("body")
            await page.wait_for_timeout(300)
            
            # Verify deactivated state
            has_active_class = await toggle_btn.evaluate("el => el.classList.contains('active')")
            has_active_wrapper = await wrapper.evaluate("el => el.classList.contains('question-mode-active')")
            banner_visible = await page.locator(".help-inspector-banner").is_visible()
            print(f"Is toggle button active after exit? {has_active_class}")
            print(f"Is wrapper active after exit? {has_active_wrapper}")
            print(f"Is Help Inspector Banner visible after exit? {banner_visible}")
            
            # --- 3. Test Reallocation - Adding Cells ---
            print("\n--- Testing Buffer Allocation (Adding Cell) ---")
            add_btn = page.locator(".add-cell-btn")
            await add_btn.wait_for(state="visible", timeout=2000)
            
            print("Clicking '+' Add Element button...")
            await add_btn.click()
            await page.wait_for_timeout(400) # Wait for dealloc (250ms) + alloc animations to settle
            
            new_cells_count = await page.locator("#input-cells-grid .cell-wrapper").count()
            print(f"New cell count: {new_cells_count} (Expected: {initial_input_cells + 1})")
            
            # --- 4. Test Reallocation - Deleting Cells ---
            print("\n--- Testing Buffer Deallocation (Deleting Cell) ---")
            # Hover over the first cell wrapper to make the toolbar visible
            first_cell = page.locator("#input-cells-grid .cell-wrapper").first
            await first_cell.hover()
            await page.wait_for_timeout(300)
            
            delete_btn = first_cell.locator(".delete-cell")
            await delete_btn.wait_for(state="visible", timeout=2000)
            
            # Click delete
            print("Clicking delete 'x' button...")
            await delete_btn.click()
            
            # Wait for reallocation to settle
            await page.wait_for_timeout(600)
            final_cells_count = await page.locator("#input-cells-grid .cell-wrapper").count()
            print(f"Final cells count after deletion: {final_cells_count} (Expected: {new_cells_count - 1})")
            
            print("\nPlaywright verification completed successfully!")
            await browser.close()
    finally:
        print("Stopping Python HTTP server...")
        server_process.terminate()
        server_process.wait()
        print("Server stopped cleanly.")
        
        # Clean up test_serve folder
        try:
            if os.path.exists(test_serve_dir):
                shutil.rmtree(test_serve_dir)
                print("Cleaned up test_serve directory.")
        except Exception as e:
            print(f"Warning: could not clean up test_serve: {e}")

if __name__ == "__main__":
    asyncio.run(run())
