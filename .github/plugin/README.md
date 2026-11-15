# qwang07's Archify plugin packaging

This fork distributes the upstream Archify skill as a Codex / Claude Code plugin.
The tool's source and authoring instructions are not edited.

- `main`: the initial upstream fork; not the distribution or synchronization target.
- `packaging` (default): upstream snapshot plus this builder, documentation and workflow.
- `plugin`: generated distribution branch consumed by `qwang07/plugins`.

The **Sync Archify plugin** workflow runs daily at 04:23 Asia/Shanghai (schedules may
be delayed), on packaging changes, and via **Run workflow**. It checks out current
`tt-a1i/archify:main`, copies the entire `archify/` directory unchanged to
`skills/archify/`, adds portable / Codex / Claude manifests, preserves licenses,
and runs `doctor` before pushing. A failed build/check leaves the previous plugin
branch intact. Ordinary fast-forward pushes preserve history and reject races;
there is no force push, merge-conflict resolution, or personal token secret.

`upstream.json` records the source commit, original skill-tree hash and upstream
version. The plugin version appends the skill-tree hash and a packaging revision as SemVer build metadata,
so changes before a version bump have distinct cache identities. Provenance
changes can publish even when the skill tree itself is unchanged.

Only the plugin package tracks upstream automatically. The packaging branch's
upstream snapshot, inherited workflows, tags, website and other repository files
are not synchronized or published. Upstream workflows remain disabled in this
fork; only the packaging workflow needs enabling. If upstream changes its package
layout or Node requirements, update this small adapter.

Fork updates do not automatically refresh a user's installed plugin. Refresh the
marketplace / update the plugin in the client to use a newly published package.

Local verification (no live installation):

```sh
node .github/plugin/build-package.mjs /path/to/clean-upstream /tmp/empty-package
node /tmp/empty-package/skills/archify/bin/archify.mjs doctor
```

The generated branch does not include upstream workflows, so the built-in
`GITHUB_TOKEN` with `contents: write` is sufficient. No PAT is stored.
