import { jsx } from '@/index';

export interface TaskProps {
	id: number;
	title: string;
	done: boolean;
	onToggle?: () => void;
	onRemove?: () => void;
}

export function Task({ id, title, done, onToggle, onRemove }: TaskProps) {
	return (
		<li id={id} class="task" addClass={done ? 'task-done' : null}>
			<label>
				<input type="checkbox" checked={done} onChange={onToggle} />
				<span>{title}</span>
			</label>
			<button onClick={onRemove}>Remover</button>
		</li>
	);
}
