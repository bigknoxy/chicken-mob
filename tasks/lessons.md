# Lessons Learned

Review this file when encountering issues. Each entry captures a failure mode, detection signal, and prevention rule.

---

## Semantic Variable Confusion (2026-03-22)

**Failure:** `currentLevel` was used as both a progress pointer (next level to play) and current context (level being played). These diverge when users replay earlier content.

**Detection signal:** Multiple seemingly unrelated symptoms (missing stars on levels 1-14 + World 2 not unlocking) pointed to one data flow bug.

**Prevention rule:** When a variable tracks "current" or "active" state, verify what happens when the user goes back to earlier content. Test replays/rewinds explicitly.

**Pattern to watch:** Any `currentX` or `activeX` variable that's also used to index saved state.

---

## CLI Screenshot Debugging with chafa and feh (2026-03-22)

**Context:** Browser automation (Playwright) can capture screenshots, but viewing them in a headless/CLI environment requires tools.

**Skill:** Use the `visual-debug` skill (`~/.config/opencode/skills/visual-debug/SKILL.md`) which provides comprehensive guidance for viewing images in CLI environments.

**Quick reference:**
- `chafa screenshot.png` — Terminal preview (works everywhere, no X11)
- `feh screenshot.png &` — Full-color window (requires X11/Wayland)

**Pattern:** When automating UI testing in headless environments, ensure image viewing tools are available for debugging.
