const generator = require('@nextdriveioe/release-note-generator');
const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');

async function run() {
    const token = core.getInput('github_token');
    const jira = core.getInput('jira_url');
    const project = core.getInput('jira_project');
    const username = core.getInput('jira_user');
    const password = core.getInput('jira_token');
    const base_version = core.getInput('base_version');
    const current_version = core.getInput('current_version');
    const configPath = core.getInput('configuration_path');
    const target_commitish = core.getInput('commitish');
    const label = core.getInput('github_label');

    console.info("base_version:", base_version);
    console.info("current_version:", current_version);

    try {
        const octokit = github.getOctokit(token);

        let configObject = {};
        if (configPath) {
            configObject = await loadConfigPath(octokit, configPath);
        }

        await callGithubRelease(octokit, { current_version, target_commitish });
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

async function callGithubRelease(octokit, { current_version, target_commitish }) {
    await octokit.request(`POST /repos/${github.context.repo.owner}/${github.context.repo.repo}/releases`, {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: current_version,
        name: current_version,
        target_commitish
    })

    console.info("SUCCESS RELEASE VERSION: ", current_version);
}

async function generateReleaseNote(options) {
    const generateCommand = new generator.GenerateCommand()
    await generateCommand.handler(options)
}

run()
