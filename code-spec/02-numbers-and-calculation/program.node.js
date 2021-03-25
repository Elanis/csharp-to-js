const HelloWorld = {};

HelloWorld.Program = class Program {
	static Main(args) {
		let a = 2;
		let b = 3.0;
		let c = 5.5;
		let d = 6;

		console.log(a + b);
		console.log(c * d);
	}
};

HelloWorld.Program.Main();