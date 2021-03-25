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

	static replaceStdMethods(csCode) {
		csCode = csCode.replace('Console.WriteLine', 'console.log');

		return csCode;
	}

	static removeScopes(csCode) {
		csCode = csCode.replace(/public/g, '');
		csCode = csCode.replace(/private/g, '');
		csCode = csCode.replace(/protected/g, '');

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
		// TODO: improve
		csCode = csCode.replace(/void/g, '');
		csCode = csCode.replace(/string\[\]/g, '');

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

		csCode = Compiler.removeScopes(csCode);
		csCode = Compiler.applyNamespaceToClasses(csCode);

		csCode = Compiler.replaceTypes(csCode);
		csCode = Compiler.replaceStdMethods(csCode);

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