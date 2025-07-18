import AnalyticsFunctionalTest from './analytics-functional-test';

// Test Runner for Analytics Dashboard
class AnalyticsTestRunner {
  private testSuite: AnalyticsFunctionalTest;

  constructor() {
    this.testSuite = new AnalyticsFunctionalTest();
  }

  async runTests() {
    console.log('🧪 Starting Analytics Dashboard Functional Tests...');
    console.log('=' .repeat(60));

    try {
      const results = await this.testSuite.runAllTests();
      
      console.log('\n📊 FINAL TEST RESULTS');
      console.log('=' .repeat(60));
      
      // Display summary
      console.log(`Total Tests: ${results.summary.total}`);
      console.log(`✅ Passed: ${results.summary.passed}`);
      console.log(`❌ Failed: ${results.summary.failed}`);
      console.log(`⚠️  Warnings: ${results.summary.warnings}`);
      
      // Display detailed results
      console.log('\n📋 DETAILED RESULTS');
      console.log('=' .repeat(60));
      
      results.tests.forEach((test, index) => {
        const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
        const performance = test.performance ? ` (${test.performance.toFixed(2)}ms)` : '';
        
        console.log(`${index + 1}. ${statusIcon} ${test.component} - ${test.test}${performance}`);
        console.log(`   ${test.details}`);
        console.log('');
      });

      // Generate recommendations
      this.generateRecommendations(results);
      
      return results;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  private generateRecommendations(results: any) {
    console.log('\n🔧 RECOMMENDATIONS');
    console.log('=' .repeat(60));
    
    const failedTests = results.tests.filter((t: any) => t.status === 'FAIL');
    const warningTests = results.tests.filter((t: any) => t.status === 'WARNING');
    
    if (failedTests.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO FIX:');
      failedTests.forEach((test: any) => {
        console.log(`• ${test.component}: ${test.test} - ${test.details}`);
      });
    }
    
    if (warningTests.length > 0) {
      console.log('\n⚠️  IMPROVEMENTS NEEDED:');
      warningTests.forEach((test: any) => {
        console.log(`• ${test.component}: ${test.test} - ${test.details}`);
      });
    }
    
    // Performance recommendations
    const slowTests = results.tests.filter((t: any) => t.performance && t.performance > 1000);
    if (slowTests.length > 0) {
      console.log('\n⚡ PERFORMANCE OPTIMIZATIONS:');
      slowTests.forEach((test: any) => {
        console.log(`• ${test.component}: ${test.test} - ${test.performance?.toFixed(2)}ms (should be < 1000ms)`);
      });
    }
  }
}

// Export for use in browser console
(window as any).runAnalyticsTests = async () => {
  const runner = new AnalyticsTestRunner();
  return await runner.runTests();
};

// Auto-run tests when page loads (optional)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait for analytics page to be fully loaded
    setTimeout(async () => {
      if (window.location.pathname.includes('/analytics')) {
        console.log('🔍 Analytics page detected, running tests...');
        const runner = new AnalyticsTestRunner();
        await runner.runTests();
      }
    }, 2000);
  });
}

export default AnalyticsTestRunner; 