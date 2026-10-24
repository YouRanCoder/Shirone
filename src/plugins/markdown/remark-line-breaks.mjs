/**
 * 段落内软换行 → `<br>`（Obsidian / Typora 的默认换行语义）。
 *
 * CommonMark 里段落内的单个换行只是软换行，渲染时被折叠成一个空格，
 * 作者必须写行尾两个空格或 `\` 才是硬换行。Obsidian 的实时预览按源码行显示，
 * 会让从 Obsidian 过来的内容作者误以为“按回车就换行”。
 *
 * 本插件在 AST 层把文本节点里的 `\n` 拆成 `text` + `break` + `text`，
 * 只影响段落、标题、链接文本这类行内容器；代码围栏、行内代码、数学、
 * 原始 HTML 与链接定义保持原样。
 */

import { visit } from "unist-util-visit";

/** 这些父节点里的 `\n` 属于作者原文，不得改写为换行结构。 */
const VERBATIM_PARENTS = new Set([
	"code",
	"inlineCode",
	"html",
	"definition",
	"imageReference",
	"linkReference",
	"math",
	"inlineMath",
	"yaml",
	"toml",
	"json",
]);

/**
 * 把 AST 中所有行内容器里的软换行替换为 `break` 节点。
 *
 * 幂等：已经存在的 `break` 节点不会被重复处理，拆分出的文本节点不再含 `\n`。
 *
 * @param {import('mdast').Root} tree Markdown AST（原地修改）。
 * @returns {number} 被替换的软换行数量。
 */
export function applySoftLineBreaks(tree) {
	let replaced = 0;

	visit(tree, (node, index, parent) => {
		if (node.type !== "text" || !node.value.includes("\n")) return;
		if (!parent || !Array.isArray(parent.children) || index === undefined)
			return;
		if (VERBATIM_PARENTS.has(parent.type)) return;

		const parts = node.value.split(/\r?\n/);
		/** @type {import('mdast').RootContent[]} */
		const replacement = [];
		for (const [position, part] of parts.entries()) {
			if (position > 0) {
				replacement.push({ type: "break" });
				replaced += 1;
			}
			// 空行在段落内不可能出现（那是段落边界），保留防御性跳过即可。
			if (part !== "") replacement.push({ type: "text", value: part });
		}

		parent.children.splice(index, 1, ...replacement);
		return index + replacement.length;
	});

	return replaced;
}

/**
 * remark 插件：按配置决定是否启用 Obsidian 风格软换行。
 *
 * @param {{ enabled?: boolean }} [options] `enabled` 为 false 时退化为 CommonMark 软换行。
 * @returns {(tree: import('mdast').Root) => void} transformer
 */
export function remarkLineBreaks(options = {}) {
	const enabled = options.enabled ?? true;
	return (tree) => {
		if (!enabled) return;
		applySoftLineBreaks(tree);
	};
}
