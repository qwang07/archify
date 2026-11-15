#!/usr/bin/env node
// Build a plugin without modifying or executing upstream authoring instructions.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const [sourceArg, outputArg] = process.argv.slice(2);
if (!sourceArg || !outputArg) throw new Error('Usage: node build-package.mjs <upstream-checkout> <empty-output>');
const source = resolve(sourceArg);
const output = resolve(outputArg);
if (existsSync(output) && readdirSync(output).length) throw new Error('Output must be empty');
const skill = join(source, 'archify');
if (!existsSync(join(skill, 'SKILL.md'))) throw new Error('Upstream archify/SKILL.md is missing');
const { version } = JSON.parse(readFileSync(join(skill, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid upstream version');
const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const tree = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD:archify'], { encoding: 'utf8' }).trim();
// Include the upstream tree identity in package identity: main can change before
// its next release. A new skill tree must not reuse an installed cache version.
const pluginVersion = `${version}+upstream.${tree.slice(0, 12)}.packaging.2`;
const description = 'Create interactive architecture, workflow and sequence diagrams, or source-backed one-page explainers.';
const manifest = {
  name: 'archify', version: pluginVersion, description,
  author: { name: 'Archify contributors' },
  homepage: 'https://github.com/tt-a1i/archify',
  repository: 'https://github.com/qwang07/archify',
  license: 'Apache-2.0',
};
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
mkdirSync(join(output, 'skills'), { recursive: true });
cpSync(skill, join(output, 'skills', 'archify'), { recursive: true });
writeJson(join(output, 'plugin.json'), {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', ...manifest,
  extensions: { 'com.openai': { interface: { displayName: 'Archify' } } },
});
for (const host of ['.codex-plugin', '.claude-plugin']) {
  mkdirSync(join(output, host));
  writeJson(join(output, host, 'plugin.json'), {
    ...manifest, skills: './skills/',
    ...(host === '.codex-plugin' ? { interface: { displayName: 'Archify' } } : {}),
  });
}
for (const file of ['LICENSE', 'LICENSE-MIT', 'NOTICE', 'THIRD_PARTY_NOTICES.md']) {
  cpSync(join(skill, file), join(output, file));
}
writeJson(join(output, 'upstream.json'), {
  repository: 'https://github.com/tt-a1i/archify', ref: 'main', commit,
  skillTree: tree, version, pluginVersion,
});
writeFileSync(join(output, 'README.md'), `# Archify plugin\n\nUnofficial packaging of [Archify](https://github.com/tt-a1i/archify) for Codex and Claude Code.\n\nThe complete upstream skill is copied unchanged into \`skills/archify/\`.\nSee [upstream.json](upstream.json) for the exact upstream commit and tree.\nNo credentials are needed. Node.js 18+ is required by Archify.\n\nInstall from [qwang07/plugins](https://github.com/qwang07/plugins).\nPackaging and the daily sync workflow live on the [packaging branch](https://github.com/qwang07/archify/tree/packaging/.github/plugin).\n`);
console.log(JSON.stringify({ output, version: pluginVersion, commit, tree }));
