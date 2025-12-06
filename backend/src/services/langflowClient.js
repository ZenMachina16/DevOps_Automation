import axios from 'axios';
import { parseGitHubUrl } from './repoScanner.js';

import dotenv from 'dotenv'; 
dotenv.config();


/**
 * Service to interact with n8n DevOps agent
 */
export class N8nClient {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL ;
  }

  /**
   * Send data to n8n agent for file generation
   * @param {string} repoUrl - GitHub repository URL
   * @param {Object} gapReport - Gap analysis report
   * @param {Object} metadata - Repository metadata (package.json, etc.)
   * @returns {Promise<Object>} Generated file content
   */
  async generateFiles(repoUrl, gapReport, metadata = null) {
    if (!this.webhookUrl) {
      throw new Error('n8n configuration missing. Please set N8N_WEBHOOK_URL');
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

    // Prepare input for n8n agent
    const n8nInput = {
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
      })
    };

    try {
      console.log('Calling n8n webhook:', this.webhookUrl);
      console.log('Input data:', JSON.stringify(n8nInput, null, 2));

      const response = await axios.post(this.webhookUrl, n8nInput, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 6000000 // 60 second timeout for LLM processing
      });

      console.log('n8n response:', response.data);
      return this.processN8nResponse(response.data);
    } catch (error) {
      console.error('n8n API error:', error.response?.data || error.message);
      throw new Error(`File generation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Process n8n response and extract generated content
   * @param {Object} response - n8n webhook response
   * @returns {Object} Processed response with generated content
   */
  processN8nResponse(response) {
    // Preferred: structured payload from Respond node including repo/branch/file
    if (response?.success === true && response?.repository && (response?.file || response?.files)) {
      return {
        success: true,
        repository: response.repository,
        branch: response.branch || response.branchName || null,
        file: response.file, // may be a string path
        files: response.files, // optional array
        status: response.status,
        timestamp: response.timestamp,
        message: response.message,
      };
    }

    // Minimal payload: sometimes workflow responds with only { branch: "..." }
    if (response?.branch || response?.branchName) {
      return {
        success: true,
        branch: response.branch || response.branchName,
        file: response.file,
        files: response.files,
      };
    }

    // Back-compat: inline generatedFiles content
    if (response.success && response.generatedFiles) {
      return {
        success: true,
        generatedFiles: {
          content: response.generatedFiles.content,
          fileType: response.generatedFiles.fileType,
          timestamp: response.generatedFiles.timestamp
        }
      };
    } else if (response.success === false) {
      throw new Error(response.error || 'File generation failed');
    } else {
      // Fallback for unexpected response format
      return {
        success: true,
        generatedFiles: {
          content: JSON.stringify(response, null, 2),
          fileType: 'Unknown',
          timestamp: new Date().toISOString()
        }
      };
    }
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
export const n8nClient = new N8nClient();
export default n8nClient;
