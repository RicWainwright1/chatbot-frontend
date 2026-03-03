import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1400, height: 900 } });

test("sidebar with TIF logo", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(4000);

  // Check sidebar state
  const sidebarState = await page.evaluate(() => {
    const sidebar = document.querySelector('[data-slot="sidebar"]');
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
    return {
      sidebarExists: !!sidebar,
      wrapperExists: !!wrapper,
      sidebarHTML: sidebar?.outerHTML?.substring(0, 200),
      bodyWidth: document.body.clientWidth,
    };
  });
  console.log("=== SIDEBAR STATE:", JSON.stringify(sidebarState, null, 2));

  // Try to find and click the sidebar toggle
  const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
  const toggleExists = await sidebarToggle.count();
  console.log("=== SIDEBAR TOGGLE EXISTS:", toggleExists);

  if (toggleExists === 0) {
    // Try the first button in the header (the panel toggle icon)
    const panelButton = page.locator('header button, [data-slot="sidebar"] button').first();
    const panelCount = await panelButton.count();
    console.log("=== PANEL BUTTON COUNT:", panelCount);
    if (panelCount > 0) {
      await panelButton.click({ force: true });
      await page.waitForTimeout(1000);
    }
  } else {
    await sidebarToggle.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: "/tmp/tif-sidebar-open.png" });

  // Check logo image state
  const logo = page.locator('img[alt="The Insights Family"]');
  const logoCount = await logo.count();
  console.log("=== LOGO COUNT:", logoCount);

  if (logoCount > 0) {
    const box = await logo.boundingBox();
    console.log("=== LOGO POSITION:", JSON.stringify(box));

    const info = await logo.evaluate((el: HTMLImageElement) => ({
      src: el.src,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      offsetWidth: el.offsetWidth,
      offsetHeight: el.offsetHeight,
      computedFilter: window.getComputedStyle(el).filter,
      computedDisplay: window.getComputedStyle(el).display,
      parentBg: window.getComputedStyle(el.closest('[data-sidebar="sidebar"]') || el.parentElement!).backgroundColor,
    }));
    console.log("=== LOGO DETAILS:", JSON.stringify(info, null, 2));
  }
});
