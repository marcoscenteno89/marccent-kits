# Marccent kits

The kits: bundles a WordPress site imports to become a kind of site (a local business, a portfolio): field groups and
post types, the patterns that show them, starter pages and sample rows. No code: everything in a kit is made with the
tools people have (Fields, the block editor). The list, the file's shape and the check are marccent-theme's
[docs/KITS.md](docs/KITS.md).

```
kits/<name>/kit.cjs       the kit: its header, patterns, pages and sample rows
kits/<name>/content.json  its field groups and post types (Marccent Content's spec)
template/                 a new kit's starting point
lib/blocks.cjs            blocks for patterns and pages ([ name, attributes, inner ])
dist/<name>.json          the built kit, the file people import (Tools → Marccent export)
```

`npm test` builds every kit (its blocks saved by Marccent Blocks' serializer, from the checkout projects.json names)
and checks it against the theme this repo pins: the header, every block, class and component it uses, full-word names.

`docs/` links to marccent-theme's docs: the rules. This repo's work is the marccent-theme issues labeled `project: marccent-kits`, on the [Marccent board](https://github.com/users/marcoscenteno89/projects/1).
