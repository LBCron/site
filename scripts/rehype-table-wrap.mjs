// Wrap every markdown table in a scrollable container so a wide table
// scrolls sideways inside the post on a phone instead of pushing the whole
// page wider than the screen.
export function rehypeTableWrap() {
	return function (tree) {
		walk(tree);
	};
}

function walk(node) {
	if (!node.children) return;
	node.children.forEach((child, index) => {
		if (child.type === 'element' && child.tagName === 'table') {
			node.children[index] = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['table-wrap'] },
				children: [child],
			};
			return;
		}
		walk(child);
	});
}
