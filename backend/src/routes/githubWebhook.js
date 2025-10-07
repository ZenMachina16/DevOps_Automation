import { Router } from 'express';
import axios from 'axios';

const router = Router();

/**
 * POST /api/github/webhook
 * Handle GitHub webhook events for workflow runs and deployment status
 */
router.post('/webhook', async (req, res) => {
  try {
    const { action, workflow_run, repository, pull_request } = req.body;
    const eventType = req.headers['x-github-event'];

    console.log(`GitHub webhook received: ${eventType} - ${action}`);

    // Handle workflow run completion
    if (eventType === 'workflow_run' && action === 'completed') {
      await handleWorkflowRunCompletion(workflow_run, repository);
    }

    // Handle pull request events (for tracking PR creation)
    if (eventType === 'pull_request' && action === 'opened') {
      await handlePullRequestCreated(pull_request, repository);
    }

    // Handle deployment status changes
    if (eventType === 'deployment_status') {
      await handleDeploymentStatus(req.body);
    }

    res.status(200).json({ received: true, eventType, action });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle workflow run completion events
 */
async function handleWorkflowRunCompletion(workflow_run, repository) {
  try {
    const { conclusion, status, html_url, id } = workflow_run;
    const repoFullName = repository.full_name;

    console.log(`Workflow run completed for ${repoFullName}: ${conclusion} (${status})`);

    // If workflow failed, trigger retry logic via n8n
    if (conclusion === 'failure') {
      await triggerRetryWorkflow(repository, workflow_run);
    }

    // Log successful deployments
    if (conclusion === 'success') {
      console.log(`✅ Deployment successful for ${repoFullName}`);
      // Could trigger notifications, metrics, etc.
    }

  } catch (error) {
    console.error('Error handling workflow run completion:', error);
  }
}

/**
 * Handle pull request creation
 */
async function handlePullRequestCreated(pull_request, repository) {
  try {
    const { number, title, html_url } = pull_request;
    const repoFullName = repository.full_name;

    console.log(`PR #${number} created for ${repoFullName}: ${title}`);

    // Could trigger additional workflows, notifications, etc.
    // For example, auto-approve if it's from ShipIQ

  } catch (error) {
    console.error('Error handling PR creation:', error);
  }
}

/**
 * Handle deployment status changes
 */
async function handleDeploymentStatus(deploymentData) {
  try {
    const { deployment, deployment_status, repository } = deploymentData;
    const repoFullName = repository.full_name;
    const status = deployment_status.state;

    console.log(`Deployment status for ${repoFullName}: ${status}`);

    if (status === 'failure') {
      // Could trigger rollback or retry logic
      console.log(`Deployment failed for ${repoFullName}, triggering analysis...`);
    }

  } catch (error) {
    console.error('Error handling deployment status:', error);
  }
}

/**
 * Trigger retry workflow in n8n when deployment fails
 */
async function triggerRetryWorkflow(repository, workflow_run) {
  try {
    const n8nWebhookUrl = process.env.N8N_RETRY_WEBHOOK_URL || 'http://localhost:5678/webhook/shipiq-retry';
    
    const retryPayload = {
      repository: {
        owner: repository.owner.login,
        name: repository.name,
        url: repository.html_url,
        fullName: repository.full_name
      },
      workflow_run: {
        id: workflow_run.id,
        conclusion: workflow_run.conclusion,
        status: workflow_run.status,
        html_url: workflow_run.html_url,
        logs_url: workflow_run.logs_url,
        created_at: workflow_run.created_at,
        updated_at: workflow_run.updated_at
      },
      failure_analysis: {
        conclusion: workflow_run.conclusion,
        status: workflow_run.status,
        failure_reason: workflow_run.conclusion === 'failure' ? 'Workflow execution failed' : 'Unknown'
      },
      retry_metadata: {
        triggered_at: new Date().toISOString(),
        trigger_reason: 'workflow_failure',
        max_retries: 3
      }
    };

    console.log('Triggering retry workflow for failed deployment...');
    
    const response = await axios.post(n8nWebhookUrl, retryPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('Retry workflow triggered successfully:', response.status);
    
  } catch (error) {
    console.error('Failed to trigger retry workflow:', error);
  }
}

/**
 * GET /api/github/webhook/status
 * Check webhook configuration status
 */
router.get('/webhook/status', (req, res) => {
  res.json({
    configured: true,
    webhookUrl: '/api/github/webhook',
    supportedEvents: [
      'workflow_run',
      'pull_request', 
      'deployment_status',
      'deployment'
    ],
    retryWebhookUrl: process.env.N8N_RETRY_WEBHOOK_URL || 'http://localhost:5678/webhook/shipiq-retry',
    timestamp: new Date().toISOString()
  });
});

export default router;

