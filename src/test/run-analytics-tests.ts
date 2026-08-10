import AnalyticsFunctionalTest, {
  type TestResult,
  type TestSuite,
} from "./analytics-functional-test";

// Test Runner for Analytics Dashboard
class AnalyticsTestRunner {
  private testSuite: AnalyticsFunctionalTest;

  constructor() {
    this.testSuite = new AnalyticsFunctionalTest();
  }

  async runTests() {

    try {
      const results = await this.testSuite.runAllTests();


      // Display summary

      // Display detailed results

      results.tests.forEach((test, index) => {
        const statusIcon =
          test.status === "PASS" ? "✅" : test.status === "FAIL" ? "❌" : "⚠️";
        const performance = test.performance
          ? ` (${test.performance.toFixed(2)}ms)`
          : "";

        console.log(
          `${index + 1}. ${statusIcon} ${test.component} - ${test.test}${performance}`
        );
      });

      // Generate recommendations
      this.generateRecommendations(results);

      return results;
    } catch (error) {
      console.error("❌ Test execution failed:", error);
      throw error;
    }
  }

  private generateRecommendations(results: TestSuite) {

    const failedTests = results.tests.filter((t: TestResult) => t.status === "FAIL");
    const warningTests = results.tests.filter(
      (t: TestResult) => t.status === "WARNING",
    );

    if (failedTests.length > 0) {
      failedTests.forEach((test: TestResult) => {
        console.log(`Failed: ${test.component} - ${test.test}`);
      });
    }

    if (warningTests.length > 0) {
      warningTests.forEach((test: TestResult) => {
        console.log(`Warning: ${test.component} - ${test.test}`);
      });
    }

    // Performance recommendations
    const slowTests = results.tests.filter(
      (t: TestResult) => t.performance && t.performance > 1000,
    );
    if (slowTests.length > 0) {
      slowTests.forEach((test: TestResult) => {
        console.log(
          `• ${test.component}: ${test.test} - ${test.performance?.toFixed(2)}ms (should be < 1000ms)`
        );
      });
    }
  }
}

// Export for use in browser console
(window as Window & { runAnalyticsTests?: () => Promise<TestSuite> }).runAnalyticsTests = async () => {
  const runner = new AnalyticsTestRunner();
  return await runner.runTests();
};

// Auto-run tests when page loads (optional)
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    // Wait for analytics page to be fully loaded
    setTimeout(async () => {
      if (window.location.pathname.includes("/analytics")) {
        const runner = new AnalyticsTestRunner();
        await runner.runTests();
      }
    }, 2000);
  });
}

export default AnalyticsTestRunner;
