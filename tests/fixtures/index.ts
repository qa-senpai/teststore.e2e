import { mergeTests } from "@playwright/test";
import { test as pagesTest } from "./pages";
import { test as authTest } from "./auth";

export const test = mergeTests(pagesTest, authTest);
export { expect } from "@playwright/test";
