import axios from 'axios';
import { parseGitHubUrl } from './repoScanner.js';

/**
 * Service to interact with Langflow agent
 */
export class LangflowClient {
  constructor() {
    this.baseUrl = process.env.LANGFLOW_API_URL;
    this.apiKey = process.env.LANGFLOW_API_KEY;
    this.flowId = process.env.LANGFLOW_FLOW_ID;
  }

  /**
   * Send data to Langflow agent for file generation
   * @param {string} repoUrl - GitHub repository URL
   * @param {Object} gapReport - Gap analysis report
   * @param {Object} metadata - Repository metadata (package.json, etc.)
   * @returns {Promise<Object>} Generated file content
   */
  async generateFiles(repoUrl, gapReport, metadata = null) {
    if (!this.baseUrl || !this.flowId) {
      throw new Error('Langflow configuration missing. Please set LANGFLOW_API_URL and LANGFLOW_FLOW_ID');
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      throw new Error('Invalid GitHub repository URL');
    }

    // Determine what's missing from gap report
    const missingItems = [];
    if (!gapReport.dockerfile) missingItems.push('missing_dockerfile');
    if (!gapReport.ci) missingItems.push('missing_ci_cd_workflow');
    if (!gapReport.readme) missingItems.push('missing_README_documentation');
    if (!gapReport.tests) missingItems.push('missing_test_configuration');

    if (missingItems.length === 0) {
      return { message: 'No missing files detected. Repository is complete!' };
    }

    // Prepare input for Langflow agent
    const langflowInput = {
      input_value: JSON.stringify({
        language: this.detectLanguage(metadata),
        manifest_filename: "package.json",
        metadata: metadata || { 
          name: parsed.repo,
          version: "1.0.0",
          scripts: { start: "node index.js" }
        },
        gap_report: missingItems,
        repository: {
          owner: parsed.owner,
          name: parsed.repo,
          url: repoUrl
        }
      }),
      sender: 'ShipIQ',
      session_id: `shipiq_${Date.now()}_${parsed.owner}_${parsed.repo}`
    };

    try {
      const endpoint = `${this.baseUrl}/api/v1/run/${this.flowId}`;
      console.log('Calling Langflow endpoint:', endpoint);
      console.log('Input data:', JSON.stringify(langflowInput, null, 2));

      const response = await axios.post(endpoint, langflowInput, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'x-api-key': this.apiKey })
        },
        timeout: 60000 // 60 second timeout for LLM processing
      });

      console.log('Langflow response:', response.data);
      return this.processLangflowResponse(response.data, missingItems[0]);
    } catch (error) {
      console.error('Langflow API error:', error.response?.data || error.message);
      throw new Error(`File generation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Process Langflow response and extract generated content
   * @param {Object} response - Langflow API response
   * @param {string} firstMissingItem - The first missing item being generated
   * @returns {Object} Processed response with generated content
   */
  processLangflowResponse(response, firstMissingItem) {
    // Langflow response structure can vary, handle different formats
    let generatedContent = '';
    let fileType = 'unknown';

    // Determine file type from first missing item
    if (firstMissingItem === 'missing_dockerfile') {
      fileType = 'Dockerfile';
    } else if (firstMissingItem === 'missing_ci_cd_workflow') {
      fileType = 'GitHub Actions Workflow';
    } else if (firstMissingItem === 'missing_README_documentation') {
      fileType = 'README.md';
    }

    // Extract content from various possible response structures
    if (response.outputs && Array.isArray(response.outputs) && response.outputs.length > 0) {
      const output = response.outputs[0];
      generatedContent = output.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message || 
                       output.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
                       output.text || 
                       output.message || 
                       JSON.stringify(output);
    } else if (response.result) {
      generatedContent = response.result.text || response.result.message || JSON.stringify(response.result);
    } else if (response.message) {
      generatedContent = response.message;
    } else {
      generatedContent = JSON.stringify(response);
    }

    return {
      success: true,
      fileType,
      content: generatedContent,
      timestamp: new Date().toISOString(),
      rawResponse: response
    };
  }

  /**
   * Detect programming language from metadata
   * @param {Object} metadata - Package.json or similar metadata
   * @returns {string} Detected language
   */
  detectLanguage(metadata) {
    if (!metadata) return 'JavaScript';

    const deps = { 
      ...metadata.dependencies, 
      ...metadata.devDependencies 
    };

    if (deps.typescript || deps['@types/node'] || deps['ts-node']) return 'TypeScript';
    if (deps.python || metadata.name?.includes('python')) return 'Python';
    if (deps['@angular/core']) return 'TypeScript';
    if (deps.react || deps['react-dom']) return 'JavaScript';
    if (deps.vue || deps['@vue/cli']) return 'JavaScript';
    if (deps.express || deps.fastify || deps.koa) return 'JavaScript';

    return 'JavaScript'; // Default
  }
}

// Export singleton instance
export const langflowClient = new LangflowClient();
export default langflowClient;
