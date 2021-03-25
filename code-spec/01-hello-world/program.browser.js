const HelloWorld = {};

HelloWorld.Program = class Program {
	static Main(args) {
		console.log("Hello World!");
	}
};

window.addEventListener('load', HelloWorld.Program.Main);