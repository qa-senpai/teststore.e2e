import { APIRequestContext, expect } from '@playwright/test';

// PrestaShop has no JSON auth API: login is the same form POST the browser sends
// (captured in teststore.automationtesting.co.uk.har). On success the server answers
// 302 and sets the `PrestaShop-<hash>` session cookie on the request context.
export class UserController {
  constructor(private readonly request: APIRequestContext) {}

  async loginAsUser(email: string, password: string): Promise<void> {
    const response = await this.request.post(
      '/index.php?controller=authentication',
      {
        form: { email, password, submitLogin: '1', back: 'my-account' },
        maxRedirects: 0,
      },
    );
    // A failed login re-renders the form with 200, so only a redirect means success.
    expect(response.status(), `API login failed for ${email}`).toBe(302);
  }
}
