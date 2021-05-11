# release-note-generator-action
release-note-generator-action


### Usage

```yml
- name: Create release and Generate release note
  uses: nextdriveioe/release-note-generator-action@master
  with:
    github_token: GITHUB_TOKEN
    jira_url: JIRA_URL
    jira_project: JIRA_PROJECT
    jira_user: JIRA_USER
    jira_token: JIRA_TOKEN
    base_version: v1.0.1
    current_version: v1.0.2
```

### other options
```yml
  configuration_path: ./github/config.yml
  commitish: master
  github_label: GITHUB_LABEL
```
