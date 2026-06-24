# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Nodix is a PHP web application for organizing text notes as bulleted outlines and
rendering them as interactive concept maps (mappe concettuali). The UI language is
Italian — keep user-facing strings, comments, and labels in Italian to match the
existing code.

There is no build system, package manager, test suite, or linter. It is plain PHP
served by a web server, with vanilla JS + jQuery on the front end. All third-party
front-end libraries (Bootstrap 5.3, Bootstrap Icons, jQuery 3.6, vis-network 9.1.2,
html2canvas, jsPDF) are loaded from CDNs, not vendored.

## Running locally

The app needs a PHP-capable web server and a MySQL/MariaDB database.

1. Create the schema: `mysql -u <user> -p < database.sql` (creates the `nodix`
   database and the `NODIX_users`, `NODIX_folders`, `NODIX_texts` tables).
2. Database connection is configured in `config/database.php` via environment
   variables `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` (defaults:
   `localhost`/`root`/empty/`nodix`).
3. Serve the project root with a web server (Apache/Nginx docroot, or
   `php -S localhost:8000` from the repo root) and open `index.php`.

A `Dockerfile` and `docker-compose.yml` are expected by `.gitignore` but are not
committed — there is no containerized setup in the repo.

## Architecture

### Request model
Each `.php` file at the repo root is a standalone page that handles its own POST
logic at the top, then renders HTML below. There is no router, framework, or shared
controller layer. The only shared include is `config/database.php`, which every page
pulls in with `require_once`/`include_once` to get the global `$conn` PDO handle and
the `insert_logo()` helper.

### Authentication & sessions
- Auth is session-based. Every protected page calls `session_start()` then redirects
  to `login.php` if `$_SESSION['user_id']` is unset (see top of `dashboard.php`,
  `editor.php`).
- Passwords are hashed with `password_hash`/`password_verify` (`register.php`,
  `login.php`).
- All user-scoped DB queries filter by `user_id = $_SESSION['user_id']`, and
  ownership is re-checked before update/delete. Preserve this pattern when adding
  features — it is the only access-control mechanism.
- All DB access uses PDO prepared statements with bound parameters. Keep using them;
  never interpolate user input into SQL. Echo user data through `htmlspecialchars()`
  as the existing templates do.

### Pages
- `index.php` — public landing page (no PHP logic, no session gate).
- `register.php` / `login.php` / `logout.php` — account lifecycle.
- `dashboard.php` — lists the user's folders and texts; handles folder creation and
  text save via plain POST, and text deletion via an AJAX endpoint
  (`dashboard.php?action=delete_text`, returns JSON). Client-side folder filtering is
  done in jQuery inline at the bottom of the file.
- `editor.php` — create/edit a single text (keyed by `?id=`), pick its folder, and
  generate/export the concept map. On save it redirects back to `dashboard.php`.
- `sandbox.php` — same map-generation experience as the editor but with no auth and
  no persistence, for trying the tool without an account.

### Concept map generation (`js/map-generator.js`)
This is the core feature and the most complex file. It is a single jQuery
`$(document).ready` IIFE that turns an indented bullet outline into a vis-network
graph. Key points:
- **Input format**: the textarea content is parsed line by line. Indentation is
  measured in spaces, and **every 4 spaces = one nesting level** (see
  `js/text-editor.js`, which intercepts Tab/Backspace to insert/remove exactly 4
  spaces). The page title becomes the root node (level 1); top-level bullets are
  level 2.
- **Parser**: a `parentStack` of `{id, level}` tracks nesting; a node's vis level is
  its parent's level + 1. Leading bullet glyphs (`• - *`) are stripped.
- **`currentMapData`** is the clean source of truth — nodes/edges *without* `x`,
  `y`, or `physics` properties. Layout functions take deep copies
  (`JSON.parse(JSON.stringify(...))`) so they never mutate this source. When changing
  layout code, keep `currentMapData` free of positional/physics props, or hierarchical
  re-layout will break.
- **Layout directions** (chosen from the gear dropdown via `data-direction`): `UD`,
  `DU`, `LR`, `RL` use vis-network's built-in hierarchical layout with physics-based
  stabilization that is disabled once stable. `UD_CENTER` and `LR_CENTER` are custom
  layouts (`createCenteredVerticalLayout` / `createCenteredHorizontalLayout`) that
  compute explicit x/y, split level-2 nodes into two halves around the root, and run
  with physics off.
- **Node distance** is a single tunable (50–400) wired to the +/- buttons and input;
  changing it re-runs the current layout.
- **Export**: PNG via html2canvas, PDF via html2canvas + jsPDF, both rendering the
  `#mapContainer` element.

`js/text-editor.js` is shared across `sandbox.php`, `editor.php` (`#content`), and
`dashboard.php` (`#text_content`); it wires up the Tab/Backspace 4-space behavior by
element id.

## Database schema
Three tables, all prefixed `NODIX_` (`database.sql`):
- `NODIX_users` (id, username, email, password, created_at)
- `NODIX_folders` (id, user_id → users, name) — `ON DELETE CASCADE`
- `NODIX_texts` (id, user_id → users, folder_id → folders, title, content,
  created_at, updated_at) — folder FK is `ON DELETE SET NULL`, so a text can exist
  with no folder.

## Conventions
- UI text, code comments, and commit-relevant strings are in Italian.
- New pages should follow the existing top-of-file pattern: `session_start()`,
  `require_once 'config/database.php'`, auth gate (if protected), POST handling,
  then HTML using Bootstrap 5 markup and the shared navbar.
- Front-end interactivity is jQuery, often inlined in `<script>` blocks at the bottom
  of the page; shared logic lives in `js/`.
