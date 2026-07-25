# jsx

JSX Factory que transforma a sintaxe JSX em elementos DOM nativos, **sem Virtual DOM e sem depender do React**. É um pragma customizado (`jsxFactory`) que o TypeScript/Bun chama diretamente para produzir `HTMLElement`s reais, mais um pequeno conjunto de utilitários para estado reativo (`watch`, `subscribe`, `bindProp`, `createContext`) e reconciliação de listas (`load`).

A ideia é ter a ergonomia de escrever componentes em JSX, mas com o mínimo de abstração possível entre o seu código e o DOM.

## Como funciona

O `tsconfig.json` configura o TypeScript para usar uma função `jsx` própria como fábrica de elementos (em vez de `React.createElement`):

```json
{
	"compilerOptions": {
		"jsx": "react",
		"jsxFactory": "jsx",
		"paths": { "@/*": ["./src/*"] }
	}
}
```

Isso faz com que todo `<div>...</div>` escrito em `.tsx` vire uma chamada a `jsx('div', props, ...children)`, definida em [src/index.ts](src/index.ts). Essa função:

- Cria o elemento (`document.createElement`) se `tag` for string, chama a função se `tag` for um componente, ou instancia a classe se `tag` for uma classe-componente.
- Aplica `props`: `on*` vira `addEventListener`, `checked`/`disabled`/`selected`/`readonly`/`hidden`/`addClass` têm tratamento especial, o resto vira `setAttribute`.
- Anexa `children`, ignorando `null`/`undefined`/`boolean` (permitindo os idiomas `condição && <X/>` e `condição ? <X/> : null`, como no React).

## Recursos

- **`jsx(tag, props, ...children)`** — a fábrica de elementos usada por baixo de todo JSX.
- **`watch(data, onChange?)`** — envolve um objeto num `Proxy` que notifica listeners quando uma propriedade de nível superior muda. Notificações são assíncronas (agrupadas em microtask).
- **`subscribe(reactive, listener)`** — inscreve mais um listener num objeto reativo; retorna função de cancelamento.
- **`bindProp(reactive, key, apply)`** — aplica `apply` imediatamente e de novo toda vez que `key` mudar.
- **`createContext(initial)`** — um objeto reativo (`watch`) pensado para ser exportado de um módulo e importado por qualquer componente, sem prop drilling (o singleton de módulo do ES já cumpre o papel do Provider).
- **`isReactive(value)`** — verifica se um valor foi criado por `watch()`/`createContext()`.
- **`load(container, items, render, getKey?)`** — reconcilia os filhos de um container com uma lista de itens, reaproveitando os nós dos itens que não mudaram (por referência) em vez de recriar tudo a cada render.

## Exemplos de uso

### Componente simples com estado reativo

```tsx
import { jsx, watch } from '@/index';

function HelloComponent({ name = 'Mundo' }) {
	const countText = document.createTextNode('0');

	const likes = watch({ count: 0 }, (obj) => {
		countText.textContent = String(obj.count);
	});

	return (
		<div class="hello">
			<h1>Olá, {name}!</h1>
			<p>Likes: {countText}</p>
			<button onClick={() => likes.count++}>👍</button>
		</div>
	);
}
```

### Lista reativa com reconciliação (`load`)

```tsx
import { jsx, watch, load } from '@/index';
import { Task } from './Task';

function TodoList({ todo = { tasks: [] } }) {
	const list = <ul class="todo-list"></ul> as HTMLUListElement;

	const state = watch(todo, () => loadTasks());

	function loadTasks() {
		load(list, state.tasks, task => (
			<Task {...task} onToggle={() => toggleTask(task.id)} />
		));
	}

	function toggleTask(id: number) {
		state.tasks = state.tasks.map(task =>
			task.id === id ? { ...task, done: !task.done } : task
		);
	}

	loadTasks();

	return <div class="todo-list-app">{list}</div>;
}
```

### Context sem prop drilling

```tsx
// theme.ts
import { createContext } from '@/index';

export const theme = createContext({ mode: 'dark' as 'dark' | 'light' });
```

```tsx
// ThemeToggle.tsx — qualquer componente pode importar o mesmo context
import { jsx, bindProp } from '@/index';
import { theme } from './theme';

export function ThemeToggle() {
	const button = (
		<button onClick={() => (theme.mode = theme.mode === 'dark' ? 'light' : 'dark')}>
			Alternar tema
		</button>
	) as HTMLButtonElement;

	bindProp(theme, 'mode', mode => {
		button.textContent = `Alternar tema (atual: ${mode})`;
	});

	return button;
}
```

Mais exemplos completos e funcionais estão em [dev/components](dev/components), incluindo `HelloComponent`, `TodoList`/`Task` e `ThemeToggle`/`ThemeLabel`.

## Rodando o projeto

Requer [Bun](https://bun.sh).

```bash
bun install

# Servidor de desenvolvimento com hot reload (dev/index.html)
bun run dev

# Build de produção (gera dev/dist/main.js)
bun run build
```

## Estrutura

```
src/
  index.ts     # jsx, watch, subscribe, bindProp, createContext, load
  jsxIE.ts     # declaração de JSX.IntrinsicElements (permite qualquer tag HTML/SVG)
dev/
  App.tsx      # composição de exemplo
  components/  # componentes de exemplo (HelloComponent, TodoList, Task, ThemeToggle, ThemeLabel)
  theme.ts     # context de exemplo
```
