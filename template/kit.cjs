/*
 * A new kit: copy this folder to kits/<name>/ (full words, hyphens), fill it in, add its row to marccent-theme's
 * docs/KITS.md, then npm test (it builds dist/<name>.json and checks it). The file's shape is in docs/KITS.md.
 *
 * - content.json: its field groups and post types, in Marccent Content's spec (Fields → JSON). Give a group that says
 *   what something is its schema ("schema": a schema.org type and how its fields map), so search and AI answers read it.
 * - patterns: what shows the kit's data (a look-only pattern belongs in marccent-patterns instead).
 * - pages: starter pages, built from the patterns.
 * - site_content: sample rows for the site's groups, until the site's own replace them.
 */
const { B, h, p, section, grid, stack, card, button, buttons, loop, field } = require( '../../lib/blocks.cjs' );

// [ slug, title, categories, description, keywords, blocks ]
const patterns = [];

// [ slug, title, parent, blocks ]
const pages = [];

module.exports = {
	kit: {
		name: 'kit-name',
		title: 'Kit name',
		output: 'wp',
		about: 'One line: what kind of site it makes.',
		version: 1,
		components: [],
		needs: [],
	},
	content: require( './content.json' ),
	patterns,
	pages,
	site_content: {},
};
