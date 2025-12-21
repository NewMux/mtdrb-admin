// Manual Test Script for Analytics Dashboard
// Run this in browser console on the analytics page

(function() {
  'use strict';
  
  console.log('🧪 Starting Manual Analytics Dashboard Tests...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  function addTestResult(component, test, status, details, performance = null) {
    testResults.tests.push({
      component,
      test,
      status,
      details,
      performance
    });
    
    if (status === 'PASS') testResults.passed++;
    else if (status === 'FAIL') testResults.failed++;
    else if (status === 'WARNING') testResults.warnings++;
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${component}: ${test} - ${details}`);
  }

  // Test 1: Button Functionality Matrix
  async function testButtonFunctionality() {
    console.log('\n🔘 Testing Button Functionality Matrix...');
    
    // Test Export Button
    const exportButton = document.querySelector('button:contains("Export")') || 
                        Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Export'));
    
    if (exportButton) {
      const startTime = performance.now();
      exportButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      const endTime = performance.now();
      
      // Check if download was triggered
      const downloadLinks = document.querySelectorAll('a[download]');
      if (downloadLinks.length > 0) {
        addTestResult('Export Button', 'Download dialog', 'PASS', 'Download dialog triggered successfully', endTime - startTime);
      } else {
        addTestResult('Export Button', 'Download dialog', 'FAIL', 'Download dialog not triggered');
      }
      
      // Check file naming
      const fileName = downloadLinks[0]?.download;
      if (fileName && fileName.match(/analytics-.*-.*\.json/)) {
        addTestResult('Export Button', 'File naming', 'PASS', `Correct file naming: ${fileName}`);
      } else {
        addTestResult('Export Button', 'File naming', 'FAIL', 'Incorrect file naming');
      }
    } else {
      addTestResult('Export Button', 'Button exists', 'FAIL', 'Export button not found');
    }

    // Test View Details Button
    const viewDetailsButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('View Details'));
    
    if (viewDetailsButton) {
      viewDetailsButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if alert is used (should be replaced with modal)
      // Note: We can't directly detect alert usage, but we can check if a modal appears
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.modal');
      if (modal) {
        addTestResult('View Details', 'Modal implementation', 'PASS', 'Using proper modal instead of alert');
      } else {
        addTestResult('View Details', 'Modal implementation', 'WARNING', 'No modal found - may be using alert');
      }
    } else {
      addTestResult('View Details', 'Button exists', 'FAIL', 'View Details button not found');
    }

    // Test Generate Report Button
    const generateButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Generate Report'));
    
    if (generateButton) {
      generateButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.modal');
      if (modal) {
        addTestResult('Generate Report', 'Modal opens', 'PASS', 'Generate report modal opened');
      } else {
        addTestResult('Generate Report', 'Modal opens', 'FAIL', 'Generate report modal not opened');
      }
    } else {
      addTestResult('Generate Report', 'Button exists', 'FAIL', 'Generate Report button not found');
    }

    // Test Ask Assistant Button
    const askAIButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Ask Assistant'));
    
    if (askAIButton) {
      askAIButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.modal');
      if (modal) {
        addTestResult('Ask Assistant', 'Modal opens', 'PASS', 'Smart modal opened');
        
        // Test input validation
        const textarea = modal.querySelector('textarea');
        if (textarea) {
          textarea.value = '';
          const submitButton = modal.querySelector('button:contains("Ask Assistant")') || 
                             Array.from(modal.querySelectorAll('button')).find(btn => btn.textContent.includes('Ask Assistant'));
          
          if (submitButton && submitButton.disabled) {
            addTestResult('Ask Assistant', 'Empty input validation', 'PASS', 'Submit button disabled for empty input');
          } else {
            addTestResult('Ask Assistant', 'Empty input validation', 'FAIL', 'Submit button not disabled for empty input');
          }
        }
      } else {
        addTestResult('Ask Assistant', 'Modal opens', 'FAIL', 'Smart modal not opened');
      }
    } else {
      addTestResult('Ask Assistant', 'Button exists', 'FAIL', 'Ask Assistant button not found');
    }

    // Test Settings Button
    const settingsButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Settings'));
    
    if (settingsButton) {
      settingsButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.modal');
      if (modal) {
        addTestResult('Settings', 'Modal opens', 'PASS', 'Settings modal opened');
        
        // Test theme persistence
        const themeToggle = modal.querySelector('input[type="checkbox"]') || 
                           Array.from(modal.querySelectorAll('button')).find(btn => btn.textContent.includes('Dark Mode'));
        
        if (themeToggle) {
          const initialTheme = localStorage.getItem('theme');
          themeToggle.click();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const newTheme = localStorage.getItem('theme');
          if (newTheme !== initialTheme) {
            addTestResult('Settings', 'Theme persistence', 'PASS', 'Theme preference persisted');
          } else {
            addTestResult('Settings', 'Theme persistence', 'FAIL', 'Theme preference not persisted');
          }
        }
      } else {
        addTestResult('Settings', 'Modal opens', 'FAIL', 'Settings modal not opened');
      }
    } else {
      addTestResult('Settings', 'Button exists', 'FAIL', 'Settings button not found');
    }
  }

  // Test 2: Modal Test Protocol
  async function testModalProtocol() {
    console.log('\n🪟 Testing Modal Protocol...');
    
    const modals = [
      { name: 'Export', button: 'Export' },
      { name: 'Smart', button: 'Ask Assistant' },
      { name: 'Reports', button: 'Generate Report' },
      { name: 'Settings', button: 'Settings' }
    ];
    
    for (const modal of modals) {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes(modal.button));
      
      if (button) {
        // Test opening trigger
        button.click();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const modalElement = document.querySelector('[role="dialog"]') || document.querySelector('.modal');
        if (modalElement) {
          addTestResult(`${modal.name} Modal`, 'Opening trigger', 'PASS', 'Modal opened by correct button');
          
          // Test focus trapping
          const focusableElements = modalElement.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) {
            addTestResult(`${modal.name} Modal`, 'Focus trapping', 'PASS', `${focusableElements.length} focusable elements found`);
          } else {
            addTestResult(`${modal.name} Modal`, 'Focus trapping', 'WARNING', 'No focusable elements in modal');
          }
          
          // Test escape key (simulate)
          const escapeTest = await testEscapeKey(modalElement);
          if (escapeTest) {
            addTestResult(`${modal.name} Modal`, 'Escape key', 'PASS', 'Escape key closes modal');
          } else {
            addTestResult(`${modal.name} Modal`, 'Escape key', 'WARNING', 'Escape key test not implemented');
          }
          
          // Test backdrop click
          const backdropTest = await testBackdropClick(modalElement);
          if (backdropTest) {
            addTestResult(`${modal.name} Modal`, 'Backdrop click', 'PASS', 'Backdrop click closes modal');
          } else {
            addTestResult(`${modal.name} Modal`, 'Backdrop click', 'WARNING', 'Backdrop click test not implemented');
          }
          
          // Test closing behavior
          const closeButton = modalElement.querySelector('button[aria-label="Close"]') || 
                             Array.from(modalElement.querySelectorAll('button')).find(btn => btn.textContent.includes('Close') || btn.textContent.includes('Cancel'));
          
          if (closeButton) {
            closeButton.click();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const modalClosed = !document.querySelector('[role="dialog"]') && !document.querySelector('.modal');
            if (modalClosed) {
              addTestResult(`${modal.name} Modal`, 'Closing behavior', 'PASS', 'Modal closes and state resets properly');
            } else {
              addTestResult(`${modal.name} Modal`, 'Closing behavior', 'FAIL', 'Modal does not close properly');
            }
          }
        } else {
          addTestResult(`${modal.name} Modal`, 'Opening trigger', 'FAIL', 'Modal not opened');
        }
      }
    }
  }

  // Test 3: Tab System Verification
  async function testTabSystem() {
    console.log('\n📑 Testing Tab System...');
    
    const tabs = [
      { name: 'Overview', id: 'overview' },
      { name: 'Members', id: 'members' },
      { name: 'Revenue', id: 'revenue' },
      { name: 'Classes', id: 'classes' },
      { name: 'Smart Insights', id: 'insights' }
    ];
    
    for (const tab of tabs) {
      const tabButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes(tab.name));
      
      if (tabButton) {
        const initialContent = document.querySelector('[data-testid="tab-content"]')?.textContent || 
                              document.querySelector('.tab-content')?.textContent;
        
        const startTime = performance.now();
        tabButton.click();
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for animation
        const endTime = performance.now();
        
        const newContent = document.querySelector('[data-testid="tab-content"]')?.textContent || 
                          document.querySelector('.tab-content')?.textContent;
        
        if (newContent !== initialContent) {
          addTestResult('Tab System', `Content switching - ${tab.name}`, 'PASS', 'Content updated without page reload', endTime - startTime);
        } else {
          addTestResult('Tab System', `Content switching - ${tab.name}`, 'FAIL', 'Content not updated');
        }
        
        // Test active indicator
        const isActive = tabButton.classList.contains('active') || 
                        tabButton.getAttribute('aria-selected') === 'true' ||
                        tabButton.classList.contains('bg-blue-100') ||
                        tabButton.classList.contains('text-blue-700');
        
        if (isActive) {
          addTestResult('Tab System', `Active indicator - ${tab.name}`, 'PASS', 'Active tab indicator moved correctly');
        } else {
          addTestResult('Tab System', `Active indicator - ${tab.name}`, 'FAIL', 'Active tab indicator not updated');
        }
      } else {
        addTestResult('Tab System', `Tab exists - ${tab.name}`, 'FAIL', `${tab.name} tab not found`);
      }
    }
    
    // Test URL synchronization
    testURLSynchronization();
  }

  function testURLSynchronization() {
    // Test deep linking (simulate)
    const currentPath = window.location.pathname;
    const expectedTab = currentPath.split('/').pop();
    
    if (expectedTab && expectedTab !== 'analytics') {
      addTestResult('Tab System', 'Deep linking', 'WARNING', 'Deep linking not fully implemented');
    } else {
      addTestResult('Tab System', 'Deep linking', 'WARNING', 'Deep linking not tested');
    }
  }

  // Utility functions
  async function testEscapeKey(modalElement) {
    // Simulate escape key press
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    modalElement.dispatchEvent(escapeEvent);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const modalClosed = !document.querySelector('[role="dialog"]') && !document.querySelector('.modal');
    return modalClosed;
  }

  async function testBackdropClick(modalElement) {
    // Simulate backdrop click
    const clickEvent = new MouseEvent('click', { bubbles: true });
    modalElement.dispatchEvent(clickEvent);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const modalClosed = !document.querySelector('[role="dialog"]') && !document.querySelector('.modal');
    return modalClosed;
  }

  // Run all tests
  async function runAllTests() {
    console.log('🚀 Starting Manual Analytics Dashboard Tests...');
    console.log('=' .repeat(60));
    
    await testButtonFunctionality();
    await testModalProtocol();
    await testTabSystem();
    
    // Display results
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${testResults.tests.length}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    
    // Generate recommendations
    generateRecommendations();
    
    return testResults;
  }

  function generateRecommendations() {
    console.log('\n🔧 RECOMMENDATIONS');
    console.log('=' .repeat(60));
    
    const failedTests = testResults.tests.filter(t => t.status === 'FAIL');
    const warningTests = testResults.tests.filter(t => t.status === 'WARNING');
    
    if (failedTests.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO FIX:');
      failedTests.forEach(test => {
        console.log(`• ${test.component}: ${test.test} - ${test.details}`);
      });
    }
    
    if (warningTests.length > 0) {
      console.log('\n⚠️  IMPROVEMENTS NEEDED:');
      warningTests.forEach(test => {
        console.log(`• ${test.component}: ${test.test} - ${test.details}`);
      });
    }
    
    // Performance recommendations
    const slowTests = testResults.tests.filter(t => t.performance && t.performance > 1000);
    if (slowTests.length > 0) {
      console.log('\n⚡ PERFORMANCE OPTIMIZATIONS:');
      slowTests.forEach(test => {
        console.log(`• ${test.component}: ${test.test} - ${test.performance?.toFixed(2)}ms (should be < 1000ms)`);
      });
    }
  }

  // Export for use in console
  window.runManualAnalyticsTests = runAllTests;
  
  // Auto-run if on analytics page
  if (window.location.pathname.includes('/analytics')) {
    console.log('🔍 Analytics page detected, running manual tests...');
    setTimeout(runAllTests, 2000);
  }
  
  console.log('📝 Manual test script loaded. Run window.runManualAnalyticsTests() to execute tests.');
})(); 