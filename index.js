const generator = require('@nextdriveioe/release-note-generator');
const core = require('@actions/core');
const axios = require('axios');
const github = require('@actions/github');
const yaml = require('js-yaml');

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

async function run() {
    const token = core.getInput('github_token');
    const jira = core.getInput('jira_url');
    const project = core.getInput('jira_project');
    const username = core.getInput('jira_user');
    const password = core.getInput('jira_token');
    const base_version = core.getInput('base_version');
    const current_version = core.getInput('current_version');
    const configPath = core.getInput('configuration_path');
    const label = core.getInput('github_label');

    console.info("base_version:", base_version);
    console.info("current_version:", current_version);
    console.info("project:", project);
    console.info("label:", label);

    try {
        const octokit = github.getOctokit(token);

        let configObject = {};
        if (configPath) {
            configObject = await loadConfigPath(octokit, configPath);
        }

        await callGithubRelease(octokit, { current_version });
        await generateReleaseNote({
            token,
            jira,
            project,
            username,
            password,
            label,
            repo: `${github.context.repo.owner}/${github.context.repo.repo}`,
            start: base_version,
            end: current_version,
            ...configObject
        })

        await syncJiraRelease({
            repo: `${github.context.repo.owner}/${github.context.repo.repo}`,
            token,
            tag: current_version,
            jira,
            username,
            password
        })

        const url = await getJiraReleaseUrl(
            jira,
            username,
            password,
            project.split(',')[0],
            `${github.context.repo.repo} ${current_version}`
        );
        core.setOutput('jira_release_url', url);

    } catch (e) {
        console.error(e);
    }
}

async function loadConfigPath(octokit, configPath) {
    const response = await octokit.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: configPath,
        ref: github.context.sha
    });

    const configurationContent = Buffer.from(response.data.content, response.data.encoding).toString();
    return yaml.load(configurationContent);
}

async function callGithubRelease(octokit, { current_version }) {
    console.info("target_commitish", github.context.sha)
    await octokit.request(`POST /repos/${github.context.repo.owner}/${github.context.repo.repo}/releases`, {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: current_version,
        name: current_version,
        target_commitish: github.context.sha
    })

    console.info("SUCCESS RELEASE VERSION: ", current_version);
}

async function generateReleaseNote(options) {
    const generateCommand = new generator.GenerateCommand()
    await generateCommand.handler(options)
}

async function syncJiraRelease(options) {
    const syncJiraReleaseCommand = new generator.SyncJiraReleaseCommand()
    await syncJiraReleaseCommand.handler(options)
}

run()
