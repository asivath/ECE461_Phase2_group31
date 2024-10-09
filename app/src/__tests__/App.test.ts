import { test, expect } from "./baseFixtures";

test.describe("Main Page Tests", () => {
  test("should load the main page and display the navbar with title and logo", async ({ page }) => {
    await page.goto("http://localhost:5173");

    const navbar = page.locator(".MuiToolbar-root");
    await expect(navbar).toBeVisible();

    const title = await navbar.innerText();
    expect(title).toContain("package-rater");

    const logo = page.locator("img[alt='logo']");
    await expect(logo).toBeVisible();
  });

  test("should load the main page and display the search bar", async ({ page }) => {
    await page.goto("http://localhost:5173");

    const searchBar = page.locator('input[placeholder="Type package name..."]');
    await expect(searchBar).toBeVisible();
  });

  test("should load the main page and display the search button and when clicked should console log the input value", async ({
    page
  }) => {
    await page.goto("http://localhost:5173");

    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));

    const searchBar = page.locator('input[placeholder="Type package name..."]');
    await searchBar.fill("as;dlkfajs;ldkfja;s");
    const searchButton = page.locator("button");
    await searchButton.click();

    expect(logs).toContain("as;dlkfajs;ldkfja;s");
  });
});
