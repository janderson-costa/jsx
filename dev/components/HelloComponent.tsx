import { jsx, watch } from '@/index';

interface HelloComponentProps {
	name?: string;
}

export function HelloComponent({ name = 'Mundo' }: HelloComponentProps = {}) {
	const countText = document.createTextNode('0');

	const likes = watch({ count: 0 }, (obj, key, value) => {
		countText.textContent = String(obj.count);
	});

	return (
		<div class="hello">
			<h1>Olá, {name}!</h1>
			<p>Exemplo simples da JSX factory sem React.</p>
			<p>Likes: {countText}</p>
			<button onClick={() => likes.count++}>👍</button>
		</div>
	);
}
