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
    print("Scientific Diagnostic: Verification of Specifying Pointers Compilation Card...")
    
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve")
    screenshot_dir = os.path.join(repo_dir, "test_screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)
    screenshot_path = os.path.join(screenshot_dir, "compilation_error_card.png")
    
    # Ensure site is built
    print("Ensuring latest build of documentation...")
    subprocess.run(["npm", "run", "build"], cwd=repo_dir, stdout=subprocess.DEVNULL)
        
    os.makedirs(test_serve_dir, exist_ok=True)
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
            context = await browser.new_context()
            page = await context.new_page()
            
            url = f"http://localhost:{port}/tour-of-wgsl/types/pointers/specifying/index.html"
            print(f"Navigating to page: {url}")
            await page.goto(url)
            await page.wait_for_timeout(1000)
            
            # Verify initial state of custom element
            initial_status = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                if (!tour) return "no-tour";
                const dot = tour.shadowRoot.querySelector(".status-dot");
                const label = tour.shadowRoot.querySelector(".status-label");
                return {
                    dotClass: dot ? dot.className : 'none',
                    labelText: label ? label.textContent : 'none',
                    hasOutputClass: tour.classList.contains('has-output')
                };
            }""")
            print(f"Initial Playground Status: {initial_status}")
            
            # Uncomment line 10 to trigger compiler diagnostic card
            print("Triggering compilation failure in editor...")
            await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const view = tour.editor;
                const docLength = view.state.doc.length;
                const doc = view.state.doc.toString();
                const newDoc = doc.replace('//alias bad1 = ptr<private,bool,read>;', 'alias bad1 = ptr<private,bool,read>;');
                view.dispatch({
                    changes: { from: 0, to: docLength, insert: newDoc }
                });
            }""")
            
            # Wait for compilation to fail and display card
            await page.wait_for_timeout(2000)
            
            error_status = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const dot = tour.shadowRoot.querySelector(".status-dot");
                const label = tour.shadowRoot.querySelector(".status-label");
                return {
                    dotClass: dot ? dot.className : 'none',
                    labelText: label ? label.textContent : 'none',
                    hasOutputClass: tour.classList.contains('has-output')
                };
            }""")
            print(f"Playground Status with Compile Error: {error_status}")
            
            # Take screenshot of the gorgeous error card inside the shadow root!
            # To capture shadow dom, we can screenshot the wgsl-tour shadow tree element
            print("Capturing screenshot of the compiled error card...")
            tour_el = await page.query_selector("wgsl-tour")
            if tour_el:
                # Let's write the shadow elements' style or screenshot the component
                error_card = await page.evaluate_handle("""() => {
                    const tour = document.querySelector("wgsl-tour");
                    return tour.shadowRoot.getElementById("error-output");
                }""")
                if error_card:
                    await error_card.as_element().screenshot(path=screenshot_path)
                    print(f"Saved screenshot of compiler error card to: {screenshot_path}")
            
            # Comment line 10 back to restore clean compile state
            print("Restoring code to clean compiling state...")
            await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const view = tour.editor;
                const docLength = view.state.doc.length;
                const doc = view.state.doc.toString();
                const newDoc = doc.replace('alias bad1 = ptr<private,bool,read>;', '//alias bad1 = ptr<private,bool,read>;');
                view.dispatch({
                    changes: { from: 0, to: docLength, insert: newDoc }
                });
            }""")
            
            # Wait for successful compile and card cleanup
            await page.wait_for_timeout(2000)
            
            resolved_status = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const dot = tour.shadowRoot.querySelector(".status-dot");
                const label = tour.shadowRoot.querySelector(".status-label");
                return {
                    dotClass: dot ? dot.className : 'none',
                    labelText: label ? label.textContent : 'none',
                    hasOutputClass: tour.classList.contains('has-output')
                };
            }""")
            print(f"Resolved Playground Status: {resolved_status}")
            
            await browser.close()
    finally:
        server_process.terminate()
        server_process.wait()
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)
            
if __name__ == "__main__":
    asyncio.run(run())
