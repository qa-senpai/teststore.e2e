import { Page } from '@playwright/test';
import type { User } from '../../../../tests/e2e/search/data';
import { BasePage } from '../BasePage';
import { RegistrationPageLocators } from './RegistrationPageLocators';

export class RegistrationPage extends BasePage {
  url = '/index.php?controller=registration';

  private readonly locators: RegistrationPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new RegistrationPageLocators(page);
  }

  async register(user: User): Promise<void> {
    await this.locators.firstNameInput.fill(user.firstName);
    await this.locators.lastNameInput.fill(user.lastName);
    await this.locators.emailInput.fill(user.email);
    await this.locators.passwordInput.fill(user.password);
    await this.locators.gdprCheckbox.check();
    await this.locators.saveButton.click();
  }
}
