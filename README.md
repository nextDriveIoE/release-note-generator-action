# release-note-generator-action
release-note-generator-action


### Usage

```yml
- name: Generate release note
  uses: uses: nextdriveioe/release-note-generator-action@master
  with:
    jira_url: https://foo.atlassian.net
    jira_project: 'foo1,foo2,foo3'
    jira_username: foo
    jira_password: token
    base_version: v1.0.1
    new_version: v1.0.2
```
