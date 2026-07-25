import { jsx, bindProp } from '@/index';
import { theme } from '../theme';

// Componente sem nenhuma relação de parentesco com ThemeToggle — só importa o mesmo
// Context. Prova que a mudança de tema chega aqui sem prop drilling.
export function ThemeLabel() {
	const span = <span>Tema atual: {theme.mode}</span>;

	bindProp(theme, 'mode', mode => {
		span.textContent = `Tema atual: ${mode}`;
	});

	return span;
}
