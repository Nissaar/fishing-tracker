declare module '@playwright/test' {
  export type APIResponse = any;
  export type Page = any;
  export type Expect = any;
  export type TestType<T> = {
    (title: string, fn: (args: T & { request: any; page?: any }) => Promise<void> | void): void;
    describe: (title: string, fn: () => void) => void;
    beforeAll: (fn: (args: T & { request: any }) => Promise<void> | void) => void;
    skip: () => void;
    extend: (fixtures: Record<string, any>) => TestType<any>;
  };
  export const test: TestType<any>;
  export const expect: Expect;
}

declare module '@faker-js/faker' {
  export const faker: any;
}

declare const process: { env: Record<string, string | undefined> };
