---
name: make-2d-video
description: >
  This skill should be used when the user wants a narrated animated video in the aiTrends 2D style
  (cinematic stick figures with rim light, moody 2.5D sets, giant face close-ups, freeze-frames,
  data overlays, blueprint diagrams and low-poly 3D shots), e.g. "make a 2D video from this voiceover",
  "animate my script", "turn this narration into a stick figure video", "make a What If video",
  "create an animated explainer from my audio", or "do the whole video". It runs the full pipeline:
  install, timestamps (Whisper), story breakdown, style choice, scene building, rendering, music, SFX and
  final MP4 in 16:9 or 9:16 at 720p to 4K.
metadata:
  version: "0.1.0"
  author: aiTrends
---

# aiTrends 2D Studio: full video pipeline

Turn a voiceover (plus an optional script) into a finished MP4 where every frame is drawn by code (HTML canvas + Three.js), captured frame by frame in headless Chromium and encoded with ffmpeg. No image or video generation models are used, so characters stay consistent and text stays crisp. Invent the visuals fresh for every script; only the style is fixed.

**Bundled resources (this skill's base directory):**
- `kit/`: the tested studio (renderer, engine, tools, audio, the `examples/reaction-time` reference project). Install it into the workspace as `aitrends-2d-studio/` (see `references/install.md`).
- `references/install.md`: install, dependency table, doctor, self-test.
- `references/style-bible.md`: **the look** (characters, sets, light, camera, editing, graphics, 9:16 rules, don'ts). Read it fully before designing any shot. For the recurring protagonist, set `headColor: '#F1E8DC'`, `headShadow: '#D9D0C5'`, and a deep-navy hoodie in the cast outfit; the rig reads these identity colors in both full-body and giant close-up shots.
- `references/story-breakdown.md`: writing `story/bible.md` and `story/shots.json`, plus pacing rules.
- `references/engine-api.md`: the scene API, config and shots.json schemas, and the three-kit reference.
- `references/visual-composition-system.md`: shot framing vocabulary, **measured character-size and framing rules**, the framing lint, and DSL-vs-JS decisions. Read before authoring scenes.
- `references/sound-design.md`: the music plan, SFX library, ambience and levels.
- `references/render-qc.md`: preview and final render, QC checklist, troubleshooting.

Stage commands from this plugin re-run one stage: `/new-video` (stages 1–4), `/video-styles` (5), `/render-video` (6 and 8), `/video-sound` (7). When running end to end, follow this file and load references as each stage needs them.

## Golden rules
1. **Keep the narration intact.** Never rewrite, add, drop or reorder spoken words. Every shot illustrates the words spoken while it is on screen.
2. **Same style, new pictures.** Invent sets, props, characters and actions from this script. Use `examples/reaction-time` only to learn the API.
3. **Show what is said, literally and specifically.** Abstract lines become visual metaphors, diagrams or close-up reactions.
4. **Draft, look, fix, then render.** Open contact sheets and stills yourself (read the PNGs) before any full render. Rendering is slow; looking is fast.
5. **Three user checkpoints:** setup choices, style choice from rendered samples, and the preview before the final render. If the user is away, take the defaults, state what was assumed, and continue.
6. **Files are the truth.** Each video lives in `aitrends-2d-studio/projects/<slug>/`, and `story/shots.json` owns all timing.
7. **Measure production work.** Use the production plan and append-only telemetry commands below. Never report an estimated speedup as measured.

## Stage 1: Intake
Ask once (AskUserQuestion when available) for:
- **Voiceover file** (required).
- **Script:** timestamped (SRT/VTT/JSON/TXT with `[mm:ss]`), plain text (best: aligned to the audio, keeping exact wording), or none (transcribed).
- **Aspect:** 16:9 or 9:16.
- **Resolution:** 720p / 1080p (recommended) / 1440p / 2160p (4K). Mention that higher resolutions take much longer to render.
- **Captions:** default on for 9:16, off for 16:9.
- **Music:** generated, the user's own file, or none. **SFX:** on or off.
- **Title.**

Don't ask about style yet. Defaults: 16:9, 1080p, 24 fps, generated music + SFX, style `dusk`.

## Stage 2: Install or check the studio
Follow `references/install.md`: copy `kit/` to `aitrends-2d-studio/` in the workspace (skip if already present), install dependencies, run `python tools/verify_kit.py` and `python tools/doctor.py`, then run the example self-test. Report what was installed in one short list.

## Stage 3: Project + timeline
Run inside `aitrends-2d-studio/`. Use `python3` where `python` isn't Python 3.
```bash
python tools/new_project.py --name <slug> --voice "<voiceover path>" [--script "<script path>"] --aspect 16:9 --resolution 1080p --title "<title>" [--captions]
```
- Timestamped script: `python tools/parse_script.py --project projects/<slug> --script projects/<slug>/input/script.<ext>`
- Plain script: `python tools/transcribe.py --project projects/<slug> --script projects/<slug>/input/script.txt --lang en --model small`. The match must be ≥ 90%; if it's lower, tell the user the script and audio differ.
- No script: `python tools/transcribe.py --project projects/<slug> --lang en --model small` (`base` on slow machines, `large-v3` for hard audio).

Check `timeline/transcript.txt` (its end should be near the voiceover length), then run `python tools/beats.py --project projects/<slug>` to get the beat sheet and a draft `story/shots.json`.

## Stage 4: Story breakdown
Read `references/style-bible.md` and `references/story-breakdown.md`. Write `story/bible.md` (logline, cast with one signature colour each, locations with moods and key lights, motifs, music plan). Write `scenes/cast.js`. Rewrite `story/shots.json`: contiguous shots, cut on phrase boundaries 0.1–0.2 s early, a median of 2–3.5 s, an establishing shot per new location, and a concrete `scene` description for each. Send the user a 5–10 line plan summary and continue unless they object.

## Stage 5: Style choice
Build the 1–2 most-used sets plus 3 representative shots (a wide shot with ≥ 2 characters, a `bigFace` close-up, a data/blueprint or 3D shot). Then render:
```bash
node render.mjs --project projects/<slug> --styles cinematic,dusk,midnight,golden,neon,storybook --at <t1>,<t2>,<t3> --scale 0.5
```
Open `build/styles/style_grid.png`, then show it with one line per style: **dusk** (mauve shadows, amber key, cream rim), **midnight** (cold navy, blue-white rims, sodium practicals), **golden** (warm orange and teal), **neon** (deep blacks, magenta and teal), **storybook** (soft pastel, low contrast). Save the pick in `config.json` → `style`. For tweaks, add a custom entry to `STYLES` in `engine/styles.js` (moods overrides plus the `grade` lift/gamma/gain, sat, contrast, vignette, grain, bloom) and re-render that row.

## Stage 6: Build every shot
Read `references/engine-api.md`, `references/visual-composition-system.md`, and the example scenes in `examples/reaction-time/scenes/` once per production run. Keep one shared brief containing style, cast, frozen assets, renderer constraints, shot IDs, and batch ownership; do not re-open and re-summarize the same references for every shot.

Before generating shots, create and freeze shared cast, sets, props, and reusable assets. Shared asset changes must be serialized; never let concurrent batches edit the same registry, cast file, project manifest, or shared asset.

Create the deterministic batch manifest after `story/shots.json` is stable:
```bash
python tools/production.py plan --project projects/<slug> --batch-size 10 --max-concurrency 3
```
This writes `build/production/plan.json`. Use its batch ownership as the source of truth. Re-run only when the shot list or batch settings change. Default to 8–12 shots per batch and at most 3 concurrent batches; lower concurrency when resources are constrained.

If the agent environment supports concurrent subagents, run up to the manifest's concurrency limit. Each worker receives the same frozen brief and may write only its assigned shot IDs. If concurrency is unavailable, process the same batches sequentially without repeating per-shot research/setup. Prefer the Structured Visual DSL for standard 2D shots: write `scenes/visual/<shot-id>.json`, validate it through the renderer, and use the existing JavaScript `registerShot()` API only when the shot needs capabilities outside DSL v1. Keep 3D shots and specialized Canvas work in JavaScript. JSON DSL files override a JS shot with the same id, enabling gradual migration.

Before writing each shot, choose one composition template (establishing wide, medium single, medium two-shot, over-the-shoulder, close-up, insert, character–object interaction, or dramatic reveal). Record the subject, action/state, supporting element, and intended framing in the shot's scene description or planning notes. Do not select a template just to satisfy variety; it must serve the story beat.

Size and place every character from the measured table in `references/visual-composition-system.md` (*Scale and framing rules*), not by eye: hero `scale` about 2.0–2.7 in a wide and 2.9–3.6 in a medium or interaction shot (one scale unit is about 22% of frame height); the key story object at least 10% of frame height; feet inside the visible frame, using a `camera.y` track whenever the camera zooms in. Set `"framing"` on every DSL shot and `"role": "story_object"` on the prop the beat is about. Run `node lint-visual.mjs projects/<slug>` and fix every error before rendering a sheet. `render.mjs` prints the same lint before each render, and `--strict-lint` makes lint errors abort it.

1. Record each batch start/completion/failure with `python tools/production.py record --project projects/<slug> --stage shot-generation --status started --batch batch-001` and the matching `completed` or `failed` event. Generate all shots in a batch in one focused pass. Retry only failed shots; never regenerate accepted shots or silently continue after the assigned batch is complete. Every worker reports completed/failed IDs, files changed, validation result, and blockers. For standard 2D shots, write `scenes/visual/<shot-id>.json` using DSL v1. For simple physical interactions, attach supported props with `hero.prop` and use hand-contact poses such as `reachBall` or `reachDown`; do not position a separate prop primitive near an unrelated hand. Add reusable `scenes/sets/<location>.js` only when a custom environment is needed; use `scenes/shots/NN_<name>.js` with `registerShot('<id>', {...})` for advanced Canvas work and all 3D shots. Keep reusable sets anchored to `GY = E.H * V(0.8, 0.68)` and `CX = E.W/2`, with walls, floor and sky extended past the frame.
2. Run `node render.mjs --project projects/<slug> --sheet --scale 0.5` (the visual lint runs first; fix its errors). Open every `build/sheets/sheet_XX.png` and check it against the QC checklist in `references/render-qc.md` and the composition review checklist in `references/visual-composition-system.md`. Fix any MISSING shots, errors printed by the renderer, and composition problems.
3. Check motion with `--stills t1,t2,t3` or `--from A --to B --scale 0.5` (writes `build/preview.mp4`).

Non-negotiables from the style bible:
- Rim light on every lit figure.
- Colours from `mood()`/`S()`.
- A motivated camera move in every shot.
- Atmosphere (dust, rain, glows) only when it supports the scene.
- Moody value structure.
- Graphics synced to words with `wordTime()`.
- `V()` for every aspect-dependent value.
- No `Math.random`/`Date.now`.

## Stage 7: Sound
Read `references/sound-design.md`. Fill `story/shots.json` → `music` (contiguous mood sections) and add per-shot `sfx` cues and `amb` beds. Mixing happens after the final render (Stage 8), or run `python audio/mix.py --project projects/<slug>` now to audition `build/mix.wav`.

## Stage 8: Render and deliver
Read `references/render-qc.md`.
1. Preview: `node render.mjs --project projects/<slug> --from 0 --to 30 --scale 0.5`. Show the user the preview or a contact sheet before the long render.
2. Final: `node render.mjs --project projects/<slug>`. Run it in the background for long videos and poll the log. The log prints fps and ETA, so share the estimate.
3. Run `node qa.mjs --project projects/<slug> --production` and fix all errors. Then run `node render.mjs --project projects/<slug> --production`; the production flag enforces the 5–8 minute delivery contract in addition to static and geometry preflight.
4. Run `python audio/mix.py --project projects/<slug>`, which first rejects voiceover/story duration differences above 1.5 seconds by default, then generates music and SFX, ducks the music under the voice, normalises to −14 LUFS and muxes `out/<title>.mp4`.
5. At delivery, run `python tools/production.py report --project projects/<slug>` and include measured stage durations, failures, and unmatched starts in the production summary. Never infer agent time from render time.
5. QC the final file: duration matches, audio is present, and a 1-frame-per-10-s contact sheet looks right. Deliver the MP4 (send the file), then give the location in plain words and one line on what to tweak next if needed.

## Defaults and judgement calls
- When unsure about a visual, choose the more literal, more cinematic option: a close-up for emotion, an insert for objects, a blueprint for mechanisms, 3D for big spaces.
- Keep about 15–25 shots per minute. Use 1–3 freeze-frames per video and about one 3D shot per minute.
- Keep each character's outfit colour fixed for the whole video, and keep screen direction consistent within a scene.
- Prefer re-rendering a fixed shot range over the whole video only when the user is comfortable splicing. Otherwise re-render everything.
