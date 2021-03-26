const methodsEquivalence = {
	// System.Console.*    => https://docs.microsoft.com/fr-fr/dotnet/api/system.console
	//    - Properties
	//    - Methods
	'Console.WriteLine': 'console.log',
};

export default class StdLib {
	static transform(sourceCode) {
		for(const dotnetMethod in methodsEquivalence) {
			const jsMethod = methodsEquivalence[dotnetMethod];

			sourceCode = sourceCode.replace(
				new RegExp(dotnetMethod, 'g'), jsMethod
			);
		}

		return sourceCode;
	}
}