import assert from "node:assert/strict";
import { test } from "node:test";

import {
	applySoftLineBreaks,
	remarkLineBreaks,
} from "../../../../src/plugins/markdown/remark-line-breaks.mjs";
import { siteMarkdownProcessor } from "../../../../src/utils/markdown-processor.mjs";

const renderer = await siteMarkdownProcessor.createRenderer({});

async function render(markdown) {
	const { code } = await renderer.render(markdown);
	return code;
}

test("renders intra-paragraph newlines as break elements", async () => {
	const html = await render("第一行\n第二行\n第三行");

	assert.equal(html.match(/<br>/g)?.length, 2);
	assert.match(html, /<p>第一行<br>\n第二行<br>\n第三行<\/p>/);
});

test("keeps block boundaries: separate paragraphs stay separate", async () => {
	const html = await render("段落一\n\n段落二");

	assert.equal(html.match(/<br>/g)?.length ?? 0, 0);
	assert.equal(html.match(/<p>/g)?.length, 2);
});

test("does not touch fenced code, inline code, or math", async () => {
	const html = await render(
		"```js\nconst a = 1;\nconst b = 2;\n```\n\n行内 `code\nvalue` 保留\n\n$$\na = b\n$$",
	);

	assert.doesNotMatch(html, /<code[^>]*>[^<]*<br>/);
	assert.match(html, /<span class="line">/);
	assert.equal(html.match(/<br>/g)?.length ?? 0, 0);
});

test("does not touch list items or table rows", async () => {
	const html = await render(
		"- 项目一\n- 项目二\n\n| a | b |\n| - | - |\n| 1 | 2 |",
	);

	assert.equal(html.match(/<br>/g)?.length ?? 0, 0);
	assert.equal(html.match(/<li>/g)?.length, 2);
});

test("applies inside blockquotes and directive labels", async () => {
	const html = await render(
		"> 引用第一行\n> 引用第二行\n\n:::spoiler[秘密\n第二行]\n正文\n:::",
	);

	assert.match(html, /引用第一行<br>\n引用第二行/);
	assert.match(html, /秘密<br>\n第二行/);
});

test("respects explicit hard breaks and stays idempotent", async () => {
	const html = await render("硬换行  \n下一行");

	assert.equal(html.match(/<br>/g)?.length, 1);

	const tree = {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [{ type: "text", value: "一行\n二行" }],
			},
		],
	};
	assert.equal(applySoftLineBreaks(tree), 1);
	assert.equal(applySoftLineBreaks(tree), 0);
});

test("disabled option falls back to CommonMark soft breaks", () => {
	const tree = {
		type: "root",
		children: [
			{ type: "paragraph", children: [{ type: "text", value: "一行\n二行" }] },
		],
	};

	remarkLineBreaks({ enabled: false })(tree);

	assert.equal(tree.children[0].children.length, 1);
	assert.equal(tree.children[0].children[0].type, "text");
});
