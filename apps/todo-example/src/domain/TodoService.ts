import { Todo, TodoId, TodoTitle, TodoDescription } from './Todo';

/**
 * Commands for todo operations
 */
export interface CreateTodoCommand {
  title: string;
  description?: string;
}

export interface UpdateTodoCommand {
  id: string;
  title?: string;
  description?: string;
}

export interface ToggleTodoCommand {
  id: string;
}

export interface DeleteTodoCommand {
  id: string;
}

/**
 * Todo repository interface - defines the contract for data access
 */
export interface TodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: TodoId): Promise<Todo | null>;
  save(todo: Todo): Promise<void>;
  delete(id: TodoId): Promise<void>;
}

/**
 * Todo service - contains business logic for todo operations
 */
export class TodoService {
  constructor(private readonly repository: TodoRepository) {}

  async getAllTodos(): Promise<Todo[]> {
    return this.repository.findAll();
  }

  async createTodo(command: CreateTodoCommand): Promise<Todo> {
    const id = new TodoId(crypto.randomUUID());
    const title = new TodoTitle(command.title);
    const description = command.description ? new TodoDescription(command.description) : undefined;

    const now = new Date();
    const todo: Todo = {
      id: id.toString(),
      title: title.toString(),
      description: description?.toString(),
      completed: false,
      createdAt: now,
      updatedAt: now
    };

    await this.repository.save(todo);
    return todo;
  }

  async updateTodo(command: UpdateTodoCommand): Promise<Todo | null> {
    const todoId = new TodoId(command.id);
    const existingTodo = await this.repository.findById(todoId);

    if (!existingTodo) {
      return null;
    }

    const title = command.title ? new TodoTitle(command.title) : undefined;
    const description = command.description !== undefined ? new TodoDescription(command.description) : undefined;

    const updatedTodo: Todo = {
      ...existingTodo,
      title: title?.toString() ?? existingTodo.title,
      description: description?.toString() ?? existingTodo.description,
      updatedAt: new Date()
    };

    await this.repository.save(updatedTodo);
    return updatedTodo;
  }

  async toggleTodo(command: ToggleTodoCommand): Promise<Todo | null> {
    const todoId = new TodoId(command.id);
    const existingTodo = await this.repository.findById(todoId);

    if (!existingTodo) {
      return null;
    }

    const updatedTodo: Todo = {
      ...existingTodo,
      completed: !existingTodo.completed,
      updatedAt: new Date()
    };

    await this.repository.save(updatedTodo);
    return updatedTodo;
  }

  async deleteTodo(command: DeleteTodoCommand): Promise<boolean> {
    const todoId = new TodoId(command.id);
    const existingTodo = await this.repository.findById(todoId);

    if (!existingTodo) {
      return false;
    }

    await this.repository.delete(todoId);
    return true;
  }

  async getCompletedTodos(): Promise<Todo[]> {
    const todos = await this.repository.findAll();
    return todos.filter(todo => todo.completed);
  }

  async getPendingTodos(): Promise<Todo[]> {
    const todos = await this.repository.findAll();
    return todos.filter(todo => !todo.completed);
  }
}
