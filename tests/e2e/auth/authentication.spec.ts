import { test } from '../../fixtures';
import { createUniqueUser } from '../search/data';
import type { User } from '../search/data';

test.describe('User authentication', () => {
  let user: User;

  // The shop has no seeded account, so register a fresh one, then sign out.
  test.beforeEach(async ({ registrationPage, myAccountPage }) => {
    user = createUniqueUser();
    await registrationPage.open();
    await registrationPage.register(user);
    await myAccountPage.signOut();
  });

  test('user can log in with valid credentials', async ({
    loginPage,
    myAccountPage,
  }) => {
    await loginPage.open();
    await loginPage.login(user.email, user.password);

    await myAccountPage.expectLoggedIn(`${user.firstName} ${user.lastName}`);
  });

  test('user cannot log in with a wrong password', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(user.email, 'WrongPassword!1');

    await loginPage.expectAuthenticationError();
  });

  test('user can log out', async ({ loginPage, myAccountPage }) => {
    await loginPage.open();
    await loginPage.login(user.email, user.password);
    await myAccountPage.signOut();

    await myAccountPage.expectLoggedOut();
  });
});
