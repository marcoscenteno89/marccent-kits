/*
 * The Local business kit (marccent-theme's docs/KITS.md): a business that serves an area. Its groups are rc-imp's
 * (content.json, Fields → JSON's shape), with the schema search and answer engines read: the business as a
 * LocalBusiness (its areas served, services, profiles, hours), its questions as an FAQPage, its cities as Places.
 * Patterns show those groups; pages start a site from them. npm run build writes dist/local-business.json.
 */
const { B, h, p, section, grid, stack, card, button, buttons, loop, field } = require( '../../lib/blocks.cjs' );

const call = ( color = 'light' ) => button( '{{ business.phone }}', 'tel:{{ business.telephone }}', 'phone', color );
const quote = ( color = 'primary' ) => button( 'Request a quote', '#form', 'file-signature', color );

// [ slug, title, categories, description, keywords, blocks ]
const patterns = [
	[ 'hero', 'Hero: what the business does, where', [ 'banner' ], 'The top of the home page from the Business group: what it does and where, its summary (the lines search and AI answers quote) and the two next steps.', [ 'hero', 'business' ], [
		section( { surface: 'bg-secondary' }, [
			stack( [
				h( 1, '{{ business.profession }} in {{ business.city }}, {{ business.state }}' ),
				p( '{{ business.summary }}', 'fs-lg measure' ),
				buttons( quote(), call() ),
			] ),
		] ),
	] ],
	[ 'services', 'Services: a card for each service page', [ 'text' ], 'The pages under the services page, a card each, from a Loop: a new service page shows up by itself.', [ 'services', 'cards' ], [
		section( {}, [
			stack( [ h( 2, 'Our services' ), p( '{{ business.service_area }}' ) ] ),
			loop( { postType: 'page', parent: 'services', orderBy: 'menu_order', order: 'asc', perPage: 12, columns: 3, excludeCurrent: true }, [
				card( [
					field( 'image' ),
					field( 'title', { tag: 'h3', link: true } ),
					field( 'excerpt', { format: 'words:24' } ),
					button( 'More about {{ title }}', '{{ link }}' ),
				] ),
			] ),
		] ),
	] ],
	[ 'questions', 'Questions and answers', [ 'text' ], 'The page’s Questions rows as an accordion; the same rows are its FAQPage schema, so what visitors read is what search and AI answers read.', [ 'faq', 'questions' ], [
		section( { surface: 'bg' }, [
			h( 2, 'Questions' ),
			B( 'marccent/accordion', {}, [
				loop( { source: 'questions', perPage: 20 }, [
					B( 'marccent/accordion-item', { header: '{{ question }}' }, [ p( '{{ answer }}' ) ] ),
				] ),
			] ),
		] ),
	] ],
	[ 'contact', 'Contact: a quote form, the hours and the phone', [ 'contact' ], 'A quote form beside the business’s hours and whether it’s open now (Site content → Business).', [ 'contact', 'form', 'hours' ], [
		section( { anchor: 'form' }, [
			grid( { columns: 2, gap: 'gap-lg', alignItems: 'items-start' }, [
				stack( [
					h( 2, 'Get a free quote' ),
					B( 'marccent/form', { submitLabel: 'Send', successMessage: 'Thanks! We got it and will be in touch within a day.' }, [
						B( 'marccent/form-field', { name: 'name', label: 'Name', required: true } ),
						B( 'marccent/form-field', { name: 'phone', label: 'Phone', type: 'tel', required: true } ),
						B( 'marccent/form-field', { name: 'email', label: 'Email', type: 'email' } ),
						B( 'marccent/form-field', { name: 'message', label: 'What do you need?', type: 'textarea' } ),
						B( 'marccent/form-field', { name: 'photo', label: 'A photo (optional)', type: 'file', accept: 'image/*' } ),
					] ),
				] ),
				stack( [
					h( 3, 'Hours' ),
					p( '<strong>{{ business.hours:open_now }}</strong>' ),
					field( 'business.hours' ),
					h( 3, 'Call us' ),
					buttons( call( 'secondary' ) ),
				] ),
			] ),
		] ),
	] ],
	[ 'locations', 'Locations', [ 'contact' ], 'The business’s offices or shops (Site content → Locations), each with its address, phone, hours and directions.', [ 'locations', 'offices' ], [
		section( {}, [ h( 2, 'Where to find us' ), loop( { source: 'locations', from: 'options', perPage: 20, columns: 2 }, [
			card( [
				h( 3, '{{ name }}' ),
				p( '{{ street }}, {{ city }}, {{ state }} {{ postal_code }}' ),
				p( '<a href="tel:{{ telephone }}">{{ phone }}</a>' ),
				field( 'hours' ),
				buttons( button( 'Directions', '{{ map_link }}', 'diamond-turn-right', 'secondary' ) ),
			] ),
		] ) ] ),
	] ],
	[ 'service-areas', 'Service areas: a card for each city', [ 'text' ], 'The cities the business serves (Cities, their own pages), a card each; each city is a Place in the schema, and the business’s areaServed.', [ 'cities', 'areas' ], [
		section( {}, [
			stack( [ h( 2, 'Where we work' ), p( '{{ business.service_area }}' ) ] ),
			loop( { postType: 'city', orderBy: 'title', order: 'asc', perPage: 48, columns: 4 }, [
				card( [ field( 'title', { tag: 'h3', link: true } ), p( '{{ county }}, {{ state }}' ) ] ),
			] ),
		] ),
	] ],
	[ 'gallery', 'Gallery: the gallery page’s photos', [ 'gallery' ], 'The gallery page’s Photos rows in a grid.', [ 'gallery', 'photos' ], [
		section( {}, [
			h( 2, 'Our work' ),
			loop( { source: 'photos', from: 'gallery', perPage: 24, columns: 3, gap: 'gap-sm', paginate: true }, [
				field( 'image' ),
				field( 'caption', { tag: 'p' } ),
			] ),
		] ),
	] ],
];

const shown = ( slug ) => patterns.find( ( pattern ) => pattern[ 0 ] === slug )[ 5 ];

// [ slug, title, parent, blocks ]: the starter pages, from the patterns above.
const pages = [
	[ 'home', 'Home', '', [ ...shown( 'hero' ), ...shown( 'services' ), ...shown( 'questions' ), ...shown( 'contact' ) ] ],
	[ 'services', 'Services', '', [ ...shown( 'services' ), ...shown( 'contact' ) ] ],
	[ 'service-areas', 'Service areas', '', [ ...shown( 'service-areas' ) ] ],
	[ 'gallery', 'Gallery', '', [ ...shown( 'gallery' ) ] ],
	[ 'contact', 'Contact', '', [ ...shown( 'contact' ), ...shown( 'locations' ) ] ],
];

module.exports = {
	kit: {
		name: 'local-business',
		title: 'Local business',
		output: 'wp',
		about: 'A business that serves an area: its details, services, service areas and cities, locations, hours and closed days, reviews and questions.',
		version: 1,
		components: [ 'Section', 'Grid', 'Card', 'Button', 'Accordion', 'AccordionItem', 'Form', 'Field' ],
		needs: [],
	},
	content: require( './content.json' ),
	patterns,
	pages,
	// Sample rows, so the patterns show something until the site's own replace them (Site content).
	site_content: {
		business: {
			name: 'Your business', profession: 'Plumber', services_label: 'plumbing services',
			summary: 'Two or three sentences: what the business does, for whom and where. Search and AI answers quote them.',
			telephone: '+1-555-555-0100', phone: '(555) 555-0100', city: 'Springfield', state: 'IL', country: 'US',
			service_area: 'Springfield and the towns around it',
		},
		services: [ { slug: 'repairs', name: 'Repairs', type: 'Repair', covers: 'What this service covers.' } ],
	},
};
