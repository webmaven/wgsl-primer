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
    print("Scientific Diagnostic: Verifying play/pause animation overlay and loop safety...")
    
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve")
    
    # Ensure site is built
    print("Ensuring latest build of documentation...")
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
            
            url = f"http://localhost:{port}/wgsl-primer/index.html"
            print(f"Navigating to page: {url}")
            await page.goto(url)
            await page.wait_for_timeout(1500)
            
            # Check play/pause element presence and default state
            initial_state = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                if (!tour) return { error: "no-tour" };
                const canvas = tour.shadowRoot.querySelector("#canvas");
                if (!canvas) return { error: "no-canvas" };
                const overlay = canvas.querySelector(".animation-control-overlay");
                return {
                    hasCanvas: true,
                    hasOverlay: !!overlay,
                    isPaused: canvas.classList.contains("paused"),
                    isOverlayUserRevealed: overlay ? overlay.classList.contains("user-revealed") : false
                };
            }""")
            
            print(f"Initial State: {initial_state}")
            assert initial_state.get("hasCanvas"), "Canvas element missing"
            assert initial_state.get("hasOverlay"), "Play/pause control overlay missing on canvas"
            assert not initial_state.get("isPaused"), "Animation should be playing (unpaused) by default"
            
            # Toggle Pause
            print("Clicking overlay to pause the animation...")
            await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const overlay = tour.shadowRoot.querySelector(".animation-control-overlay");
                if (overlay) overlay.click();
            }""")
            await page.wait_for_timeout(500)
            
            paused_state = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const canvas = tour.shadowRoot.querySelector("#canvas");
                const overlay = canvas.querySelector(".animation-control-overlay");
                return {
                    isPaused: canvas.classList.contains("paused"),
                    isOverlayUserRevealed: overlay ? overlay.classList.contains("user-revealed") : false
                };
            }""")
            print(f"Paused State: {paused_state}")
            assert paused_state.get("isPaused"), "Canvas should have class 'paused' after clicking"
            
            # Toggle Play (Resume)
            print("Clicking overlay to resume the animation...")
            await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const overlay = tour.shadowRoot.querySelector(".animation-control-overlay");
                if (overlay) overlay.click();
            }""")
            await page.wait_for_timeout(500)
            
            resumed_state = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const canvas = tour.shadowRoot.querySelector("#canvas");
                const overlay = canvas.querySelector(".animation-control-overlay");
                return {
                    isPaused: canvas.classList.contains("paused"),
                    isOverlayUserRevealed: overlay ? overlay.classList.contains("user-revealed") : false
                };
            }""")
            print(f"Resumed State: {resumed_state}")
            assert not resumed_state.get("isPaused"), "Canvas should not have class 'paused' after resuming"
            assert resumed_state.get("isOverlayUserRevealed"), "Overlay should have class 'user-revealed' temporary after resume"
            
            print("\nE2E verification of play/pause control overlay was successful!")
            await browser.close()
    finally:
        server_process.terminate()
        server_process.wait()
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)

if __name__ == "__main__":
    asyncio.run(run())
