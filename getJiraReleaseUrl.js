const core = require('@actions/core');
const axios = require('axios');

/**
 *
 * @param jiraHost e.g., 'nextdrive.atlassian.net'
 * @param jiraEmail e.g., 'jira@nextdrive.io'
 * @param jiraToken e.g., 'token of user'
 * @param projectKey e.g., 'CPO'
 * @param version e.g., 'v0.0.1800'
 * @returns {Promise<string|null>}
 */
async function getJiraReleaseUrl(jiraHost, jiraEmail, jiraToken, projectKey, version) {
    try {
        // Create base64 encoded credentials
        const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

        // Get project versions
        const response = await axios({
            method: 'GET',
            url: `${jiraHost}/rest/api/3/project/${projectKey}/versions`,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        // Find the specific version
        const targetVersion = response.data.find(v => v.name === version);

        if (!targetVersion) {
            return null;
        }
        core.info(`https://${jiraHost}/projects/${projectKey}/versions/${targetVersion.id}`);
        // Set outputs
        return `https://${jiraHost}/projects/${projectKey}/versions/${targetVersion.id}`;

    } catch (error) {
        core.setFailed(error.message);
    }
}
