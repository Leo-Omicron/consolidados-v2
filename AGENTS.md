## MEMORY SAVE RULES (mandatory — do not skip)

EVERY `mem_save` call MUST include `project: "consolidados-v2"` explicitly.
EVERY `mem_session_summary` MUST be verified with `mem_search` immediately after.

Before closing ANY session:
1. `mem_save` or `mem_session_summary` with explicit project
2. `mem_search` project="consolidados-v2" query="<what you just saved>" 
3. Confirm the IDs appear in the correct project
4. If not found → re-save with explicit project, do NOT proceed

The MCP server's CWD is NOT the source of truth for project context. You have been burned by this. Do not trust auto-detection.
