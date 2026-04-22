
export interface TestResult {
  name: string;
  group: string;
  status: 'passed' | 'failed' | 'running' | 'idle';
  message?: string;
  duration?: number;
}

export type Assertion = {
  expect: (actual: any) => {
    toBe: (expected: any) => void;
    toBeCloseTo: (expected: number, precision?: number) => void;
    toContain: (item: any) => void;
  }
};

class TestRunner {
  private results: TestResult[] = [];

  private assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
  }

  expect(actual: any) {
    return {
      toBe: (expected: any) => {
        this.assert(actual === expected, `Expected ${expected} but received ${actual}`);
      },
      toBeCloseTo: (expected: number, precision: number = 2) => {
        const diff = Math.abs(actual - expected);
        const threshold = Math.pow(10, -precision) / 2;
        this.assert(diff < threshold, `Expected ${actual} to be close to ${expected}`);
      },
      toContain: (item: any) => {
        this.assert(Array.isArray(actual) && actual.includes(item), `Expected array to contain ${item}`);
      }
    };
  }

  async runTest(group: string, name: string, fn: (t: TestRunner) => Promise<void> | void): Promise<TestResult> {
    const start = performance.now();
    try {
      await fn(this);
      return { group, name, status: 'passed', duration: performance.now() - start };
    } catch (e: any) {
      return { group, name, status: 'failed', message: e.message, duration: performance.now() - start };
    }
  }
}

export const testRunner = new TestRunner();
