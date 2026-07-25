import { jsx, bindProp } from '@/index';
import { theme } from '../theme';

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
