from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        page.goto(f"file://{os.getcwd()}/index.html")

        # Click stats tab to check version
        page.click("#nav-stats")
        page.screenshot(path="verification/stats.png")

        # Click ascension tab to check upgrades
        page.click("#nav-prestige")
        page.screenshot(path="verification/ascension.png")

        # Cheat some sigils to unlock upgrades availability visually
        # Using evaluate to run JS in context
        page.evaluate("window.Game.state.stars = 100")
        page.evaluate("window.UI.render()")
        page.screenshot(path="verification/ascension_unlocked.png")

        browser.close()

if __name__ == "__main__":
    run()