# Agent instructions

- Don't write tests unless I instruct you to do so.
- To try changes in the running app, run `scripts/local.ts` in the background and wait for "lager is ready"; it prints the address (on the tailnet when Tailscale runs). Each checkout or worktree gets its own containers, data, and ports. Stop it with Ctrl-C (SIGINT).
- [README.agents.md](README.agents.md) is the reference: commands, configuration, operation, and the workspace layout. Keep it current when those change; [README.md](README.md) is the short one for people.
