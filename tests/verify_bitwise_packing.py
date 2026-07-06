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
    print("Starting automated Playwright verification for Bitwise Packing Visualizer...")
    
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve")
    
    if not os.path.exists(site_dir):
        print(f"Error: Built site directory not found at {site_dir}. Please run 'npm run build' first.")
        sys.exit(1)
        
    print("Setting up test_serve symlink directory...")
    if os.path.exists(test_serve_dir):
        if os.path.islink(test_serve_dir):
            os.unlink(test_serve_dir)
        elif os.path.isdir(test_serve_dir):
            shutil.rmtree(test_serve_dir)
            
    os.makedirs(test_serve_dir, exist_ok=True)
    symlink_path = os.path.join(test_serve_dir, "wgsl-primer")
    os.symlink(site_dir, symlink_path)
    
    port = find_free_port()
    print(f"Starting lightweight Python HTTP server on port {port}...")
    
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--directory", test_serve_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    time.sleep(1.5)
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--enable-unsafe-webgpu", "--no-sandbox"]
            )
            context = await browser.new_context(viewport={"width": 1280, "height": 900})
            page = await context.new_page()
            
            # Listen to console and page errors
            page.on("console", lambda msg: print(f"Browser Console {msg.type}: {msg.text}"))
            page.on("pageerror", lambda err: print(f"Browser Page Error: {err.message}"))
            
            url = f"http://localhost:{port}/wgsl-primer/expressions/operators/bitwise-packing/index.html"
            print(f"Navigating to {url}...")
            await page.goto(url)
            
            # Wait for the results element to be populated
            output_locator = page.locator("#wgsl-tour-output-text")
            await output_locator.wait_for(state="visible", timeout=10000)
            
            # Wait a little bit for the visualizer execution to complete
            await page.wait_for_timeout(2000)
            
            output_text = await output_locator.inner_text()
            print("\n--- Visualizer Results Output ---")
            print(output_text)
            print("--------------------------------\n")
            
            # Perform assertions
            assert "get_input_normal()" in output_text, "get_input_normal() missing from results"
            assert "get_input_specular()" in output_text, "get_input_specular() missing from results"
            assert "get_packed_val()" in output_text, "get_packed_val() missing from results"
            assert "get_unpacked_normal()" in output_text, "get_unpacked_normal() missing from results"
            assert "get_unpacked_specular()" in output_text, "get_unpacked_specular() missing from results"
            
            # Check the values specifically: normal should NOT be tiny exponent near zero
            # Let's verify that we have normal coordinates that are close to the expected values (around -0.57, 0.57, -0.57)
            # Instead of something like "-8.66592491019419e-31" or similar.
            assert "e-3" not in output_text or "get_unpacked_normal(): vec3f(-0.57" in output_text, "Found unexpected exponential or near-zero unpacked normal"
            
            print("E2E verification of bitwise-packing page was successful!")
            await browser.close()
    finally:
        print("Stopping Python HTTP server...")
        server_process.terminate()
        server_process.wait()
        
        try:
            if os.path.exists(test_serve_dir):
                shutil.rmtree(test_serve_dir)
        except Exception as e:
            print(f"Warning: could not clean up test_serve: {e}")

if __name__ == "__main__":
    asyncio.run(run())
