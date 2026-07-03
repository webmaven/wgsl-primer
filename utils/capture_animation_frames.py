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
    print("Animation Capture Diagnostic starting...")
    
    # Dynamically resolve paths relative to this script's directory
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    repo_dir = os.path.dirname(utils_dir)
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve_animation_debug")
    artifact_scratch_dir = os.path.join(utils_dir, "animation_frames")
    
    os.makedirs(artifact_scratch_dir, exist_ok=True)
    os.makedirs(test_serve_dir, exist_ok=True)
    
    # Ensure site is built
    print("Building site...")
    subprocess.run(["npm", "run", "build"], cwd=repo_dir, stdout=subprocess.DEVNULL)
        
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
            
            url = f"http://localhost:{port}/tour-of-wgsl/types/arrays/runtime-sized-arrays/index.html"
            await page.goto(url)
            await page.wait_for_timeout(1000)
            
            # --- 1. Capture reallocation (amber) animation on add ---
            print("Hovering first cell to reveal controls...")
            first_cell = page.locator("wgsl-tour").locator("#input-cells-grid .cell-wrapper").first
            await first_cell.hover()
            await page.wait_for_timeout(200)
            
            print("Capturing frames during reallocation (add cell)...")
            add_btn = page.locator("wgsl-tour").locator(".add-cell-btn")
            
            # Click add cell and take snapshots at intervals
            await add_btn.click()
            for i in range(10):
                await page.screenshot(path=os.path.join(artifact_scratch_dir, f"add_frame_{i*40}ms.png"))
                await page.wait_for_timeout(40)
                
            await page.wait_for_timeout(1000)
            
            # --- 2. Capture deallocation (red) animation on delete ---
            # Hover first cell to see controls
            await first_cell.hover()
            await page.wait_for_timeout(200)
            
            delete_btn = first_cell.locator(".delete-cell")
            print("Capturing frames during deallocation (delete cell)...")
            
            # Click delete and take snapshots at intervals
            await delete_btn.click()
            for i in range(10):
                await page.screenshot(path=os.path.join(artifact_scratch_dir, f"delete_frame_{i*40}ms.png"))
                await page.wait_for_timeout(40)
                
            print("Animation capture finished. Frames saved.")
            await browser.close()
    finally:
        server_process.terminate()
        server_process.wait()
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)

if __name__ == "__main__":
    asyncio.run(run())
