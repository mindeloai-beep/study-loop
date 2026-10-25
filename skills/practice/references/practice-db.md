# Practice database kit

Use this kit to run a throwaway PostgreSQL database with Supabase-style roles. The container is disposable: start it fresh for each session and stop it at the end.

## Rules

- Create, stop, and remove only the container named `study-loop-practice`. Never touch another container.
- Publish no ports. Do not pass `-p`.
- Never pass `-h` to `psql`. Never connect to a host, port, or URL outside the `study-loop-practice` container. Never run `supabase db` commands.
- The only `-h` in this kit is in the readiness check, which runs inside the container against its own loopback address.
- Never read `.env` files or any file that holds a connection string.
- Send files to `psql` on standard input. Never copy files into the container or pass container paths, because Git Bash on Windows rewrites them.

## Image

Use this image:

```text
postgres:17.11-alpine
```

## Start

Run these steps in order:

1. Remove any stale container. An error that the container does not exist is fine.
2. Start the container.
3. Repeat the readiness check once a second until it exits 0, for at most 30 tries. The check uses the loopback address because the image first runs a temporary server that listens only on a Unix socket.

Bash:

```bash
docker rm -f study-loop-practice
docker run -d --rm --name study-loop-practice -e POSTGRES_PASSWORD=practice postgres:17.11-alpine
for i in $(seq 1 30); do docker exec study-loop-practice pg_isready -h 127.0.0.1 -U postgres && break; sleep 1; done
```

PowerShell:

```powershell
docker rm -f study-loop-practice
docker run -d --rm --name study-loop-practice -e POSTGRES_PASSWORD=practice postgres:17.11-alpine
for ($i = 0; $i -lt 30; $i++) { docker exec study-loop-practice pg_isready -h 127.0.0.1 -U postgres; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep -Seconds 1 }
```

## Load a file

Load `references/supabase-stub.sql` once per fresh container, then load the lesson files. The stub is not idempotent: a second load fails.

Bash:

```bash
docker exec -i study-loop-practice psql -U postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose < "FILE"
```

PowerShell (Windows PowerShell 5.1):

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Get-Content -Raw -Encoding UTF8 "FILE" | docker exec -i study-loop-practice psql -U postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose
```

Replace `FILE` with the path of the SQL file.

**Important:** Windows PowerShell 5.1 reads files as ANSI and pipes text as ASCII by default, which turns non-ASCII characters into `?`. Keep the `$OutputEncoding` line and the `-Encoding UTF8` flag.

## Query as a user

Run the query inside one transaction so the role and the claims reset afterward. Send the text on standard input, with no temporary file.

Bash:

```bash
docker exec -i study-loop-practice psql -U postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose <<'SQL'
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"USER_UUID","role":"authenticated"}', true);
QUERY;
rollback;
SQL
```

PowerShell (Windows PowerShell 5.1):

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
@'
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"USER_UUID","role":"authenticated"}', true);
QUERY;
rollback;
'@ | docker exec -i study-loop-practice psql -U postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose
```

Replace these placeholders:

- `USER_UUID`: the UUID of the user to act as.
- `QUERY`: the statement to test.

A denied statement prints `ERROR:  42501`, and `psql` exits non-zero.

## Stop

Stop the container. Because of `--rm`, this also removes it. The command is the same in Bash and PowerShell:

```bash
docker stop study-loop-practice
```
