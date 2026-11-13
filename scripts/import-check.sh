#!/usr/bin/env bash
# The import check (marccent-theme#88, docs/KITS.md): each built kit (dist/<name>.json) imported into a fresh WordPress
# with Marccent Blocks and Marccent Content (their checkouts beside this repo: ../wp/wp-content/plugins, built), then
# checked: its field groups and post types added, its patterns registered, its pages there. Everything runs in throwaway
# containers on a network of their own, removed after, pass or fail.
#
#   npm run kits:import          (needs docker; npm run build first)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGINS="$(cd "$ROOT/../wp/wp-content/plugins" && pwd)"
RUN="marccent-kit-check-$$"
DB_PASSWORD="kit-check-$RANDOM"
cleanup() { docker rm -f "$RUN-wp" "$RUN-db" >/dev/null 2>&1 || true; docker network rm "$RUN" >/dev/null 2>&1 || true; }
trap cleanup EXIT

[ -f "$PLUGINS/marccent-blocks/build/runtime/index.js" ] || { echo "FAIL Marccent Blocks isn't built ($PLUGINS/marccent-blocks: npm run build)"; exit 1; }
docker network create "$RUN" >/dev/null
docker run -d --name "$RUN-db" --network "$RUN" -e MYSQL_ROOT_PASSWORD="$DB_PASSWORD" -e MYSQL_DATABASE=wp mysql:8.4 >/dev/null
docker run -d --name "$RUN-wp" --network "$RUN" \
  -e WORDPRESS_DB_HOST="$RUN-db" -e WORDPRESS_DB_USER=root -e WORDPRESS_DB_PASSWORD="$DB_PASSWORD" -e WORDPRESS_DB_NAME=wp \
  -v "$PLUGINS/marccent-blocks:/var/www/html/wp-content/plugins/marccent-blocks:ro" \
  -v "$PLUGINS/marccent-content:/var/www/html/wp-content/plugins/marccent-content:ro" \
  -v "$ROOT/dist:/kits:ro" wordpress:latest >/dev/null
wp() { docker run --rm --user 33:33 --volumes-from "$RUN-wp" --network "$RUN" \
  -e WORDPRESS_DB_HOST="$RUN-db" -e WORDPRESS_DB_USER=root -e WORDPRESS_DB_PASSWORD="$DB_PASSWORD" -e WORDPRESS_DB_NAME=wp wordpress:cli wp "$@"; }

# The database and WordPress's files, ready.
for i in $(seq 60); do wp core is-installed >/dev/null 2>&1 && break; wp db check >/dev/null 2>&1 && break; sleep 2; done
until docker exec "$RUN-wp" test -f /var/www/html/wp-config.php; do sleep 1; done
wp core install --url=http://kit-check.test --title="Kit check" --admin_user=check --admin_email=check@example.invalid --skip-email --admin_password="$RANDOM$RANDOM" >/dev/null
wp plugin activate marccent-blocks >/dev/null && wp plugin activate marccent-content >/dev/null

failed=0
for file in "$ROOT"/dist/*.json; do
  name="$(basename "$file" .json)"
  if ! wp marccent import "/kits/$name.json" >/dev/null; then echo "FAIL $name: the import failed"; failed=1; continue; fi
  # What the kit has, against what the site has after the import.
  report="$(wp eval '
    $kit = json_decode( file_get_contents( "/kits/'"$name"'.json" ), true )["parts"];
    $spec = mcc_spec();
    $missing = array();
    foreach ( array_keys( $kit["content"]["groups"] ?? array() ) as $g ) { if ( ! isset( $spec["groups"][ $g ] ) ) { $missing[] = "group $g"; } }
    foreach ( array_keys( $kit["content"]["types"] ?? array() ) as $t ) { if ( ! isset( $spec["types"][ $t ] ) ) { $missing[] = "type $t"; } }
    $registry = WP_Block_Patterns_Registry::get_instance();
    foreach ( array_keys( $kit["patterns"] ?? array() ) as $p ) { if ( ! $registry->is_registered( "marccent-kit/$p" ) ) { $missing[] = "pattern $p"; } }
    foreach ( $kit["pages"] ?? array() as $slug => $page ) { if ( ! get_page_by_path( ( $page["parent"] ? $page["parent"] . "/" : "" ) . $slug ) ) { $missing[] = "page $slug"; } }
    echo $missing ? "missing: " . implode( ", ", $missing ) : sprintf( "%d groups, %d post types, %d patterns, %d pages", count( $kit["content"]["groups"] ?? array() ), count( $kit["content"]["types"] ?? array() ), count( $kit["patterns"] ?? array() ), count( $kit["pages"] ?? array() ) );
  ')"
  case "$report" in missing:*) echo "FAIL $name: $report"; failed=1 ;; *) echo "ok   import $name: $report" ;; esac
done
exit $failed
