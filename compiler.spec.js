import assert from 'assert';
import fs from 'fs';

import Compiler from './compiler.js';

function inlineCode(sourceCode) {
	return sourceCode.replace(/\t/g, '')
		.replace(/\ \{/g, '{')
		.replace(/\r\n/g, '')
		.replace(/\n/g, '');
}

function isCodeEquivalent(a, b) {
	assert.equal(
		inlineCode(a),
		inlineCode(b),
`
Actual:
${a}

Expected:
${b}`
	);
}

// Run tests
describe('• Compiler', () => {
	describe('• Hello world', () => {
		const helloWorldCS_A = fs.readFileSync('code-spec/01-hello-world/Program.a.cs', 'utf8');
		const helloWorldCS_B = fs.readFileSync('code-spec/01-hello-world/Program.b.cs', 'utf8');

		it('Browser', () => {
			const helloWorldJS_Browser = fs.readFileSync('code-spec/01-hello-world/program.browser.js', 'utf8');

			isCodeEquivalent(
				Compiler.transformToBrowser(helloWorldCS_A),
				helloWorldJS_Browser
			);

			isCodeEquivalent(
				Compiler.transformToBrowser(helloWorldCS_B),
				helloWorldJS_Browser
			);
		});

		it('Node', () => {
			const helloWorldJS_Node = fs.readFileSync('code-spec/01-hello-world/program.node.js', 'utf8');

			isCodeEquivalent(
				Compiler.transformToNode(helloWorldCS_A),
				helloWorldJS_Node
			);

			isCodeEquivalent(
				Compiler.transformToNode(helloWorldCS_B),
				helloWorldJS_Node
			);
		});
	});
});
