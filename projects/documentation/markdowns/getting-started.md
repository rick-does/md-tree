# Getting Started

.mdTree comes in two versions: a **standalone app** (recommended for most users) and a **web app** (for developers who want to run from source).

---

## Standalone app

No installation required. Everything is bundled in the download.

**1. Download**

Go to the [Releases page](https://github.com/rick-does/md-tree/releases) and download the zip for your platform:

- `md-tree-windows.zip` — Windows
- `md-tree-macos.zip` — Mac
- `md-tree-linux.zip` — Linux

**2. Unzip and run**

Unzip to wherever you want to keep the app and your files. This creates an `md-tree/` folder. Open it and run the executable for your platform:

**Windows:** Double-click `mdtree.exe`. The app opens in its own window.

**Mac:** Double-click `mdtree`. The app opens in its own window. The first time, right-click and choose **Open** to bypass the unsigned app warning.

**Linux:** Run `./mdtree` from a terminal. The server starts and prints a URL — open it in your browser. Press `Ctrl+C` to stop.

Your projects are stored in a `projects/` folder created automatically inside `md-tree/`.

---

## Web app (run from source)

Requires [Python 3.12+](https://www.python.org/downloads) and [Node.js LTS](https://nodejs.org).

**Windows:**

```bat
git clone https://github.com/rick-does/md-tree.git
cd md-tree
start.bat
```

**Mac / Linux / WSL:**

```bash
git clone https://github.com/rick-does/md-tree.git
cd md-tree
./start.sh
```

On first run the script installs all dependencies and builds the frontend — this takes a minute or two. Subsequent runs start immediately.

Once running, open your browser and go to `http://localhost:8002`.

To stop the server, press `Ctrl+C` in the terminal.

---

## First use

Both versions open to the **Documentation** project by default. After that, the app remembers the last project you had open.
