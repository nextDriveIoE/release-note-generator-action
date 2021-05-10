const generator = require('@nextdriveioe/release-note-generator');
const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');

async function run() {
    const token = core.getInput('github_token');
    const username = core.getInput('jira_user');
    const password = core.getInput('jira_token');
    const base_version = core.getInput('base_version');
    const current_version = core.getInput('current_version');
    const configPath = core.getInput('configuration_path');

    try {
        const octokit = github.getOctokit(token)
        const configObject = await loadConfigPath(octokit, configPath);
        callGithubRelease(octokit, current_version);
        generateReleaseNote({
            token,
            username,
            password,
            start: base_version,
            end: current_version,
            ...configObject
        })
    } catch (e) {
        console.error(e);
    }
}

async function loadConfigPath(octokit, configPath) {
    const response = await octokit.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: configPath,
        ref: github.context.sha
    });

    const configurationContent = Buffer.from(response.data.content, response.data.encoding).toString();
    return yaml.safeLoad(configurationContent);
}

async function callGithubRelease(octokit, current_version) {
    await octokit.request(`POST /repos/${github.context.repo.owner}/${github.context.repo.repo}/releases`, {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: current_version,
        name: current_version
    })

    console.info("SUCCESS RELEASE VERSION: ", current_version);
}

function generateReleaseNote(options) {
    const generateCommand = new generator.GenerateCommand()
    generateCommand.handler(options)
}

run()
