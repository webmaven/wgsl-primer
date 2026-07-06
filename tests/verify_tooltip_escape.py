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
    print("Scientific Diagnostic: Verification of Tooltip Escape Key and Run Button behavior...")
    
    repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    site_dir = os.path.join(repo_dir, "site")
    test_serve_dir = os.path.join(repo_dir, "test_serve")
    
    # Ensure site is built
    print("Ensuring latest build of documentation...")
    subprocess.run(["npm", "run", "build"], cwd=repo_dir, stdout=subprocess.DEVNULL)
        
    os.makedirs(test_serve_dir, exist_ok=True)
    symlink_path = os.path.join(test_serve_dir, "wgsl-primer")
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
    
    time.sleep(1.0)
    
    success = False
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--enable-unsafe-webgpu", "--no-sandbox"]
            )
            context = await browser.new_context(viewport={"width": 1280, "height": 900})
            page = await context.new_page()
            
            # Setup console and error logging from the browser
            page.on("console", lambda msg: print(f"[Browser Console {msg.type}] {msg.text}"))
            page.on("pageerror", lambda err: print(f"[Browser Error] {err.message}"))
            
            url = f"http://localhost:{port}/wgsl-primer/index.html"
            print(f"Navigating to page: {url}")
            await page.goto(url)
            
            # Wait for wgsl-tour to be fully mounted
            print("Waiting for wgsl-tour element...")
            tour_locator = page.locator("wgsl-tour")
            await tour_locator.wait_for(state="visible", timeout=10000)
            
            # Wait for CodeMirror to render and be visible
            print("Waiting for CodeMirror content area...")
            editor_content = page.locator("wgsl-tour >> .cm-content")
            await editor_content.wait_for(state="visible", timeout=10000)
            await page.wait_for_timeout(2000) # extra buffer for CodeMirror to fully load
            
            # =========================================================================
            # FEATURE VERIFICATION: Run Button Disabled Logic
            # =========================================================================
            print("\n--- Verifying Run Button Disabled Logic ---")
            
            # Get initial checked state of "Live Updates" and disabled state of "Run" button
            is_checked, is_disabled = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const toggle = tour.shadowRoot.querySelector("#live-updates-toggle");
                const btn = tour.shadowRoot.querySelector(".run-button");
                return [toggle.checked, btn.disabled];
            }""")
            print(f"Initial: Live Updates toggle checked = {is_checked}, Run button disabled = {is_disabled}")
            
            assert is_checked, "Live Updates toggle should be checked by default!"
            assert is_disabled, "Run button should be disabled when Live Updates is ON!"
            print("SUCCESS: Run button is correctly disabled by default when Live Updates is ON.")
            
            # Click Live Updates toggle to turn it OFF
            print("Toggling Live Updates OFF...")
            await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const toggle = tour.shadowRoot.querySelector("#live-updates-toggle");
                toggle.click();
            }""")
            await page.wait_for_timeout(500)
            
            is_checked, is_disabled = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const toggle = tour.shadowRoot.querySelector("#live-updates-toggle");
                const btn = tour.shadowRoot.querySelector(".run-button");
                return [toggle.checked, btn.disabled];
            }""")
            print(f"After toggle OFF: Live Updates checked = {is_checked}, Run button disabled = {is_disabled}")
            
            assert not is_checked, "Live Updates toggle should be unchecked!"
            assert not is_disabled, "Run button should be enabled when Live Updates is OFF!"
            print("SUCCESS: Run button is correctly enabled when Live Updates is turned OFF.")
            
            # Click Live Updates toggle to turn it back ON
            print("Toggling Live Updates back ON...")
            await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const toggle = tour.shadowRoot.querySelector("#live-updates-toggle");
                toggle.click();
            }""")
            await page.wait_for_timeout(500)
            
            is_checked, is_disabled = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const toggle = tour.shadowRoot.querySelector("#live-updates-toggle");
                const btn = tour.shadowRoot.querySelector(".run-button");
                return [toggle.checked, btn.disabled];
            }""")
            print(f"After toggle back ON: Live Updates checked = {is_checked}, Run button disabled = {is_disabled}")
            
            assert is_checked, "Live Updates toggle should be checked again!"
            assert is_disabled, "Run button should be disabled when Live Updates is ON!"
            print("SUCCESS: Run button is correctly disabled when Live Updates is turned back ON.")
            
            # =========================================================================
            # BUG FIX VERIFICATION: Tooltip Dismissal on Escape
            # =========================================================================
            print("\n--- Verifying Tooltip Dismissal on Escape ---")
            
            # Click outside the editor to ensure focus is outside
            print("Clicking outside the editor to ensure focus is outside...")
            await page.click("h1")
            
            # Verify focus is not in the editor
            is_focused_init = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                return tour.editor.hasFocus;
            }""")
            print(f"Is editor focused initially? {is_focused_init}")
            assert not is_focused_init, "Editor should not be focused initially!"
            
            # Scroll the editor fully into view to make sure viewport coordinates are reliable
            print("Scrolling editor into view...")
            await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                tour.scrollIntoView({ block: "center", inline: "nearest" });
            }""")
            await page.wait_for_timeout(500)
            
            # Print HTML of .cm-content for debugging
            cm_html = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const cmContent = tour ? tour.shadowRoot.querySelector(".cm-content") : null;
                return cmContent ? cmContent.innerHTML : "No cm-content found!";
            }""")
            print(f"DEBUG CodeMirror content innerHTML: {cm_html[:1200]}")
            
            # Locate target keyword/builtin containing 'sin', '@builtin', or '@vertex' safely in browser DOM
            print("Evaluating target element position inside Shadow DOM...")
            rect = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const cmContent = tour.shadowRoot.querySelector(".cm-content");
                // Let's find any child node/element that contains text we care about
                const allElements = Array.from(cmContent.querySelectorAll("*"));
                const target = allElements.find(el => {
                    const txt = el.textContent || "";
                    // Check if it's a leaf node or small span containing keyword or builtin
                    return (txt === "sin" || txt === "vertex_index" || txt === "vtx_main" || txt.includes("builtin")) && el.children.length === 0;
                });
                if (!target) {
                    // Fallback to searching any element with text
                    const fallback = allElements.find(el => (el.textContent === "fn" || el.textContent === "var") && el.children.length === 0);
                    if (fallback) {
                        const r = fallback.getBoundingClientRect();
                        return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: fallback.textContent };
                    }
                    return null;
                }
                const r = target.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: target.textContent };
            }""")
            
            print(f"Element coordinates found: {rect}")
            assert rect is not None, "Could not find a valid keyword/builtin element to hover over!"
            
            # Hover over the evaluated coordinates using Playwright mouse
            print(f"Moving mouse to trigger hover at ({rect['x']}, {rect['y']}) for token '{rect.get('text')}'...")
            await page.mouse.move(rect['x'], rect['y'])
            await page.wait_for_timeout(1500)
            
            # Check if the tooltip is visible
            tooltip_visible = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const tooltip = tour.shadowRoot.querySelector(".wgsl-tooltip");
                return !!tooltip;
            }""")
            print(f"Is tooltip visible after hover? {tooltip_visible}")
            assert tooltip_visible, "Tooltip should be visible after hovering over a keyword!"
            
            # Double check that the editor is still not focused (hovering shouldn't focus it)
            is_focused_after_hover = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                return tour.editor.hasFocus;
            }""")
            print(f"Is editor focused after hover? {is_focused_after_hover}")
            assert not is_focused_after_hover, "Editor should remain unfocused after mere hovering!"
            
            # Press Escape key globally
            print("Pressing Escape key globally...")
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)
            
            # Tooltip should be closed now
            tooltip_visible_after_esc = await page.evaluate("""() => {
                const tour = document.querySelector("wgsl-tour");
                const tooltip = tour.shadowRoot.querySelector(".wgsl-tooltip");
                return !!tooltip;
            }""")
            print(f"Is tooltip visible after pressing Escape? {tooltip_visible_after_esc}")
            
            if tooltip_visible_after_esc:
                print("BUG REPRODUCED: Tooltip remains visible after Escape press when editor is not focused!")
                success = False
            else:
                print("SUCCESS: Tooltip is successfully closed after Escape press!")
                success = True
                
    except Exception as e:
        print(f"Test failed with error: {e}")
        success = False
    finally:
        server_process.terminate()
        server_process.wait()
        try:
            shutil.rmtree(test_serve_dir)
        except Exception:
            pass
            
    if not success:
        sys.exit(1)
    else:
        print("\nE2E Tooltip Escape and Run Button Verification successfully completed!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(run())
