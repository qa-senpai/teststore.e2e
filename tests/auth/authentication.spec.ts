import { test } from '@playwright/test';
import { createUniqueUser, User } from '../../data/users';
import { LoginPage } from '../../pages/LoginPage';
import { MyAccountPage } from '../../pages/MyAccountPage';
import { RegistrationPage } from '../../pages/RegistrationPage';

test.describe('User authentication', () => {
  let user: User;

  // The shop has no seeded account, so register a fresh one, then sign out.
  test.beforeEach(async ({ page }) => {
    user = createUniqueUser();
    const registration = new RegistrationPage(page);
    await registration.open();
    await registration.register(user);
    await new MyAccountPage(page).signOut();
  });

  test('user can log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const myAccount = new MyAccountPage(page);

    await loginPage.open();
    await loginPage.login(user.email, user.password);

    await myAccount.expectLoggedIn(`${user.firstName} ${user.lastName}`);
  });

  test('user cannot log in with a wrong password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(user.email, 'WrongPassword!1');

    await loginPage.expectAuthenticationError();
  });

  test('user can log out', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const myAccount = new MyAccountPage(page);

    await loginPage.open();
    await loginPage.login(user.email, user.password);
    await myAccount.signOut();

    await myAccount.expectLoggedOut();
  });
});
