/**
 * Analytics and event tracking utilities
 * Ready for integration with Google Analytics, Mixpanel, Segment, etc.
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface UserProperties {
  userId?: string;
  role?: string;
  [key: string]: any;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private userProperties: UserProperties = {};
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  /**
   * Initialize analytics with user properties
   */
  init(userProperties: UserProperties): void {
    this.userProperties = userProperties;

    // TODO: Initialize analytics services here
    if (this.isEnabled) {
      // Example: Google Analytics
      // if (typeof window !== 'undefined' && (window as any).gtag) {
      //   (window as any).gtag('set', 'user_properties', userProperties);
      // }
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (this.isEnabled) {
      // TODO: Send to analytics service
      // Example: Google Analytics
      // if (typeof window !== 'undefined' && (window as any).gtag) {
      //   (window as any).gtag('event', eventName, properties);
      // }
    }
  }

  /**
   * Track page view
   */
  pageView(pageName: string, properties?: Record<string, any>): void {
    this.track('page_view', {
      page_name: pageName,
      page_path: window.location.pathname,
      ...properties,
    });
  }

  /**
   * Track user login
   */
  trackLogin(userId: string, role: string): void {
    this.init({ userId, role });
    this.track('user_login', { userId, role });
  }

  /**
   * Track user logout
   */
  trackLogout(): void {
    this.track('user_logout', { userId: this.userProperties.userId });
    this.userProperties = {};
  }

  /**
   * Track appointment events
   */
  trackAppointment(action: 'created' | 'updated' | 'cancelled' | 'completed', properties?: Record<string, any>): void {
    this.track(`appointment_${action}`, properties);
  }

  /**
   * Track messaging events
   */
  trackMessage(action: 'sent' | 'received', properties?: Record<string, any>): void {
    this.track(`message_${action}`, properties);
  }

  /**
   * Track prescription events
   */
  trackPrescription(action: 'created' | 'viewed', properties?: Record<string, any>): void {
    this.track(`prescription_${action}`, properties);
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });

    // TODO: Send to error tracking service (e.g., Sentry)
    if (this.isEnabled) {
    }
  }

  /**
   * Track search events
   */
  trackSearch(query: string, resultCount: number): void {
    this.track('search', {
      query,
      result_count: resultCount,
    });
  }

  /**
   * Track button clicks
   */
  trackButtonClick(buttonName: string, context?: string): void {
    this.track('button_click', {
      button_name: buttonName,
      context,
    });
  }

  /**
   * Track form submissions
   */
  trackFormSubmit(formName: string, success: boolean, errors?: string[]): void {
    this.track('form_submit', {
      form_name: formName,
      success,
      errors,
    });
  }

  /**
   * Track feature usage
   */
  trackFeature(featureName: string, action: string): void {
    this.track('feature_usage', {
      feature: featureName,
      action,
    });
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalEvents: number;
    uniqueEvents: string[];
    recentEvents: AnalyticsEvent[];
    userProperties: UserProperties;
  } {
    const uniqueEvents = Array.from(new Set(this.events.map(e => e.name)));

    return {
      totalEvents: this.events.length,
      uniqueEvents,
      recentEvents: this.events.slice(-10),
      userProperties: this.userProperties,
    };
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Helper hooks for React components
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    pageView: analytics.pageView.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackButtonClick: analytics.trackButtonClick.bind(analytics),
    trackFormSubmit: analytics.trackFormSubmit.bind(analytics),
  };
};

// Auto-track page views on route changes
if (typeof window !== 'undefined') {
  // Track initial page view
  analytics.pageView(document.title);

  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    analytics.pageView(document.title);
  });
}
