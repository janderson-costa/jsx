
/**
 * JSX factory (pragma): transforma `<tag {...props}>{children}</tag>` num elemento DOM real,
 * sem Virtual DOM. `tag` pode ser uma string (tag HTML/SVG, via `document.createElement`),
 * uma função-componente (chamada como `tag(props)`) ou uma classe-componente (instanciada
 * com `new tag(props)` — detectada por `isClass`).
 *
 * Em `props`: chaves `on*` com valor função viram `addEventListener`; `checked`, `disabled`,
 * `selected`, `readonly`, `hidden` e `addClass` têm tratamento especial; o resto vira
 * `setAttribute`. Chaves `on*` com valor **não-função** são ignoradas de propósito — nunca
 * caem em `setAttribute`, que criaria um atributo de evento inline executável a partir de
 * props não confiáveis (vetor de XSS).
 */
export function jsx(tag: string | Function, props: any, ...children: any[]): HTMLElement {
	const element = typeof tag === 'function'
		? isClass(tag)
			? new (tag as new (props: any) => HTMLElement)(props) // Instancia se for uma classe
			: tag(props) // Chama a função se for um componente
		: document.createElement(tag); // Cria um elemento para o DOM

	for (const [attr, value] of Object.entries(props || {})) {
		if (attr.startsWith('on')) {
			if (typeof value === 'function') {
				element.addEventListener(attr.slice(2).toLowerCase(), value); // Adiciona evento
			}
		} else {
			if (attr == 'checked') {
				element.checked = value == true;
			} else if (
				attr == 'disabled' ||
				attr == 'selected' ||
				attr == 'readonly'
			) {
				if (value == true)
					element.setAttribute(attr, '');
			} else if (attr == 'hidden') {
				element.classList[value == true ? 'add' : 'remove']('hidden');
			} else if (attr == 'addClass') {
				(value instanceof Array ? value : [value]).forEach(className => {
					if (className)
						element.classList.add(className);
				});
			} else if (
				typeof value == 'string' ||
				typeof value == 'number' ||
				typeof value == 'boolean'
			) {
				element.setAttribute(attr, value); // Define atributos
			}
		}
	}

	children.forEach(child => {
		if (Array.isArray(child)) {
			// Adiciona filhos aninhados (ignora null/undefined/boolean, como no React,
			// para permitir os idiomas `condição && <X/>` e `condição ? <X/> : null`)
			child.forEach(nestedChild => {
				if (isNullish(nestedChild)) return;

				element.append(nestedChild);
			});
		} else if (isNullish(child)) {
			// Ignora — mesmo motivo acima
		} else {
			if (child instanceof Node) {
				element.append(child);
			} else {
				// Adiciona textos mantendo quebras de linha
				const lines = typeof child == 'string' ? child.split(/\n/) : [child];

				lines.forEach((line: string, index: number) => {
					element.append(document.createTextNode(line));

					if (index < lines.length - 1) {
						element.append(document.createElement('br')); // <br/>
					}
				});
			}
		}
	});

	return element;

	function isClass(fn: Function): boolean {
		// Classes têm a propriedade 'prototype' não gravável; funções normais, sim
		return Object.getOwnPropertyDescriptor(fn, 'prototype')?.writable === false;
	}

	function isNullish(value: unknown): boolean {
		return value === null || value === undefined || typeof value === 'boolean';
	}
}

// Guarda, por Proxy retornado por watch(), o conjunto de listeners inscritos nele
const listenersByProxy = new WeakMap<object, Set<(obj: any, key: any, value: any) => void>>();

/**
 * Envolve `data` num Proxy que notifica seus listeners sempre que uma propriedade de
 * **nível superior** é reatribuída (mutações aninhadas, como `push` num array
 * interno, não disparam notificação).
 *
 * Por isso, para reagir a mudanças em coleções, reatribua a propriedade inteira
 * com uma cópia (`state.tasks = [...state.tasks, novoItem]`) em vez de mutar o
 * valor atual in-place.
 *
 * As notificações são **assíncronas**: várias atribuições feitas no mesmo trecho
 * síncrono são agrupadas num único microtask (uma chamada por chave alterada, com
 * o valor final), em vez de uma chamada imediata por `set`. A mutação em si
 * (`obj[key]`) continua síncrona — só a notificação é adiada.
 *
 * `onChange` é opcional — é só açúcar para já inscrever um listener na criação.
 * Para inscrever mais consumidores no mesmo objeto reativo (props reativas,
 * Context), use `subscribe()`.
 */
export function watch<T extends object>(
	data: T,
	onChange?: (obj: T, key: keyof T, value: T[keyof T]) => void
): T {
	const listeners = new Set<(obj: T, key: keyof T, value: T[keyof T]) => void>();
	if (onChange) listeners.add(onChange);

	let pending: Map<keyof T, T[keyof T]> | null = null;

	const proxy = new Proxy(data, {
		set(obj, key, value) {
			const k = key as keyof T;

			if (obj[k] === value) return true; // Ignora no-op

			obj[k] = value;

			if (!pending) {
				pending = new Map();

				queueMicrotask(() => {
					const changes = pending!;

					pending = null;

					for (const [changedKey, changedValue] of changes) {
						for (const listener of listeners) listener(obj, changedKey, changedValue);
					}
				});
			}

			pending.set(k, value); // Se a mesma chave mudar de novo no mesmo tick, só o último valor conta

			return true;
		}
	});

	listenersByProxy.set(proxy, listeners);

	return proxy;
}

/**
 * Retorna `true` se `value` foi criado por `watch()` (ou `createContext()`, que usa
 * `watch()` por baixo). Útil pra um componente aceitar tanto uma prop reativa quanto
 * um objeto plano comum, e só assinar mudanças no primeiro caso.
 */
export function isReactive(value: unknown): value is object {
	return typeof value === 'object' && value !== null && listenersByProxy.has(value);
}

/**
 * Inscreve mais um listener num objeto já criado por `watch()` — é o que permite
 * múltiplos consumidores independentes reagirem ao mesmo objeto reativo (props
 * reativas de um componente, ou um valor de Context lido por vários componentes
 * não-aparentados). Retorna uma função para cancelar a inscrição.
 */
export function subscribe<T extends object>(
	reactive: T,
	listener: (obj: T, key: keyof T, value: T[keyof T]) => void
): () => void {
	const listeners = listenersByProxy.get(reactive as object);
	if (!listeners) throw new Error('subscribe() espera um objeto criado por watch()');

	listeners.add(listener as any);

	return () => listeners.delete(listener as any);
}

/**
 * Liga uma propriedade específica de um objeto reativo a um pedaço de DOM: aplica o
 * valor atual imediatamente, e de novo toda vez que (e só quando) aquela chave mudar.
 * Retorna uma função para cancelar a ligação.
 */
export function bindProp<T extends object, K extends keyof T>(
	reactive: T,
	key: K,
	apply: (value: T[K]) => void
): () => void {
	apply(reactive[key]);

	return subscribe(reactive, (_obj, changedKey, value) => {
		if (changedKey === key) apply(value as T[K]);
	});
}

/**
 * "Context": um objeto reativo pensado pra ser exportado de um módulo e importado por
 * qualquer componente que precise dele, em qualquer profundidade da árvore — sem prop
 * drilling. Não existe Provider/Consumer: o singleton de módulo do ES já cumpre esse
 * papel, e `subscribe()`/`bindProp()` já suportam múltiplos consumidores no mesmo objeto.
 */
export function createContext<T extends object>(initial: T): T {
	return watch(initial);
}

// Guarda, por container, quais itens (por chave) geraram quais nós na última renderização
const reconcileCache = new WeakMap<Element, Map<unknown, { item: unknown; node: ChildNode }>>();

/**
 * Atualiza os filhos de `container` para refletir `items`, reaproveitando o nó existente
 * de cada item cuja referência não mudou (em vez de recriar a lista inteira a cada render).
 * Isso evita custo O(n) de DOM por interação em listas grandes e preserva estado do DOM
 * (foco, cursor de input, etc.) dos itens que não mudaram.
 *
 * Depende de updates imutáveis: reatribua/copie o item que mudou (`{ ...item, x }`) e
 * mantenha a mesma referência para os itens que não mudaram (como já fazem `.map`/`.filter`).
 *
 * `getKey` é opcional e usa `item.id` por padrão; passe um extrator próprio se o item
 * não tiver esse campo.
 */
export function load<T>(
	container: Element,
	items: T[],
	render: (item: T) => Node,
	getKey: (item: T) => string | number = (item: any) => item.id
): void {
	const previous = reconcileCache.get(container) as
		| Map<string | number, { item: T; node: ChildNode }>
		| undefined;
	const next = new Map<string | number, { item: T; node: ChildNode }>();

	let cursor: ChildNode | null = container.firstChild;

	for (const item of items) {
		const key = getKey(item);
		const cached = previous?.get(key);

		let node: ChildNode;

		if (cached && cached.item === item) {
			node = cached.node;
		} else {
			if (cached) {
				// O nó antigo desta chave vai ser substituído: descarta antes de criar o novo,
				// Senão ele fica órfão no DOM (e corrompe o cursor se era ele o próximo esperado)
				if (cached.node === cursor)
					cursor = cursor.nextSibling;

				cached.node.remove();
			}

			node = render(item) as ChildNode;
		}

		if (node !== cursor) {
			container.insertBefore(node, cursor); // Também reposiciona nós reaproveitados que mudaram de lugar
		} else {
			cursor = cursor.nextSibling;
		}

		next.set(key, { item, node });
	}

	if (previous) {
		for (const [key, { node }] of previous) {
			if (!next.has(key)) node.remove(); // Item removido nesta renderização
		}
	}

	reconcileCache.set(container, next);
}
