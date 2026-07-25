import { jsx, watch, load } from '@/index';
import { Task, TaskProps } from './Task';

interface TodoListProps {
	todo?: {
		tasks: TaskProps[];
	};
}

export function TodoList({ todo = { tasks: [] } }: TodoListProps = {}) {
	const list = <ul class="todo-list"></ul> as HTMLUListElement;
	const input = <input type="text" placeholder="Nova tarefa" onKeyDown={e => e.key === 'Enter' && addTask()} /> as HTMLInputElement;
	let nextId = todo.tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;

	const state = watch(todo, (obj, prop, value) => {
		loadTasks();
	});

	function loadTasks() {
		load(list, state.tasks, task => (
			<Task
				{...task}
				onToggle={() => toggleTask(task.id)}
				onRemove={() => removeTask(task.id)}
			/>
		));
	}

	function addTask() {
		const title = input.value.trim();

		if (!title) return;

		const newTask: TaskProps = { id: nextId++, title, done: false };

		state.tasks = [...state.tasks, newTask];
		input.value = '';
		input.focus();
	}

	function toggleTask(id: number) {
		state.tasks = state.tasks.map(task =>
			task.id === id ? { ...task, done: !task.done } : task
		);
	}

	function removeTask(id: number) {
		state.tasks = state.tasks.filter(task => task.id !== id);
	}

	loadTasks();

	return (
		<div class="todo-list-app">
			<h2>Lista de tarefas</h2>
			<div class="todo-list-form">
				{input}
				<button onClick={addTask}>Adicionar</button>
			</div>
			{list}
		</div>
	);
}
