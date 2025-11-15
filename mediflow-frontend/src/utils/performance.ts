/**
 * Performance monitoring and analytics utilities
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  /**
   * Track a custom metric
   */
  trackMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Measure execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.trackMetric(name, duration, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackMetric(name, duration, { ...metadata, status: 'error', error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Measure sync function execution
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.trackMetric(name, duration, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackMetric(name, duration, { ...metadata, status: 'error', error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Track page load metrics
   */
  trackPageLoad(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    // Wait for page to fully load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (navigation) {
          this.trackMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, {
            type: 'page_load',
          });
          this.trackMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, {
            type: 'page_load',
          });
          this.trackMetric('time_to_interactive', navigation.domInteractive - navigation.fetchStart, {
            type: 'page_load',
          });
        }

        // Track resource timing
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const totalResourceSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
        this.trackMetric('total_resource_size', totalResourceSize / 1024, {
          type: 'resources',
          unit: 'KB',
          count: resources.length,
        });
      }, 0);
    });
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, duration: number, status: number): void {
    this.trackMetric('api_call', duration, {
      endpoint,
      status,
      type: 'api',
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(action: string, metadata?: Record<string, any>): void {
    this.trackMetric('user_interaction', Date.now(), {
      action,
      ...metadata,
      type: 'interaction',
    });
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    averages: Record<string, number>;
    total: number;
    recent: PerformanceMetric[];
  } {
    const averages: Record<string, number> = {};
    const grouped: Record<string, number[]> = {};

    this.metrics.forEach(metric => {
      if (!grouped[metric.name]) {
        grouped[metric.name] = [];
      }
      grouped[metric.name].push(metric.value);
    });

    Object.keys(grouped).forEach(name => {
      const values = grouped[name];
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return {
      averages,
      total: this.metrics.length,
      recent: this.metrics.slice(-10),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Send metrics to analytics service (placeholder)
   */
  sendToAnalytics(): void {
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to analytics service (e.g., Google Analytics, Mixpanel, etc.)
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Track page load automatically
if (typeof window !== 'undefined') {
  performanceMonitor.trackPageLoad();
}

// Helper to wrap API calls with performance tracking
export function trackApiPerformance<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return apiCall()
    .then(result => {
      const duration = performance.now() - start;
      performanceMonitor.trackApiCall(endpoint, duration, 200);
      return result;
    })
    .catch(error => {
      const duration = performance.now() - start;
      const status = error.response?.status || 500;
      performanceMonitor.trackApiCall(endpoint, duration, status);
      throw error;
    });
}
