import StdLib from './stdLib.js';

export default class Compiler {
	static extractLines(csCode) {
		return csCode
			.split('\n')
			.map((elt) => elt.trim())
			.filter((elt) => elt !== '');
	}

	static isNamespace(line) {
		return line.includes('namespace ');
	}

	static getNamespaceName(line) {
		return line
			.replace(/namespace/g, '')
			.replace(/{/g, '')
			.trim();
	}

	static getNamespaces(lines) {
		return lines
			.filter(Compiler.isNamespace)
			.map(Compiler.getNamespaceName);
	}

	static isClass(line) {
		return line.includes('class ');
	}

	static getClassName(line) {
		return line
			.replace(/class/g, '')
			.replace(/{/g, '')
			.trim();
	}

	static generateNamespaceList(namespaces) {
		let namespaceDecl = '';

		for(const namespace of Array.from(new Set(namespaces))) {
			namespaceDecl += `const ${namespace} = {};
`;
		}

		return namespaceDecl;
	}

	static removeUsings(csCode) {
		let lines = Compiler.extractLines(csCode);

		lines = lines.filter((elt) => !elt.startsWith('using ') || elt.includes('{'));

		return lines.join('\n');
	}

	static removeScopes(csCode) {
		csCode = csCode.replace(/public let/g, '');
		csCode = csCode.replace(/public/g, '');
		csCode = csCode.replace(/private let/g, '');
		csCode = csCode.replace(/private/g, '');
		csCode = csCode.replace(/protected let/g, '');
		csCode = csCode.replace(/protected/g, '');
		csCode = csCode.replace(/internal let/g, '');
		csCode = csCode.replace(/internal/g, '');
		csCode = csCode.replace(/protected internal let/g, '');
		csCode = csCode.replace(/protected internal/g, '');
		csCode = csCode.replace(/private protected let/g, '');
		csCode = csCode.replace(/private protected/g, '');
		csCode = csCode.replace(/static let/g, 'static');

		return csCode;
	}

	static applyNamespaceToClasses(csCode) {
		const lines = Compiler.extractLines(csCode);

		let namespace = '';
		const output = [];
		let namespaceBracketAmount = 0;
		for(let i = 0; i < lines.length; i++) {
			let line = lines[i];

			if(Compiler.isNamespace(line)) {
				namespace = Compiler.getNamespaceName(line);
				namespaceBracketAmount = 0;

				if(!line.includes('{')) {
					i++;
				}

				continue;
			}

			if(line.includes('{')) {
				namespaceBracketAmount++;
			}

			if(line.includes('}')) {
				namespaceBracketAmount--;

				if(namespaceBracketAmount < 0) {
					output[output.length - 1] += ';';
					continue;
				}
			}

			if(Compiler.isClass(line)) {
				const className = Compiler.getClassName(line);

				line = line.replace(/class/g, `${namespace}.${className} = class`);
			}

			output.push(line);
		}

		return output.join('\n');
	}

	static replaceTypes(csCode) {
		const typeList = [
			'void',
			'string',
			'int',
			'float',
			'double',
			'long',
		];

		for(const type of typeList) {
			csCode = csCode.replace(
				new RegExp('\\(' + type + '\\[\\]', 'g'),
				'('
			);

			csCode = csCode.replace(
				new RegExp(type + '\\[\\] ', 'g'),
				'let '
			);

			csCode = csCode.replace(
				new RegExp('\\(' + type, 'g'),
				'('
			);

			csCode = csCode.replace(
				new RegExp(type + ' ', 'g'),
				'let '
			);
		}

		return csCode;
	}

	static cleanSpaces(csCode) {
		let replaced = csCode;
		do {
			csCode = replaced;
			replaced = csCode.replace(/\s\s/g, ' ').replace(/\(\s/g, '(');
		} while(csCode !== replaced);

		return csCode;
	}

	static indent(csCode) {
		const lines = Compiler.extractLines(csCode);

		let tabAmount = 0;
		const output = [];
		for(let line of lines) {
			if(line.includes('}')) {
				tabAmount--;
			}

			if(tabAmount > 0) {
				line = '\t'.repeat(tabAmount) + line;
			}

			if(line.includes('{')) {
				tabAmount++;
			}

			output.push(line);
		}

		return output.join('\n');
	}

	static generateClasses(csCode) {
		csCode = Compiler.removeUsings(csCode);

		csCode = Compiler.applyNamespaceToClasses(csCode);

		csCode = Compiler.replaceTypes(csCode);
		csCode = Compiler.removeScopes(csCode);

		csCode = StdLib.transform(csCode);

		csCode = Compiler.cleanSpaces(csCode);
		csCode = Compiler.indent(csCode);

		return csCode;
	}

	static transformToBrowser(csCode) {
		const { code, namespace } = Compiler.transform(csCode);

		return (
`${code}

window.addEventListener('load', ${namespace}.Program.Main);`
		);
	}

	static transformToNode(csCode) {
		const { code, namespace } = Compiler.transform(csCode);

		return (
`${code}

${namespace}.Program.Main();`
		);
	}

	static transform(csCode) {
		const lines = Compiler.extractLines(csCode);

		const namespaces = Compiler.getNamespaces(lines);
		const namespaceList = Compiler.generateNamespaceList(namespaces);

		const classesList = Compiler.generateClasses(csCode);

		const code = (
`${namespaceList}
${classesList}`
		);

		return { code, namespace: namespaces[0] };
	}
}