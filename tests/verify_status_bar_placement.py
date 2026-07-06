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
    print("Scientific Diagnostic: Verifying status bar / toolbar DOM placement and styling correctness...")
    
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
            
            # Check status bar layout order and DOM nesting order
            dom_status = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                if (!tour) return { error: "no-tour" };
                
                const editorContainer = tour.shadowRoot.querySelector(".editor-container");
                if (!editorContainer) return { error: "no-editor-container" };
                
                const children = Array.from(editorContainer.children);
                const cmEditorIndex = children.findIndex(el => el.classList.contains("cm-editor"));
                const controlsIndex = children.findIndex(el => el.classList.contains("controls-container"));
                
                if (cmEditorIndex === -1) return { error: "no-cm-editor" };
                if (controlsIndex === -1) return { error: "no-controls-container" };
                
                // Fetch computed style properties to ensure correct alignment
                const cmEditorStyle = window.getComputedStyle(children[cmEditorIndex]);
                const controlsStyle = window.getComputedStyle(children[controlsIndex]);
                
                return {
                    success: true,
                    cmEditorIndex,
                    controlsIndex,
                    isControlsAfterCmEditor: controlsIndex > cmEditorIndex,
                    cmBorderBottomLeftRadius: cmEditorStyle.borderBottomLeftRadius,
                    cmBorderBottomRightRadius: cmEditorStyle.borderBottomRightRadius,
                    controlsBorderBottomLeftRadius: controlsStyle.borderBottomLeftRadius,
                    controlsBorderBottomRightRadius: controlsStyle.borderBottomRightRadius
                };
            }""")
            
            print(f"DOM Alignment Diagnostic: {dom_status}")
            
            assert dom_status.get("success"), f"Failed to retrieve DOM status: {dom_status.get('error')}"
            assert dom_status.get("isControlsAfterCmEditor"), (
                f"Regression: Controls container index ({dom_status.get('controlsIndex')}) "
                f"is not after CodeMirror editor index ({dom_status.get('cmEditorIndex')})!"
            )
            
            # Ensure the styling rules match the docked bottom design
            assert dom_status.get("cmBorderBottomLeftRadius") in ["0px", "0"], "CodeMirror editor should have a flat bottom left corner"
            assert dom_status.get("cmBorderBottomRightRadius") in ["0px", "0"], "CodeMirror editor should have a flat bottom right corner"
            assert dom_status.get("controlsBorderBottomLeftRadius") == "6px", "Controls container should have a rounded bottom left corner"
            assert dom_status.get("controlsBorderBottomRightRadius") == "6px", "Controls container should have a rounded bottom right corner"
            
            print("\nE2E status bar placement and layout verification was successful!")
            await browser.close()
    finally:
        server_process.terminate()
        server_process.wait()
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)

if __name__ == "__main__":
    asyncio.run(run())
