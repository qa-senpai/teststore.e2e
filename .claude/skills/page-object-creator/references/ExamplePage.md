# Example

```typescript
import type { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { LoginPageLocators } from './LoginPageLocators';

export class LoginPage extends BasePage {
  url = '/';

  private readonly locators: LoginPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new LoginPageLocators(page);
  }

  async loginUser(userName: string, password: string): Promise<void> {
    await this.open();
    await this.locators.usernameInput.fill(userName);
    await this.locators.passwordInput.fill(password);
    await this.locators.loginButton.click();
  }
}
```

Place this class in `pages/LoginPage/LoginPage.ts` alongside `LoginPageLocators.ts`.
Expose it through `pages/LoginPage/index.ts`:

```typescript
export { LoginPage } from './LoginPage';
```

Re-export the folder from `pages/index.ts`:

```typescript
export { BasePage } from './BasePage';
export { LoginPage } from './LoginPage';
```

Consumers use `import { LoginPage } from '@pages'` after configuring the alias in `tsconfig.json`.
