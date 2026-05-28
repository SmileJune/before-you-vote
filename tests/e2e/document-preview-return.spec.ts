import { expect, type Page, test } from "@playwright/test";

const dongtanElectionUrl =
  "/?region=gyeonggi-hwaseong-dongtan&area=gyeonggi-hwaseong-dongtan-%EB%8F%99%ED%83%845%EB%8F%99&election=gyeonggi-hwaseong-dongtan-3-%EA%B2%BD%EA%B8%B0%EB%8F%84";
const pamphletLinkSelector = 'a[href^="/document-preview"][href*="title=%EA%B3%B5%EB%B3%B4"]';

test.describe("document preview return flow", () => {
  test("restores URL, selection, and scroll position after browser back", async ({ page }) => {
    await page.goto(dongtanElectionUrl);
    await expect(page.getByRole("heading", { name: "경기도 화성시동탄구" })).toBeVisible();

    const beforeScrollY = await scrollThirdPamphletIntoView(page);
    const href = await page.locator(pamphletLinkSelector).nth(2).getAttribute("href");

    expect(href).toContain("returnTo=");

    await page.locator(pamphletLinkSelector).nth(2).click();
    await expect(page).toHaveURL(/\/document-preview\?/);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(dongtanElectionUrl)));
    await expect(page.getByRole("heading", { name: "경기도 화성시동탄구" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "후보별 상세" })).toBeVisible();
    await expectScrollNear(page, beforeScrollY);
  });

  test("restores URL, selection, and scroll position after in-app back button", async ({ page }) => {
    await page.goto(dongtanElectionUrl);
    await expect(page.getByRole("heading", { name: "경기도 화성시동탄구" })).toBeVisible();

    const beforeScrollY = await scrollThirdPamphletIntoView(page);

    await page.locator(pamphletLinkSelector).nth(2).click();
    await expect(page).toHaveURL(/\/document-preview\?/);

    await page.getByRole("link", { name: "돌아가기" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(dongtanElectionUrl)));
    await expect(page.getByRole("heading", { name: "경기도 화성시동탄구" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "후보별 상세" })).toBeVisible();
    await expectScrollNear(page, beforeScrollY);
  });
});

async function scrollThirdPamphletIntoView(page: Page) {
  const pamphletLinks = page.locator(pamphletLinkSelector);

  await expect(pamphletLinks).toHaveCount(5);
  await pamphletLinks.nth(2).scrollIntoViewIfNeeded();

  return page.evaluate(() => window.scrollY);
}

async function expectScrollNear(page: Page, expectedScrollY: number) {
  await expect
    .poll(async () => page.evaluate((target) => Math.abs(window.scrollY - target), expectedScrollY))
    .toBeLessThanOrEqual(120);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
