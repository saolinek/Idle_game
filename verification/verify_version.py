from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local HTML
        page.goto(f"file://{os.getcwd()}/index.html")

        # Check Stats tab for version 1.3
        page.click("#nav-stats")
        page.screenshot(path="verification/version_check.png")

        # Verify version logic with JS evaluation
        # Mock localStorage behavior test
        # We can't easily test 'location.reload()' in a simple script without handling the navigation,
        # but we can check if the version is stored correctly.

        stored_version = page.evaluate("localStorage.getItem('crystal_game_version')")
        print(f"Stored Version: {stored_version}")

        if stored_version != "1.3":
            print("FAILURE: Version not stored correctly.")
        else:
            print("SUCCESS: Version stored correctly.")

        browser.close()

if __name__ == "__main__":
    run()