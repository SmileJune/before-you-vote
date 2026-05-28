import { expect, test } from "@playwright/test";

const dongtanElectionUrl =
  "/?region=gyeonggi-hwaseong-dongtan&area=gyeonggi-hwaseong-dongtan-%EB%8F%99%ED%83%845%EB%8F%99&election=gyeonggi-hwaseong-dongtan-3-%EA%B2%BD%EA%B8%B0%EB%8F%84";

test("comparison table shows and hides the horizontal scroll hint", async ({ page }) => {
  await page.goto(dongtanElectionUrl);

  const comparisonScroller = page.getByLabel("후보 비교 표");
  const scrollHint = page.getByText("밀기", { exact: true });

  await expect(comparisonScroller).toBeVisible();
  await expect(scrollHint).toBeVisible();
  expect(await comparisonScroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  await comparisonScroller.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  await expect(scrollHint).toBeHidden();
});
