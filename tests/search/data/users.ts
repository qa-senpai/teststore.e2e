export interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export function createUniqueUser(): User {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `qa.${id}@example.com`,
    password: 'Passw0rd!123',
  };
}

// Existing account used for API login. Override with USER_EMAIL / USER_PASSWORD.
export const defaultUser: Pick<User, 'email' | 'password'> = {
  email: process.env.USER_EMAIL ?? 'testsenp@gm.com',
  password: process.env.USER_PASSWORD ?? '12345678',
};
