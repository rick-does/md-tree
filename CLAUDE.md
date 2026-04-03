# CLAUDE.md — .mdTree

## Working in This Codebase

### Build & Run
```bash
# Start the app (one command)
./start.sh

# Or manually:
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8002

# After any frontend change, rebuild:
cd frontend && node node_modules/vite/bin/vite.js build
# NOTE: npm run build / .bin/vite shim silently exits 0 without building on this machine
```

### Rules
- **Always build after frontend changes** — FastAPI serves the built `frontend/dist/`; changes are not live until rebuilt
- **Never add comments or docstrings to code that wasn't changed**
- **Never add features beyond what was asked**
- **Don't create new files to document changes** — edit existing files or nothing
- **File paths in the API are always relative to the project's `markdowns/`** — never absolute paths
- **After editing `main.py` or other backend files**, the uvicorn `--reload` flag picks up changes automatically
- Spaces in filenames must be replaced with hyphens — enforced in `handleRenameFile` in `App.tsx`
- All file path inputs must be validated through `safe_path()` in `main.py` to prevent path traversal

---

## What This Is

**.mdTree** (`md-tree` as the repo/package identifier) is a local web-based markdown editor whose
primary feature is a **visual drag-and-drop hierarchy editor** for organizing `.md` files into a
tree structure. The tree is stored in `collection.yaml` and is designed as a sidebar-driven table
of contents for documentation sets — particularly suited for MkDocs `nav:` management, but
intentionally tool-agnostic.

Built as a **portfolio/vibe-coding demonstration** of full-stack development with AI assistance.

---

## Problem It Solves

Managing a large documentation set's navigation structure by hand-editing YAML is painful:
- Reordering requires careful indentation edits
- Nesting/unnesting is error-prone
- Non-technical writers cannot do it at all

.mdTree makes the nav tree **visual and tactile**: drag to reorder, drag left/right to
nest/unnest, rename in-place, create and delete files — all reflected immediately in
`collection.yaml`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, uvicorn (port 8002) |
| Frontend | React 18, TypeScript, Vite 6 |
| Editor | CodeMirror 6 with `@replit/codemirror-vim` |
| Drag-drop | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Markdown preview | `react-markdown`, `remark-gfm`, `rehype-highlight` |

---

## Project Structure

```
md-tree/
├── projects/                # All user data lives here
│   └── {project-name}/
│       ├── collection.yaml  # Nav tree for this project (source of truth)
│       ├── project.md       # Project description/info page
│       └── markdowns/       # All .md files for this project (flat)
├── start.sh                 # Start script: builds frontend + runs uvicorn
├── backend/
│   ├── main.py              # FastAPI app + all API endpoints
│   ├── models.py            # Pydantic models: FileNode, CollectionStructure
│   ├── utils.py             # File I/O, collection load/save, orphan detection, project mgmt
│   └── .venv/               # Python virtual environment
└── frontend/
    └── src/
        ├── App.tsx           # Root: project state, collection state, all handlers
        ├── api.ts            # All fetch calls to backend API
        ├── types.ts          # FileNode, CollectionStructure, FileInfo, ProjectInfo types
        ├── treeHelpers.ts    # Pure tree manipulation: insert, remove, reorder, depth
        └── components/
            ├── Sidebar.tsx          # DndContext, drag logic, orphan sort/order, layout
            ├── SortableItem.tsx     # Recursive tree chip: chevron, connectors, ghost, menu
            ├── OrphanItem.tsx       # Orphan chip: drag, preview, menu, undo button
            ├── ProjectChip.tsx      # Project header chip: title, menu (fixed-position)
            ├── SidebarConstants.ts  # LINE, COL_W, GAP, TOP_SENTINEL
            ├── MarkdownEditor.tsx   # Split/edit/preview editor with save
            ├── CodeEditor.tsx       # CodeMirror 6 wrapper (markdown + YAML)
            ├── YAMLEditor.tsx       # Full-screen YAML editor for collection.yaml
            └── YAMLModal.tsx        # (unused/legacy)
```

The frontend is built to `frontend/dist/` and served as static files by FastAPI, so there is
**one process, one port** in production.

On first run, `migrate_legacy_data()` in `utils.py` auto-moves any old root-level `markdowns/`
and `collection.yaml` into `projects/Testing/`.

---

## Data Model

### `collection.yaml`
```yaml
root:
  - path: intro.md
    title: Introduction
    order: 0
    children:
      - path: overview.md
        title: Overview
        order: 0
        children: []
  - path: guide.md
    title: Guide
    order: 1
    children: []
```

- `path` — filename relative to the project's `markdowns/` dir (e.g. `intro.md`, never a full path)
- `title` — display name; auto-synced from the first `# H1` in the file on save
- `order` — integer; used when re-syncing from disk
- `children` — nested nodes (arbitrary depth)

### Orphans
Files present in `projects/{name}/markdowns/` but **not** in `collection.yaml` are "orphans".
They appear at the bottom of the sidebar under a `⚠ Orphans` section and can be dragged into
the hierarchy. Clicking ↻ in the project chip re-scans disk and picks up any hand-dropped files.

---

## API Endpoints

All routes are scoped to a project: `/api/projects/{project_name}/...`

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects/{name}` | Create project |
| POST | `/api/projects/{name}/rename` | Rename project directory |
| DELETE | `/api/projects/{name}` | Delete entire project |
| GET | `/api/projects/{name}/project-md` | Get project.md content |
| PUT | `/api/projects/{name}/project-md` | Save project.md content |
| GET | `/api/projects/{name}/files` | List all `.md` files on disk |
| GET | `/api/projects/{name}/markdown/{path}` | Get raw markdown content |
| POST | `/api/projects/{name}/markdown/{path}` | Create new file (also adds to collection) |
| PUT | `/api/projects/{name}/markdown/{path}` | Save markdown content |
| DELETE | `/api/projects/{name}/markdown/{path}` | Delete file + remove from collection |
| POST | `/api/projects/{name}/rename/{path}` | Rename file + update all collection refs |
| GET | `/api/projects/{name}/collection` | Get `collection.yaml` as structured JSON |
| PUT | `/api/projects/{name}/collection` | Save collection structure |
| GET | `/api/projects/{name}/collection/yaml` | Get `collection.yaml` as raw YAML string |
| PUT | `/api/projects/{name}/collection/yaml` | Save raw YAML string to `collection.yaml` |
| GET | `/api/projects/{name}/orphans` | List files not referenced in collection |

All file paths validated through `safe_path(project, rel_path)` in `utils.py`.

---

## Frontend Architecture

### State (App.tsx)
- `projects: ProjectInfo[]` — list of all projects
- `currentProject: string | null` — active project name (persisted to `localStorage` as `mdtree_project`)
- `collection: CollectionStructure` — the full nav tree (live state)
- `orphans: FileInfo[]` — files on disk not in collection
- `overlayType: "editor" | "yaml" | "project-md" | null` — what's shown in the overlay panel
- `undoStack: {snapshot, movedPath}[]` — up to 20 tree-change undo entries
- `undoPath: string | null` — path of the last moved chip (shows ↩ on that chip)
- `viMode: boolean` — CodeMirror vim keybindings toggle

### Sidebar (Sidebar.tsx)
Single `DndContext` + single `SortableContext` (no nested SortableContexts — they caused
double-transform glitches) containing all node IDs (tree + orphans combined).

**Critical drag-drop implementation details:**
- `verticalListSortingStrategy` used for sliding animation
- Nested items (`depth > 1`) have transforms suppressed — they ride along inside their parent's
  transformed div; applying transforms independently causes double-shift and cascades to vanish
- Dragged item: `opacity: 0`, transform suppressed (invisible; shown only via DragOverlay)
- `handleDragMove` throttled via `prevMoveRef` — only re-renders when overId or zone (nest/sibling/unnest) changes, not on every pixel
- Custom collision detection: `deepestPointerCollision` uses `pointerWithin` + smallest-rect preference — fixes 3-level hierarchy where parent rect swallows children

**Drop zone logic** (`dragDeltaX` = total horizontal movement from drag start):
- `dragDeltaX > 30` → **nest** as first child: shows ghost chip + connector lines at depth+1 below target
- `dragDeltaX < -30` → **unnest** to parent level: shows chip-height spacer at parent indentation
- otherwise → **sibling** reorder: shows chip-height spacer at same indentation
- No colored indicator lines — spacer IS the indicator; ghost chip shown only for nest action

**Drop spacer/ghost rendering (SortableItem.tsx):**
- Sibling/unnest: `<div style={{ height: "40px", marginLeft: connectorWidth }}/>` rendered after the flex chip row
- Nest ghost: connector lines at `depth+1` + dimmed chip showing `activeLabel` (dragged item's label), rendered after chip row, before children
- `connectorWidth = (ancestors.length + 1) * COL_W`
- `activeLabel` prop threads through all recursive SortableItem calls from Sidebar

**Orphan custom ordering:**
- `orphanSort: "recent" | "alpha" | "custom"` state in Sidebar
- `orphanOrder: string[]` synced via useEffect (preserve order, append new, drop removed)
- Drag-to-reorder within orphan list auto-switches to `"custom"` mode
- Three-button toggle: Recent | A→Z | Custom
- Project switch resets both to `[]` / `"recent"`

### Undo
- Ctrl+Z / Cmd+Z globally, or click ↩ on the last-moved chip
- Stack stores `{snapshot: CollectionStructure, movedPath: string | null}`
- **Undo is a toggle**: `handleUndo` replaces the top stack entry with `{snapshot: collection, movedPath: entry.movedPath}` instead of popping — clicking ↩ again reverses the undo
- Only tree reorders are undoable (file create/delete/rename have disk side effects)
- Stack clears on project switch

### Rename (in-place)
Double-click the chip label in the sidebar. Goes through `handleRenameFile` in App.tsx:
1. Normalizes: trims, replaces spaces with hyphens, appends `.md` if missing
2. Calls `POST /api/projects/{name}/rename/{oldPath}`
3. Reloads collection

---

## Key Design Decisions

- **Single port** — FastAPI serves the built frontend; no separate dev server in production
- **Flat file storage** — all `.md` files live directly in `projects/{name}/markdowns/`; hierarchy is only in YAML
- **Backend reads disk on every request** — no in-memory caching; `load_collection()` reads YAML fresh each time
- **Optimistic title sync** — on save, H1 is parsed from content and the sidebar title is updated
  immediately without waiting for a server round-trip
- **`key={...}` on MarkdownEditor** — forces full remount when switching files/projects,
  cleanly resetting CodeMirror state
- **`lineWrapping`** on CodeMirror — prevents horizontal overflow into the preview pane in split mode
- **`minWidth: 0`** on split panes — prevents flex children from overflowing their bounds
- **No nested SortableContexts** — all drag IDs in one flat SortableContext; nested contexts cause conflicting transforms

---

## Development Workflow

```bash
# Start backend (from repo root)
cd backend && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8002

# Build frontend (from repo root) — must use node directly, NOT npm run build
cd frontend && node node_modules/vite/bin/vite.js build

# Or use the start script (does both)
./start.sh
```

The backend auto-reloads on Python file changes. Frontend requires a rebuild to see changes.

---

## Key Design Decisions (additional)

- **Menu positioning**: ProjectChip menu uses `position: fixed` with `getBoundingClientRect()` measured on click — avoids clipping by `overflow: hidden` flex parents. SortableItem menu lives inside the ⋮ `<span>` with `top:"50%", left:"50%"` so the top-left corner lands at the center of the ⋮ button.
- **Menu close without backdrop**: `document.addEventListener("mousedown", handler)` in `useEffect` (not a fixed backdrop overlay) — allows click-through so clicking another button both closes the menu AND triggers that button's action in one click.
- **`insertAsChild` prepends**: new children are added at the top of the children list, not appended; ghost chip reflects this placement.
- **`handleCreateChildFile`**: fetches fresh collection → `removeNode` → `insertAsChild` → `saveCollection` → `setCollection` directly — does NOT call `loadCollection` afterward (which would overwrite the local insert).
- **Backend orphan sort**: `get_all_md_files` returns files sorted by `st_mtime` descending (newest first) — powers the "Recent" orphan sort mode.

---

## Known Issues / Dead Code

- `HierarchyView.tsx` and `YAMLModal.tsx` — unused legacy components, safe to ignore
- No authentication — intended for local single-user use only
- `projects/` directory is currently tracked in git (deliberate, for development testing)

---

## TODO (planned features, not yet implemented)

1. **Import from mkdocs.yml** — parse the `nav:` section of an existing MkDocs config and import it as a project's collection.yaml
2. **Keyboard-only reorder** — arrow keys navigate selection; left/right nest/unnest works, but cross-level up/down moves are not yet supported
3. **Search/filter** — find files by name in a large collection (deprioritized by user)
