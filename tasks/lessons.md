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

**Tools:**
- `chafa` — Converts images to terminal-compatible output (ASCII/block graphics). Works over SSH, in tmux, no X11 required.
- `feh` — Lightweight X11 image viewer. Opens in a simple window, fast startup.

**Effective workflow:**
1. Playwright captures screenshot to file
2. `chafa screenshot.png` for quick terminal preview
3. `feh screenshot.png &` for full-color detail when X11 available

**Why effective:** Enables visual QA in CLI-first environments without context-switching to a browser or GUI file manager.

**Usage:**
```bash
# Terminal preview (works everywhere)
chafa --size=80x40 screenshot.png

# Full window (requires X11/Wayland)
feh screenshot.png
```

**Pattern:** When automating UI testing in headless environments, ensure image viewing tools are available for debugging.
