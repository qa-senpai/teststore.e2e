import { mergeTests } from "@playwright/test";
import { test as pagesTest } from "./pages";
import { test as authTest } from "./auth";
import { test as consoleTest } from "./console";
import { test as cartTest } from "./cart";

export const test = mergeTests(pagesTest, authTest, consoleTest, cartTest);
export { expect } from "@playwright/test";
export type { ConsoleErrorRule } from "./console";
