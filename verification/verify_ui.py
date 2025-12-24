from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        page.goto(f"file://{os.getcwd()}/index.html")

        # 1. Verify Upgrade Cards (Production Tab)
        # Should show "+X /s" instead of progress bar
        # Unlock some upgrades by giving resources
        page.evaluate("window.Game.state.bytes = 10000")
        page.evaluate("window.UI.render()")
        page.screenshot(path="verification/production_cards.png")

        # 2. Verify Active Bonuses (Stats Tab)
        # Need to unlock some bonuses first
        page.evaluate("window.Game.state.stars = 100")
        # Buy Expansion (0) -> x3
        page.evaluate("window.Game.buyAscension(0)")
        # Buy Optimization (1) -> -20% cost
        page.evaluate("window.Game.buyAscension(1)")
        # Switch tab
        page.click("#nav-stats")
        page.screenshot(path="verification/active_bonuses.png")

        browser.close()

if __name__ == "__main__":
    run()