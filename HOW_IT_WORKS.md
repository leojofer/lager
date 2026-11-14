# How lager works

Most Git servers keep repositories on a local disk, and then spend their
lives replicating and backing up that disk. lager keeps every repository
in an S3-compatible bucket instead. A server holds only a cache, which it
can rebuild from the bucket at any time.

So you can run one server or twenty behind a load balancer, and any of
them can answer any request. Delete one and nothing is lost.

## One object decides

What keeps the servers from stepping on each other is one small object per
repository, the head. A push counts only once the server has swapped that
object, and the swap succeeds only if nobody else got there first. That
single compare-and-swap puts all changes of a repository in one order,
without locks and without the servers talking to each other.

## A push

1. Git sends its objects, and the server checks them and the user's access.
2. The server uploads the objects as a pack and writes a log entry that
   names the pack and the ref changes.
3. The server swaps the head to point at that entry. If another push won
   the race, this one starts over from the new state or is rejected, as
   with any Git server.
4. Only then does the client see `accepted`.

Every 200 entries, the server that took the push writes a snapshot, so
that a cold server does not have to replay the whole log.

## A read

A server that has not seen a repository yet fills its cache from the
latest snapshot and the log entries after it. From then on, every request
checks the head first and fetches only what is new. After a push, the
server also announces the change over NATS so that the others catch up at
once; a lost announcement costs nothing, because the head is still checked.

## The rest

Users, tokens, keys, and pull requests live in PostgreSQL. The list of
repositories lives in the bucket, beside the repositories.

[ARCHITECTURE.md](ARCHITECTURE.md) has the full design, and
[docs/decisions/](docs/decisions/) the reasons behind each choice.
