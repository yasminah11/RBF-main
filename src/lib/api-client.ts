/**
 * Scalable API Client for backend communications.
 * This architecture separates UI logic from API communication.
 */

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const apiClient = {
  /**
   * General purpose fetch wrapper for backend calls
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // In a real production app, we would include the auth token here
      // const session = await supabase.auth.getSession();
      // const token = session.data.session?.access_token;

      const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.message || `Request failed with status ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  },

  /**
   * Request email notification (backend handles actual sending)
   */
  async sendNotificationRequest(type: 'order_update' | 'promotion' | 'account_alert', payload: any): Promise<ApiResponse> {
    // Backend responsible for connecting to Resend/Brevo/SMTP
    return this.request('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
    });
  }
};
