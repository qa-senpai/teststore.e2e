import { test, expect } from "../../fixtures";
import { defaultUser } from "../search/data";

test.use({ userToLogin: defaultUser });

// A guest opening my-account is redirected to the login form, so staying on it proves the session.
test("user is logged in via API", async ({ page, myAccountPage }) => {
  await myAccountPage.open();

  await expect(page).toHaveURL(/controller=my-account/);
  await expect(page.locator("a.logout")).toBeVisible();
});
