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
