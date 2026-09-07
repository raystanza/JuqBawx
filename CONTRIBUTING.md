# Contributing to JuqBawx

JuqBawx is a system-audio music visualizer for Lively Wallpaper. Issues and pull
requests are welcome.

## Getting started

Use Node.js 24 for the checks and PowerShell for packaging. There is no npm install
step or test dependency. To preview the wallpaper, use Lively on Windows.

From the repository root, run:

```powershell
.\build.ps1
```

This runs the behavior tests, checks the Lively metadata, runs the Canvas and
mocked-WebGL smoke tests, and writes
`dist/JuqBawx-Lively-Visualizer-v<version>.zip`. Install that ZIP in Lively, or point
**Add Wallpaper → Browse** at `index.html` for local development.

Lively's `--audio --system-nowplaying` arguments are already set in
`LivelyInfo.json`. Play audio and use **Customise** to exercise the controls. Enable
wallpaper mouse input in Lively when testing pointer-reactive scenes.

## Project conventions

Keep the wallpaper dependency-free and offline. Lively loads `index.html` over
`file://`, so runtime files are classic scripts wrapped in IIFEs. The script tags
define their load order; keep core scripts before visualizers and `src/boot.js`
last. No bundler, local web server, or ES-module imports are needed.

Shared runtime code lives in `src/core/`, and each visualizer has its own file in
`src/visualizers/`. Per-sub-theme profiles use browser storage; they must still work
when storage is unavailable. Audio, media metadata, album art, and pointer input
can also be missing. Keep scenes usable in those cases, retain a CPU fallback for
WebGL scenes, and keep beat flash opt-in.

Match the file you're editing. JavaScript uses two-space indentation, single
quotes, semicolons, and no trailing commas. Preserve the compact formatting of
runtime code, tools, tests, HTML, and CSS.

Prettier is optional and only covers Markdown, hand-maintained JSON, and
`.prettierrc`. The configuration preserves prose line breaks and fenced code
formatting, with two-space indentation and LF line endings. `.prettierignore`
excludes source code, workflow/build scripts, local output, and the Lively metadata
files. `tools/sync-properties.cjs` owns the formatting of `LivelyProperties.json`
and `LivelyInfo.json`; CI compares their exact text with its output.

## Adding or changing a visualizer

Register the scene with `JuqBawx.register()` in `src/visualizers/` and add its script
tag to `index.html` in the desired dropdown order. Use a unique, stable `id`:
profiles and rendering budgets are keyed by it. The
[README's visualizer guide](README.md#adding-a-visualizer) covers the registry,
frame context, and WebGL fallback pattern.

After adding, removing, renaming, reordering, or recategorizing scenes, regenerate
the Lively metadata and include any resulting changes in the PR:

```powershell
node tools/sync-properties.cjs
```

Update the README's visualizer list and controls documentation when they change.

## Before you open a PR

Run these checks from the repository root (PowerShell):

```powershell
node --test "tests/*.test.cjs"
node tools/sync-properties.cjs --check
node smoke-test.cjs
$env:MOCK_WEBGL = "1"
try { node smoke-test.cjs } finally { Remove-Item Env:\MOCK_WEBGL }
```

In Bash, use `MOCK_WEBGL=1 node smoke-test.cjs` for the last smoke test.
`build.ps1` runs the same checks unless passed `-SkipTests`.

Add focused coverage for behavior changes in `tests/*.test.cjs`. The tests use
Node's built-in test runner and the isolated harness in `tools/headless.cjs`;
timer-driven tests advance a mock clock. `smoke-test.cjs` checks every visualizer,
registry/dropdown consistency, and draw-call budgets.

Canvas and WebGL are mocked, so automated checks do not verify pixels or real
shader compilation. Preview visual changes in Lively as well. Describe the change,
the checks you ran, and any manual testing in the PR; include screenshots or a
short recording when they help explain a visual change. Bug reports should include
reproduction steps, the affected visualizer and settings, and your Lively version
and wallpaper player (WebView2 or CEF).

## Cutting a release

The [release workflow](.github/workflows/release.yml) runs checks on pull requests,
pushes to `main`, version tags, and manual runs. Packaging requires the test job to
pass.

For a release, update `version`, commit the release changes, and tag that commit
with `v` followed by the exact version. From PowerShell:

```powershell
$releaseVersion = (Get-Content -LiteralPath .\version -Raw).Trim()
git tag "v$releaseVersion"
git push origin "v$releaseVersion"
```

The workflow rejects a tag that disagrees with `version`, packages the wallpaper
with `build.ps1`, and attaches the ZIP to a GitHub release. A manual run from the
Actions tab runs the checks and uploads the ZIP as an artifact without publishing
a release.

## License

Contributions are accepted under the [MIT license](LICENSE), same as the rest of
the project.
