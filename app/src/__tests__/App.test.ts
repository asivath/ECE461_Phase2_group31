import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Builder, By, ThenableWebDriver, logging } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";

let driver: ThenableWebDriver;

beforeAll(async () => {
  const options = new chrome.Options();
  options.addArguments("--no-sandbox");
  options.addArguments("--headless");
  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setLoggingPrefs({ browser: "ALL" })
    .build();
});

afterAll(async () => {
  await driver.quit();
});

describe("Main Page Tests", () => {
  it("should load the main page and display the navbar with title and logo", async () => {
    await driver.get("http://localhost:5173");
    const navbar = await driver.findElement(By.css(".MuiToolbar-root"));
    expect(await navbar.isDisplayed()).toBe(true);

    const title = await navbar.findElement(By.xpath(".//*[contains(text(), 'package-rater')]"));
    expect(await title.isDisplayed()).toBe(true);

    const logo = await navbar.findElement(By.css("img[alt='logo']"));
    expect(await logo.isDisplayed()).toBe(true);
  });
  it("should load the main page and display the search bar", async () => {
    await driver.get("http://localhost:5173");
    const searchBar = await driver.findElement(By.css('input[placeholder="Type package name..."]'));
    expect(await searchBar.isDisplayed()).toBe(true);
  });
  it("should load the main page and display the search button and when clicked should console log the input value", async () => {
    await driver.get("http://localhost:5173");
    const searchBar = await driver.findElement(By.css('input[placeholder="Type package name..."]'));
    await searchBar.sendKeys("as;dlkfajs;ldkfja;s");
    const searchButton = await driver.findElement(By.css("button"));
    await searchButton.click();
    const logs = await driver.manage().logs().get(logging.Type.BROWSER);
    const logMessages = logs.map((log) => log.message);
    expect(logMessages.some((message) => message.includes("as;dlkfajs;ldkfja;s"))).toBe(true);
  });
});
