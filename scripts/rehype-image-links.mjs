// Wrap every markdown image in a link to its own file, opening in a new tab,
// so a phone reader can tap a text-dense screenshot or diagram and pinch-zoom
// the full-size asset. Images already inside a link are left alone.
export function rehypeImageLinks() {
	return function (tree) {
		walk(tree, null);
	};
}

function walk(node, parent) {
	if (!node.children) return;
	node.children.forEach((child, index) => {
		if (child.type === 'element' && child.tagName === 'img' && node.tagName !== 'a') {
			const src = child.properties?.src;
			if (typeof src === 'string' && src) {
				node.children[index] = {
					type: 'element',
					tagName: 'a',
					properties: { href: src, target: '_blank', rel: ['noopener'], className: ['img-link'], title: 'Open full size' },
					children: [child],
				};
				return;
			}
		}
		walk(child, node);
	});
}
