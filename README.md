# Inkover

Draw over any web page in Safari on iPad with Apple Pencil. Lock the page to draw, unlock to browse, and the ink stays attached to the content it was drawn on until you clear it.

Inkover exists because reading on a screen has no margins. Circling a sentence, underlining a phrase, tracing along a line while you read: those are the things that keep a distracted reader reading, and no Safari extension did them well.

## Status

Version 1.0.0 is with App Review. The status of every feature is in [docs/index.md](docs/index.md).

## What it does

- Pen with pressure, highlighter, and a stroke eraser.
- Trail: ink that follows the Pencil and fades in under a second, for tracing while reading.
- Ink is anchored to the element it was drawn on, so it moves with the content and hides when a tab or section hides.
- Ink persists per page until cleared. Nothing leaves the device.
- One lock. Locked, the Pencil draws and the page ignores the hand. Unlocked, Pencil and finger both browse. Nothing switches on its own.
- Undo, redo, clear.

Deliberately not included: export, print, sync, Mac, finger drawing. The reasons are in [docs/decisions](docs/decisions/D0009-non-goals.md).

## Requirements

- iPad running iPadOS 17 or later, with any Apple Pencil.
- A Mac with Xcode 16 or later to build and install.

## Build and install

1. Open `Inkover/Inkover.xcodeproj` in Xcode.
2. Select the Inkover target, set your development team under Signing and Capabilities.
3. Connect the iPad and run.
4. On the iPad, open Settings, then Safari, then Extensions, and turn Inkover on. Allow it on all websites.
5. In Safari, tap the extensions button in the address bar and choose Inkover to start drawing.

After installing a newer build over an old one, force-quit Safari from the app switcher and open it again. Safari keeps an extension's scripts cached until then, so the old version can keep running under the new one. iPadOS also caches the app's launch screen, so a changed icon shows there only after a restart or a reinstall.

The web extension itself is the `extension/` folder. The Xcode project references it in place; there is no build step and no dependencies.

To try the mechanics on a Mac without an iPad, serve the repository root and open the harness page. The mouse stands in for the Pencil there. It cannot show pressure or palm rejection.

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765/dev/harness.html.

## How the repository works

The docs are the source of truth and the code implements them. Every feature has one spec with its behaviour rules, edge cases and an acceptance checklist. Every decision has one file with the reasoning.

- [CLAUDE.md](CLAUDE.md): the map of the repo and where to go for any task.
- [docs/product.md](docs/product.md): what Inkover is, non-goals, glossary.
- [docs/architecture.md](docs/architecture.md): the shared mechanisms.
- [docs/features/](docs/features/): one spec per feature.
- [docs/decisions/](docs/decisions/): why things are the way they are.

## App Store

Inkover is a free download on the App Store. The listing text and screenshots live in [docs/store](docs/store/). The privacy policy is [docs/privacy.md](docs/privacy.md): the app collects nothing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: change the spec first, then the code, in the same pull request.

## License

MIT. See [LICENSE](LICENSE).
