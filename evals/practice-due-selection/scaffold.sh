# Copies the checker's fixture notes into ./notes and writes test settings in the run's working directory.
# One taught idea is due yesterday, and the other is due in 30 days.
set -e
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
src="$here/../../tests/fixtures/notes/My Vault (Test's)/Learning"
if [ ! -d "$src" ]; then
  echo "fixture notes not found: $src" >&2
  exit 1
fi
yesterday=$(date -d '1 day ago' +%Y-%m-%d 2>/dev/null || date -v-1d +%Y-%m-%d)
later=$(date -d '30 days' +%Y-%m-%d 2>/dev/null || date -v+30d +%Y-%m-%d)
mkdir -p .study-loop
cp -R "$src" notes
printf '%s\n' '{"notes_dir": "./notes", "practice_repos": []}' > .study-loop/settings.json
# Rewrites the next_practice line of note $1 to date $2.
set_date() {
  sed "s/^next_practice: .*/next_practice: $2/" "$1" > "$1.tmp"
  mv "$1.tmp" "$1"
}
set_date "notes/postgres-grants/ideas/Column privileges are checked per named column.md" "$yesterday"
set_date "notes/postgres-grants/ideas/What does auth.uid() return-.md" "$later"
