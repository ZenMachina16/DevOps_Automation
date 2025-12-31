import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * n8n Client
 * Pure transport layer (NO logic, NO inference)
 */
export class N8nClient {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!this.webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL is not configured');
    }
  }

  /**
   * Send full repo context to n8n
   * @param {Object} context - Full repo context object
   */
  async generateFiles(context) {
    if (!context?.repository?.url) {
      throw new Error('Invalid context: repository.url missing');
    }

    const payload = {
      repository: context.repository,
      project: context.project,
      scan: context.scan,
      gap_report: context.scan.gapReport,
      metadata: context.metadata || {},
      workflow: {
        source: 'devops-platform',
        version: '1.0.0',
        triggeredAt: new Date().toISOString()
      }
    };

    try {
      console.log('🚀 Sending context to n8n');
      console.log(JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000
      });

      return response.data;
    } catch (error) {
      console.error('❌ n8n call failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 'n8n file generation failed'
      );
    }
  }
}

// Singleton export
export const n8nClient = new N8nClient();
export default n8nClient;
