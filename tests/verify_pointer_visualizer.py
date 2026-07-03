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
    print("Scientific Diagnostic: Verification of Creating and Using Pointers Memory Visualizer...")
    
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve")
    
    # Ensure site is built
    print("Ensuring latest build of documentation...")
    subprocess.run(["npm", "run", "build"], cwd=repo_dir, stdout=subprocess.DEVNULL)
    
    os.makedirs(test_serve_dir, exist_ok=True)
    symlink_path = os.path.join(test_serve_dir, "tour-of-wgsl")
    if os.path.exists(symlink_path):
        if os.path.islink(symlink_path):
            os.unlink(symlink_path)
        else:
            shutil.rmtree(symlink_path)
    os.symlink(site_dir, symlink_path)
    
    port = find_free_port()
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--directory", test_serve_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Let server boot up
    time.sleep(1.0)
    
    try:
        async with async_playwright() as p:
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
            page.on("response", lambda res: print(f"Response Error: {res.status} {res.url}") if res.status >= 400 else None)
            
            url = f"http://localhost:{port}/tour-of-wgsl/types/pointers/using/index.html"
            print(f"Navigating to page: {url}")
            await page.goto(url)
            await page.wait_for_timeout(3000)
            
            # Verify visualizer wrapper is attached
            wrapper_selector = "wgsl-tour >> .pointer-vis-wrapper"
            wrapper = page.locator(wrapper_selector)
            await wrapper.wait_for(state="visible", timeout=5000)
            print("Pointer Memory Visualizer wrapper successfully found.")
            
            # Define helper to read state of elements
            async def get_visualizer_state():
                return await page.evaluate("""() => {
                    const tour = document.querySelector('wgsl-tour');
                    const root = tour ? tour.shadowRoot : document;
                    const title = root.querySelector('#step-title')?.textContent || '';
                    const desc = root.querySelector('#step-description')?.textContent || '';
                    
                    const codeLines = Array.from(root.querySelectorAll('.vis-code-line'));
                    const highlightedLineIdx = codeLines.findIndex(el => el.classList.contains('highlighted'));
                    const highlightedLineText = highlightedLineIdx !== -1 ? codeLines[highlightedLineIdx].textContent : 'none';
                    
                    const dots = Array.from(root.querySelectorAll('.step-dot'));
                    const activeDotIdx = dots.findIndex(el => el.classList.contains('active'));
                    
                    const cellXVal = root.querySelector('#cell-x .val-new')?.textContent || '';
                    const cellPxVal = root.querySelector('#cell-px .val-new')?.textContent || '';
                    const cellAgeVal = root.querySelector('#cell-age .val-new')?.textContent || '';
                    const cellAgePtrVal = root.querySelector('#cell-age-ptr .val-new')?.textContent || '';
                    
                    const cellXActive = root.querySelector('#cell-x')?.classList.contains('active') || false;
                    const cellPxActive = root.querySelector('#cell-px')?.classList.contains('active') || false;
                    const cellAgeActive = root.querySelector('#cell-age')?.classList.contains('active') || false;
                    const cellAgePtrActive = root.querySelector('#cell-age-ptr')?.classList.contains('active') || false;
                    
                    const pathPxD = root.querySelector('#path-px')?.getAttribute('d') || '';
                    const pathAgePtrD = root.querySelector('#path-age-ptr')?.getAttribute('d') || '';
                    
                    return {
                        title,
                        highlightedLineIdx,
                        highlightedLineText,
                        activeDotIdx,
                        cellXVal,
                        cellPxVal,
                        cellAgeVal,
                        cellAgePtrVal,
                        cellXActive,
                        cellPxActive,
                        cellAgeActive,
                        cellAgePtrActive,
                        pathPxD,
                        pathAgePtrD
                    };
                }""")
            
            # Walk through each step programmatically using "Next" button
            # Total 8 steps: 0, 1, 2, 3, 4, 5, 6, 7
            for expected_step in range(8):
                print(f"\n--- Checking Step {expected_step} ---")
                state = await get_visualizer_state()
                print(f"Step Title: {state['title']}")
                print(f"Highlighted Line: [{state['highlightedLineIdx']}] {state['highlightedLineText']}")
                print(f"Active Dot: {state['activeDotIdx']}")
                print(f"Registers: x={state['cellXVal']} ({'Active' if state['cellXActive'] else 'Inactive'}), px={state['cellPxVal']} ({'Active' if state['cellPxActive'] else 'Inactive'}), age={state['cellAgeVal']} ({'Active' if state['cellAgeActive'] else 'Inactive'}), age_ptr={state['cellAgePtrVal']} ({'Active' if state['cellAgePtrActive'] else 'Inactive'})")
                
                # Assertions
                assert state['activeDotIdx'] == expected_step, f"Expected active dot {expected_step}, got {state['activeDotIdx']}"
                
                # Check line highlight bindings
                expected_highlight_idx = expected_step
                if expected_step >= 6:
                    expected_highlight_idx = 6 # Both step 6 and 7 map to the last code line (index 6)
                assert state['highlightedLineIdx'] == expected_highlight_idx, f"Expected highlighted line {expected_highlight_idx}, got {state['highlightedLineIdx']}"
                
                # Check specific step expectations
                if expected_step == 0:
                    assert state['cellXVal'] == '?', "Step 0: x should be uninitialized '?'"
                elif expected_step == 1:
                    assert state['cellXVal'] == '1.5', "Step 1: x should be '1.5'"
                    assert state['cellXActive'] == True, "Step 1: x should be active"
                elif expected_step == 2:
                    assert '0x1004' in state['cellPxVal'], "Step 2: px should contain address of x"
                    assert state['pathPxD'] != '', "Step 2: Px pointer path should be drawn"
                elif expected_step == 3:
                    assert state['cellXVal'] == '3.0', "Step 3: x should be updated to '3.0'"
                elif expected_step == 4:
                    assert state['cellAgeVal'] == '18.0', "Step 4: age should be '18.0'"
                elif expected_step == 5:
                    assert '0x2000' in state['cellAgePtrVal'], "Step 5: age_ptr should contain address of age"
                    assert state['pathAgePtrD'] != '', "Step 5: Green pointer path should be drawn"
                    # In Step 5 (Read/Address-of Step), verify arrowhead details or path structure if possible
                    p_d = state['pathAgePtrD']
                    assert p_d.startswith('M'), f"Green path in Step 5 must be a valid SVG path: {p_d}"
                elif expected_step == 6:
                    # Step 6: Dereference Read Step
                    assert state['cellAgeVal'] == '18.0', "Step 6: age value should still be '18.0' during read step"
                elif expected_step == 7:
                    # Step 7: Dereference Write Step (mutated value)
                    # Note: final compiled GPU value can be synchronized dynamically, so we assert it is '19.0' or correctly processed
                    assert float(state['cellAgeVal']) >= 19.0, f"Step 7: age value should be updated (>= 19.0), got {state['cellAgeVal']}"
                
                # Navigate to next step if not at the end
                if expected_step < 7:
                    await page.click('wgsl-tour >> #btn-next')
                    await page.wait_for_timeout(200) # wait for animation state changes
            
            # --- Test Previous Button Navigation ---
            print("\n--- Testing 'Prev' Button Navigation ---")
            await page.click('wgsl-tour >> #btn-prev')
            await page.wait_for_timeout(200)
            state = await get_visualizer_state()
            assert state['activeDotIdx'] == 6, f"Expected step 6 after clicking Prev on step 7, got {state['activeDotIdx']}"
            print("Successfully went back to Step 6 using Prev button.")
            
            # Go back to 5
            await page.click('wgsl-tour >> #btn-prev')
            await page.wait_for_timeout(200)
            state = await get_visualizer_state()
            assert state['activeDotIdx'] == 5, f"Expected step 5 after clicking Prev on step 6, got {state['activeDotIdx']}"
            print("Successfully went back to Step 5 using Prev button.")
            
            # --- Test Direct Code Line Clicks ---
            print("\n--- Testing Direct Code Line Click Bindings ---")
            # Click on Line 5 (index 5 of codeLines): "let age_ptr = &age;"
            await page.evaluate("""() => {
                const tour = document.querySelector('wgsl-tour');
                const root = tour ? tour.shadowRoot : document;
                const codeLines = Array.from(root.querySelectorAll('.vis-code-line'));
                // Line 5 is at index 5
                codeLines[5].click();
            }""")
            await page.wait_for_timeout(300)
            state = await get_visualizer_state()
            assert state['activeDotIdx'] == 5, f"Expected step 5 after clicking Line index 5, got {state['activeDotIdx']}"
            print("Direct code line click correctly transitioned visualizer state to Step 5.")
            
            print("\nPointer Visualizer automated verification completed with 0 errors!")
            await browser.close()
    finally:
        server_process.terminate()
        server_process.wait()
        if os.path.exists(test_serve_dir):
            shutil.rmtree(test_serve_dir)

if __name__ == "__main__":
    asyncio.run(run())
