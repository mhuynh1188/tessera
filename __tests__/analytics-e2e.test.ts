// End-to-End Tests for Complete Analytics User Flows
import { test, expect } from '@playwright/test';

test.describe('Analytics E2E User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and organization context
    await page.addInitScript(() => {
      window.localStorage.setItem('auth_token', 'mock_token');
      window.localStorage.setItem('organization_id', '11111111-1111-1111-1111-111111111111');
      window.localStorage.setItem('user_role', 'executive');
    });
  });

  test('Executive can access full analytics dashboard', async ({ page }) => {
    await page.goto('/analytics/enterprise');
    
    // Wait for analytics to load
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Verify executive-specific elements are present
    await expect(page.locator('[data-testid="stakeholder-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="behavior-patterns"]')).toBeVisible();
    await expect(page.locator('[data-testid="organizational-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="heatmap-visualization"]')).toBeVisible();
    
    // Verify executive-specific content
    await expect(page.locator('text=Organizational Health Score')).toBeVisible();
    await expect(page.locator('text=Strategic Insights')).toBeVisible();
    await expect(page.locator('text=Reputation Risk Level')).toBeVisible();
    
    // Test interactive elements
    await page.click('[data-testid="time-window-selector"]');
    await expect(page.locator('text=Last 7 days')).toBeVisible();
    await expect(page.locator('text=Last 30 days')).toBeVisible();
    await expect(page.locator('text=Last 90 days')).toBeVisible();
    
    console.log('✅ Executive analytics dashboard E2E test passed');
  });

  test('HR user sees appropriate restricted view', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('user_role', 'hr');
    });
    
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Verify HR-specific elements
    await expect(page.locator('text=Confidentiality Level')).toBeVisible();
    await expect(page.locator('text=Culture Improvement Score')).toBeVisible();
    await expect(page.locator('text=Actionable Insights')).toBeVisible();
    
    // Verify restricted access (executive elements should not be visible)
    await expect(page.locator('text=Strategic Insights')).not.toBeVisible();
    await expect(page.locator('text=Reputation Risk Level')).not.toBeVisible();
    
    console.log('✅ HR analytics view E2E test passed');
  });

  test('Manager has department-level access', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('user_role', 'manager');
    });
    
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Verify manager-specific elements
    await expect(page.locator('text=Team Guidance Effectiveness')).toBeVisible();
    await expect(page.locator('text=Early Warning Count')).toBeVisible();
    await expect(page.locator('text=Team Trust Score')).toBeVisible();
    
    // Verify department-level data filtering
    const behaviorPatterns = page.locator('[data-testid="behavior-patterns"] .pattern-item');
    await expect(behaviorPatterns).toHaveCount(3); // Should see filtered patterns
    
    console.log('✅ Manager analytics view E2E test passed');
  });

  test('Real-time updates work correctly', async ({ page }) => {
    await page.goto('/analytics/enterprise?realtime=true');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Verify real-time indicator is shown
    await expect(page.locator('[data-testid="realtime-indicator"]')).toBeVisible();
    await expect(page.locator('text=Live Updates')).toBeVisible();
    
    // Wait for a real-time update to occur
    await page.waitForSelector('[data-testid="realtime-update-notification"]', { timeout: 15000 });
    
    // Verify update notification appears
    await expect(page.locator('text=New data available')).toBeVisible();
    
    // Click to apply update
    await page.click('[data-testid="apply-update-button"]');
    
    // Verify dashboard refreshes with new data
    await page.waitForSelector('[data-testid="analytics-dashboard"][data-updated="true"]', { timeout: 5000 });
    
    console.log('✅ Real-time updates E2E test passed');
  });

  test('Heatmap visualization is interactive', async ({ page }) => {
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="heatmap-visualization"]', { timeout: 10000 });
    
    // Verify heatmap elements
    const heatmapCells = page.locator('[data-testid="heatmap-cell"]');
    await expect(heatmapCells).toHaveCountGreaterThan(0);
    
    // Test hovering over heatmap cells
    await heatmapCells.first().hover();
    await expect(page.locator('[data-testid="heatmap-tooltip"]')).toBeVisible();
    
    // Verify tooltip contains expected information
    await expect(page.locator('[data-testid="heatmap-tooltip"]')).toContainText('Department:');
    await expect(page.locator('[data-testid="heatmap-tooltip"]')).toContainText('Severity:');
    await expect(page.locator('[data-testid="heatmap-tooltip"]')).toContainText('Participation:');
    
    // Test clicking on heatmap cell for drill-down
    await heatmapCells.first().click();
    await expect(page.locator('[data-testid="department-detail-modal"]')).toBeVisible();
    
    console.log('✅ Heatmap visualization E2E test passed');
  });

  test('Behavior patterns can be filtered and sorted', async ({ page }) => {
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="behavior-patterns"]', { timeout: 10000 });
    
    // Test category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Communication');
    
    // Verify filtering works
    const filteredPatterns = page.locator('[data-testid="pattern-item"]');
    await expect(filteredPatterns).toHaveCountGreaterThan(0);
    
    // Verify all visible patterns are Communication category
    const patternCategories = await filteredPatterns.locator('[data-testid="pattern-category"]').allTextContents();
    expect(patternCategories.every(cat => cat === 'Communication')).toBe(true);
    
    // Test severity sorting
    await page.click('[data-testid="sort-by-severity"]');
    
    // Verify patterns are sorted by severity (descending)
    const severityScores = await filteredPatterns.locator('[data-testid="severity-score"]').allTextContents();
    const scores = severityScores.map(s => parseFloat(s));
    const sortedScores = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sortedScores);
    
    console.log('✅ Behavior patterns filtering E2E test passed');
  });

  test('Intervention insights show actionable recommendations', async ({ page }) => {
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="intervention-insights"]', { timeout: 10000 });
    
    // Verify intervention cards are present
    const interventionCards = page.locator('[data-testid="intervention-card"]');
    await expect(interventionCards).toHaveCountGreaterThan(0);
    
    // Test intervention details
    await interventionCards.first().click();
    await expect(page.locator('[data-testid="intervention-detail-modal"]')).toBeVisible();
    
    // Verify intervention details contain required information
    await expect(page.locator('[data-testid="intervention-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="effectiveness-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="roi-calculation"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-patterns"]')).toBeVisible();
    
    // Test recommendation actions
    await expect(page.locator('[data-testid="implement-intervention-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="schedule-planning-btn"]')).toBeVisible();
    
    console.log('✅ Intervention insights E2E test passed');
  });

  test('Performance insights show system health', async ({ page }) => {
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="performance-insights"]', { timeout: 10000 });
    
    // Verify performance metrics are displayed
    await expect(page.locator('[data-testid="api-performance"]')).toBeVisible();
    await expect(page.locator('[data-testid="cache-performance"]')).toBeVisible();
    
    // Verify performance indicators
    await expect(page.locator('text=Response Time')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
    await expect(page.locator('text=Cache Hit Rate')).toBeVisible();
    
    // Test performance recommendations
    const recommendations = page.locator('[data-testid="performance-recommendation"]');
    if (await recommendations.count() > 0) {
      await expect(recommendations.first()).toBeVisible();
    }
    
    console.log('✅ Performance insights E2E test passed');
  });

  test('Data export functionality works', async ({ page }) => {
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Test CSV export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-csv-btn"]')
    ]);
    
    expect(download.suggestedFilename()).toContain('analytics_export');
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Test PDF export
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-pdf-btn"]')
    ]);
    
    expect(pdfDownload.suggestedFilename()).toContain('analytics_report');
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
    
    console.log('✅ Data export E2E test passed');
  });

  test('Mobile PWA functionality works', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Verify mobile-responsive layout
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Verify analytics cards are stacked vertically on mobile
    const analyticsCards = page.locator('[data-testid="analytics-card"]');
    const firstCard = analyticsCards.first();
    const secondCard = analyticsCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Second card should be below first card (not side by side)
    expect(secondCardBox!.y).toBeGreaterThan(firstCardBox!.y + firstCardBox!.height);
    
    // Test PWA install prompt (if supported)
    await page.evaluate(() => {
      // Simulate PWA install prompt
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    
    if (await page.locator('[data-testid="pwa-install-prompt"]').isVisible()) {
      await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible();
    }
    
    console.log('✅ Mobile PWA E2E test passed');
  });

  test('Offline functionality works', async ({ page, context }) => {
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Verify initial data loads
    await expect(page.locator('[data-testid="behavior-patterns"]')).toBeVisible();
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Refresh page to test offline functionality
    await page.reload();
    
    // Verify offline indicator appears
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('text=Offline Mode')).toBeVisible();
    
    // Verify cached data is still available
    await expect(page.locator('[data-testid="behavior-patterns"]')).toBeVisible();
    
    // Verify offline message for real-time features
    await expect(page.locator('text=Real-time updates unavailable offline')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Verify online indicator returns
    await page.waitForSelector('[data-testid="online-indicator"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    
    console.log('✅ Offline functionality E2E test passed');
  });

  test('Analytics admin interface works', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('user_role', 'admin');
    });
    
    await page.goto('/admin/organizations');
    await page.waitForSelector('[data-testid="org-management"]', { timeout: 10000 });
    
    // Verify organization list
    await expect(page.locator('[data-testid="org-list"]')).toBeVisible();
    const orgCards = page.locator('[data-testid="org-card"]');
    await expect(orgCards).toHaveCountGreaterThan(0);
    
    // Test selecting an organization
    await orgCards.first().click();
    await expect(page.locator('[data-testid="org-details"]')).toBeVisible();
    
    // Test analytics toggle
    const analyticsToggle = page.locator('[data-testid="analytics-toggle"]');
    await analyticsToggle.click();
    await expect(page.locator('text=Analytics enabled successfully')).toBeVisible();
    
    // Test user role management
    await page.click('[data-testid="users-tab"]');
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    
    const userRoleSelect = page.locator('[data-testid="user-role-select"]').first();
    await userRoleSelect.selectOption('manager');
    await expect(page.locator('text=User role updated successfully')).toBeVisible();
    
    console.log('✅ Analytics admin interface E2E test passed');
  });

  test('AI insights are generated and displayed', async ({ page }) => {
    await page.goto('/analytics/enterprise');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Wait for AI insights to load
    await page.waitForSelector('[data-testid="ai-insights"]', { timeout: 15000 });
    
    // Verify AI insights section
    await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible();
    await expect(page.locator('text=AI-Powered Insights')).toBeVisible();
    
    // Verify different types of insights
    const insightCards = page.locator('[data-testid="insight-card"]');
    await expect(insightCards).toHaveCountGreaterThan(0);
    
    // Test insight priorities
    const criticalInsights = page.locator('[data-testid="insight-card"][data-priority="critical"]');
    const highInsights = page.locator('[data-testid="insight-card"][data-priority="high"]');
    
    if (await criticalInsights.count() > 0) {
      await expect(criticalInsights.first()).toBeVisible();
      await expect(criticalInsights.first().locator('[data-testid="priority-badge"]')).toHaveText('Critical');
    }
    
    // Test insight details
    await insightCards.first().click();
    await expect(page.locator('[data-testid="insight-modal"]')).toBeVisible();
    
    // Verify insight details
    await expect(page.locator('[data-testid="insight-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="insight-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="insight-evidence"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggested-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
    
    console.log('✅ AI insights E2E test passed');
  });
});

// Test data validation and error scenarios
test.describe('Analytics Error Handling', () => {
  test('Handles API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/analytics/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' })
      });
    });
    
    await page.goto('/analytics/enterprise');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Unable to load analytics data')).toBeVisible();
    
    // Verify retry button is available
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    console.log('✅ API error handling E2E test passed');
  });

  test('Handles network timeouts', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/analytics/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      }, 30000); // 30 second delay
    });
    
    await page.goto('/analytics/enterprise');
    
    // Verify loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Verify timeout message appears
    await expect(page.locator('[data-testid="timeout-message"]')).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Network timeout handling E2E test passed');
  });

  test('Handles insufficient permissions', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('user_role', 'restricted');
    });
    
    await page.goto('/analytics/enterprise');
    
    // Verify access denied message
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    await expect(page.locator('text=Insufficient permissions')).toBeVisible();
    
    console.log('✅ Insufficient permissions E2E test passed');
  });
});