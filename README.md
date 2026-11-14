# lager

A Git server with no disk to lose. Repositories live in S3; the servers in
front of it are disposable.

*Lager* is German for warehouse.

## What you get

- Standard Git over HTTPS and SSH. Your client does not know the difference.
- A web interface with files, history, and pull requests, which updates
  open pages on every push.
- Passkeys, personal access tokens, and sign-in with GitHub.
- Two-way GitHub mirrors: a repository follows GitHub, and pushes here go
  there first.
- Per-ref rules, such as who may force-push `main` or delete a release branch.
- Works with AWS S3, Cloudflare R2, and anything else that has conditional
  writes.

## Try it

You need Rust, Bun, Docker, Git 2.45 or later, and the OpenSSL headers.

```bash
scripts/local.ts
```

This builds the server, starts storage, PostgreSQL, and NATS in Docker,
and prints the addresses. Then:

```bash
git clone http://dev:dev-password@127.0.0.1:8080/dev/demo.git
```

The web interface is at http://127.0.0.1:3000/ (sign in as `dev` /
`dev-password`). For something to look at, `bun scripts/seed.ts` adds
repositories with branches, tags, and pull requests in every state.

```bash
scripts/local.ts down
```

removes the containers and their data again.

## Read more

- [HOW_IT_WORKS.md](HOW_IT_WORKS.md): how many servers share one bucket
  without stepping on each other.
- [ARCHITECTURE.md](ARCHITECTURE.md): the design, from the log format to recovery.
- [docs/decisions/](docs/decisions/): why things are the way they are, one decision per file.
- [deploy/README.md](deploy/README.md): running it for real.
- [README.agents.md](README.agents.md): the full reference for every
  command, environment variable, and endpoint. It is written for coding
  agents, and it is where to look things up.

## License

[FSL-1.1-ALv2](LICENSE.md). Use it, change it, and redistribute it for
anything except a competing product or service. Each version becomes
Apache 2.0 two years after its release.
