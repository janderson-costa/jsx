/*
	JSX.IntrinsicElements é uma interface em TypeScript que define os elementos padrão reconhecidos pela sintaxe JSX, como <div>, <span>, <img>, e outros elementos HTML e SVG.
	Essa interface é usada pelo TypeScript para conferir as propriedades que podem ser aplicadas a cada tipo de elemento, garantindo assim a verificação de tipos ao escrever JSX.
	Por padrão, a interface JSX.IntrinsicElements é mapeada para os elementos HTML e SVG conhecidos, com suas respectivas propriedades.
	Isso significa que você pode usar qualquer elemento HTML nativo, como <section>, <header>, <button>, etc. e o TypeScript fará a verificação de tipos das suas propriedades automaticamente.
*/

declare namespace JSX {
	interface IntrinsicElements {
		[elementName: string]: any; // Permite qualquer elemento HTML ou SVG
	}
}
