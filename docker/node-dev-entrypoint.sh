#!/bin/sh
set -eu

home_dir="${HOME:-/tmp/node-home}"
npm_cache_dir="${NPM_CONFIG_CACHE:-$home_dir/.npm}"
lockfile_hash="$(sha256sum package-lock.json | awk '{print $1}')"
platform_stamp="$({
  node <<'EOF'
const header = process.report?.getReport?.().header;
const libc = process.platform === "linux" ? (header?.glibcVersionRuntime ? "glibc" : "musl") : "native";
process.stdout.write(`${process.platform}-${process.arch}-${libc}`);
EOF
})"
stored_hash=""
stored_platform_stamp=""

mkdir -p "$home_dir" "$npm_cache_dir"

if [ -f node_modules/.package-lock.sha256 ]; then
  stored_hash="$(cat node_modules/.package-lock.sha256)"
fi

if [ -f node_modules/.platform-stamp ]; then
  stored_platform_stamp="$(cat node_modules/.platform-stamp)"
fi

if [ ! -d node_modules ] || [ "$stored_hash" != "$lockfile_hash" ] || [ "$stored_platform_stamp" != "$platform_stamp" ]; then
  npm ci
  printf '%s' "$lockfile_hash" >node_modules/.package-lock.sha256
  printf '%s' "$platform_stamp" >node_modules/.platform-stamp
fi

exec "$@"
