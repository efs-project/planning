# planning
Project management, kanban, ideas, etc

# EFS Planning & Architecture Vault

**Notice to Autonomous Agents (Codex, Claude, Antigravity):** This repository serves as the central brain, project tracker, and architectural source of truth for the Ethereum File System (EFS) project. You are to interact with this repository strictly via file system I/O (reading and writing `.md` files). 

Humans interact with these files via Obsidian. Note that for any syntax or file structure restrictions.

---

## 📂 Directory Structure

* `Kanban.md`: The central Kanban board tracking all project tasks. This is powered by the Kanban Obsidian plugin.
* `_Index.md`: A table of files in this project.
* `_Notes.md`: Random uncategorized notes.
* `Architecture/`: Detailed design documents, specifications, and database schemas.
* `README.md`: This file (Standard Operating Procedures).

---

## 🤖 Agent Standard Operating Procedure (SOP)

When initialized to work on the EFS codebase (located in the sibling `contracts` repository), you must follow this workflow:

1.  **Sync State:** Always read `Kanban.md` first to understand the current priority and what is marked as "In Flight".
2.  **Verify Context:** If a task relates to a core system (e.g., File Semantics, Caching), search the `Architecture/` directory for relevant design constraints before writing code.
3.  **Document First:** When designing a new feature, write the Markdown documentation into the `Architecture/` folder *before* writing the Solidity or JS/TS code. 
4.  **Update State:** When a task or sub-task is completed, update the relevant files in this repository to reflect the new state.

---

## 📋 The Kanban Protocol (`Kanban.md`)

The human project lead views `Kanban.md` using the Obsidian Kanban plugin. To prevent breaking the visual UI, **you must adhere strictly to standard Markdown list formatting** when updating this file. 

### Board Structure
The board is structured using Markdown Header 2 (`##`) for columns, and unordered checklists (`- [ ]`) for tasks. 
## Backlog 
- [ ] Implement symlink logic 

## In Flight 
- [ ] Build attestation caching layer 

## Done 
- [x] Create EFS planning repo


---

## ✅ The Sub-Task Protocol

For granular tasks that do not belong on the main Kanban board, you may drop standard Markdown checkboxes into _any_ file in this vault. The human lead uses a global Tasks rollup.

**Format:** `- [ ] Sub-task description here`

If you are working inside an architecture document (e.g., `Architecture/caching.md`) and discover a bug or missing feature, add a checklist item to the bottom of that specific document.

---

## 🏗️ Architecture Documentation Rules

When creating new `.md` files in the `Architecture/` directory:

1. Use clear, hierarchical headers (`#`, `##`, `###`).
    
2. When defining data structures (e.g., tens, tags, properties), use standard Markdown tables.
    
3. If a template exists in the vault for design docs, you must read and adhere to its structure.
    
4. Link related concepts by using Wiki-style links `[[Filename]]` to allow the human lead to navigate the vault easily.