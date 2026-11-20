import { Page } from '@playwright/test';

export abstract class BasePage {
  abstract url: string;

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(this.url);
  }
}
