import { jsx } from '@/index';
import { HelloComponent } from './components/HelloComponent';
import { TodoList } from './components/TodoList';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeLabel } from './components/ThemeLabel';

const todo = {
	tasks: [
		{ id: 1, title: 'Alguma tarefa', done: true },
		{ id: 2, title: 'Outra tarefa', done: false },
		{ id: 3, title: 'Mais uma tarefa', done: true },
		{ id: 4, title: 'Outra tarefa', done: false },
		{ id: 5, title: 'Outra tarefa', done: false },
		{ id: 6, title: 'Mais uma tarefa', done: false },
		{ id: 7, title: 'Outra tarefa', done: false },
		{ id: 8, title: 'Outra tarefa', done: false },
		{ id: 9, title: 'Outra tarefa', done: false },
		{ id: 10, title: 'Outra tarefa', done: false },
	]
};

// Teste para acessar o estado de todo
(window as any).tasks = () => todo.tasks;

export const app = (
	<div>
		<HelloComponent name="Mundo" />
		<div>
			<ThemeLabel />
			<ThemeToggle />
		</div>
		<TodoList todo={todo} />
	</div>
) as HTMLElement;
