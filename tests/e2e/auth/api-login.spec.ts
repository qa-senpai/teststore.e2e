import { test, expect } from '../../fixtures';

// A guest opening my-account is redirected to the login form, so staying on it proves the session.
test('user is logged in via API', async ({
  page,
  login: _login,
  myAccountPage,
}) => {
  await myAccountPage.open();

  await expect(page).toHaveURL(/controller=my-account/);
  await expect(page.locator('a.logout')).toBeVisible();
});
