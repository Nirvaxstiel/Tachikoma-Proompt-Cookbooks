# Dashboard Fonts

The Tachikoma Dashboard uses standard Unicode characters that work in any terminal.

## Bundled Font

We've included **JetBrains Mono Nerd Font** (regular variant) at:
```
.opencode/assets/NerdFont-Regular.ttf
```

## Installation (Optional)

For the best visual experience with icons:

### Windows
1. Double-click `NerdFont-Regular.ttf`
2. Click "Install"
3. Set your terminal font to "JetBrainsMono Nerd Font"

### macOS
```bash
cp .opencode/assets/NerdFont-Regular.ttf ~/Library/Fonts/
```

### Linux
```bash
cp .opencode/assets/NerdFont-Regular.ttf ~/.local/share/fonts/
fc-cache -fv
```

## Fallback

The dashboard uses standard Unicode arrows (↑↓) which render correctly in any terminal, even without the Nerd Font installed.
