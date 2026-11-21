# Code runner (Piston)

Practice challenges are graded by running the student's program against test cases.
Pass/fail and correctness come only from those results; the AI only scores style and writes feedback.
The app talks to any [Piston](https://github.com/engineer-man/piston)-compatible API (`src/lib/runner/piston.ts`).

| Env var | Example | Notes |
|---|---|---|
| `CODE_RUNNER_URL` | `http://localhost:2000/api/v2` | Base URL; the client POSTs to `<base>/execute`. |
| `CODE_RUNNER_TOKEN` | (empty) | Optional. Sent as `Authorization: Bearer <token>`. |

If the runner is unset or down, Run/Submit return 503 and the student is refunded. New challenges are
still created, but marked "unverified" because their tests couldn't be checked against the reference solution.

## Hosted options (checked November 2026)

- **emkc.org public Piston API**: whitelist-only since 15 Feb 2026 (returns 401). The maintainer says keys are
  not issued for university assignments or individual projects, so it can't be used here.
- **Judge0 CE** (`ce.judge0.com`): answers unauthenticated requests, but it's a different API (it's not
  Piston-compatible) and a shared demo instance isn't something to depend on for production.
- **Self-hosting Piston** (below) is free and is what this project uses.

## Production: `runner/` on the Oracle VM

The Piston image is x86-only and the Oracle Always Free VM is ARM, so production uses `runner/`: a
Piston-compatible `/api/v2/execute` written with the Node standard library only. It runs every compile and run
stage in a fresh container from one Alpine image that holds Python 3.12, Node 20, Deno 1.43, g++ 13, Go 1.22,
Rust 1.78 and Java 21.

Each container runs with no network, a read-only root, no capabilities, uid 65534, a 64-process limit, 1 CPU,
the request's memory limit (no swap) and a 64 MB `/tmp`. Compiled output is cached by source hash, so N tests
compile once. At most 4 containers run at a time; further jobs queue.

| Piece | On the VM |
|---|---|
| Image | `mentora-runner:1`, built from `runner/Dockerfile` |
| Service | `mentora-runner.service` runs `/opt/mentora-runner/server.mjs` on `127.0.0.1:2000` as user `mentora-runner` (in the `docker` group) |
| Token | `/etc/mentora-runner.env` (`RUNNER_TOKEN=`, same value as `CODE_RUNNER_TOKEN`) |
| Public URL | `https://mentora-runner.ihassn.com/api/v2` through the Cloudflare tunnel `mentora-runner` (`cloudflared-mentora-runner.service`) |

Redeploy after changing `runner/`:

```bash
scp runner/* ubuntu@<vm>:~/mentora-runner/
ssh ubuntu@<vm> 'cd ~/mentora-runner && sudo docker build -t mentora-runner:1 . \
  && sudo install -m 644 server.mjs /opt/mentora-runner/ && sudo systemctl restart mentora-runner'
```

## Self-hosting Piston (x86 hosts)

Needs a Linux host with Docker and cgroup v2 (an Oracle Always Free VM works). The container runs privileged
because Piston sandboxes every job with `isolate`, and it has no network access inside jobs.

```bash
docker compose -f docker-compose.runner.yml up -d

# install the languages the editor offers (each download is 50–400 MB)
for p in "python 3.12.0" "node 20.11.1" "deno 1.32.3" "java 15.0.2" "gcc 10.2.0" "go 1.16.2" "rust 1.68.2"; do
  set -- $p
  curl -s -X POST localhost:2000/api/v2/packages -H 'Content-Type: application/json' \
    -d "{\"language\":\"$1\",\"version\":\"$2\"}"; echo
done

curl -s localhost:2000/api/v2/runtimes

# end-to-end check: every language solves a sample problem, failures are classified
CODE_RUNNER_URL=http://localhost:2000/api/v2 npx tsx src/lib/runner/runner.smoke.ts
```

TypeScript runs on Deno (`deno 1.32.3`), not Piston's `typescript` package: that one compiles to ES5 with no
Node typings, so ordinary code using `Set` iteration or `require` fails to compile. Starter code reads stdin
with `Deno.readAll(Deno.stdin)`.

If package downloads fail with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, something on the host is intercepting TLS
(antivirus web shields do this). Mount that root certificate into the container and set `NODE_EXTRA_CA_CERTS` to it.

The compose file binds to `127.0.0.1:2000` only. To reach it from the deployed app, put a reverse proxy with
TLS in front of it that rejects requests without the token, for example nginx:

```nginx
location /api/v2/ {
    if ($http_authorization != "Bearer <CODE_RUNNER_TOKEN>") { return 401; }
    proxy_pass http://127.0.0.1:2000;
    proxy_read_timeout 60s;
}
```

Then set `CODE_RUNNER_URL=https://<host>/api/v2` and `CODE_RUNNER_TOKEN=<token>` in the app's environment.

## Limits

Set in the client (`LIMITS` in `piston.ts`) and capped server-side by the compose env:
compile 10 s, run 3 s wall time per test, 256 MB memory, 8,000 output characters kept per stream
(anything longer fails the test), 50,000 characters of source code. Run is limited to 10 per minute and
Submit to 4 per minute per student, counted from `coding_submissions`.
Each test is a separate execution, so compiled languages compile once per test. The first test runs alone so a
compile error costs one execution, then the rest run 3 at a time.
