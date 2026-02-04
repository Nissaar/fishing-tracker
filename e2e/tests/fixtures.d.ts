import type { Expect, TestType, APIResponse, Page } from '@playwright/test';

export type ApiHelper = {
  url: string;
  getAuthHeaders: (token: string) => Record<string, string>;
  login: (email: string, password: string) => Promise<string>;
  createFishingLog: (token: string, logData: unknown) => Promise<APIResponse>;
  getFishingLogs: (token: string, limit?: number) => Promise<APIResponse>;
  deleteFishingLog: (token: string, logId: string) => Promise<APIResponse>;
  getLocations: () => Promise<APIResponse>;
  getConditions: () => Promise<APIResponse>;
  submitContact: (data: unknown) => Promise<APIResponse>;
  healthCheck: () => Promise<APIResponse>;
};

export type PageHelper = {
  waitForToast: (message?: string, type?: 'success' | 'error') => Promise<void>;
  closeToast: () => Promise<void>;
  waitForLoadingComplete: () => Promise<void>;
  navigateToDashboardTab: (tabName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  isVisible: (selector: string) => Promise<boolean>;
  getSelectOptions: (selector: string) => Promise<string[]>;
  selectByText: (selector: string, text: string) => Promise<void>;
  fillDate: (selector: string, date: string) => Promise<void>;
  fillTime: (selector: string, time: string) => Promise<void>;
  takeScreenshot: (name: string) => Promise<void>;
};

export type TestData = {
  randomUser: () => { username: string; email: string; password: string };
  fishingLog: () => Record<string, unknown>;
  contactMessage: () => { name: string; email: string; subject: string; message: string };
  locations: { id: string; name: string }[];
  fishingTypes: string[];
  fishingMethods: string[];
};

export type Fixtures = {
  apiHelper: ApiHelper;
  pageHelper: PageHelper;
  testData: TestData;
};

export const test: TestType<Fixtures>;
export const expect: Expect;
