/*
 * Blocks for a kit's patterns and pages, as Marccent Blocks' serializer takes them: [ name, attributes, inner ].
 * The serializer saves each with the block's own save(), so the editor opens it as valid blocks (npm run build).
 * Attribute names are the settings' full words (markup/settings.json): verticalPadding, columns.
 */
const B = ( name, attributes = {}, inner = [] ) => [ name, attributes, inner ];
const h = ( level, content, attributes = {} ) => B( 'core/heading', { level, content, ...attributes } );
const p = ( content, className ) => B( 'core/paragraph', className ? { content, className } : { content } );
const section = ( attributes, inner ) => B( 'marccent/section', { verticalPadding: 'pad-y-lg', ...attributes }, inner );
const grid = ( attributes, inner ) => B( 'marccent/grid', attributes, inner );
const stack = ( inner, gap = 'gap-sm' ) => grid( { columns: 1, gap, alignItems: 'items-start' }, inner );
const card = ( inner, attributes = {} ) => B( 'marccent/card', { hover: '', ...attributes }, inner );
const button = ( label, href, icon = 'arrow-right', color = 'primary' ) => B( 'marccent/button', { label, href, icon, color } );
const buttons = ( ...list ) => grid( { layout: 'row-wrap', gap: 'gap-sm' }, list );
const loop = ( attributes, item ) => B( 'marccent/loop', attributes, item );
const field = ( key, attributes = {} ) => B( 'marccent/field', { key, ...attributes } );

module.exports = { B, h, p, section, grid, stack, card, button, buttons, loop, field };
