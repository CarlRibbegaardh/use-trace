import { Todo, TodoId } from '../domain/Todo';
import { TodoRepository } from '../domain/TodoService';

/** In-memory implementation of TodoRepository for demonstration */
export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos: Map<string, Todo> = new Map();

  async findAll(): Promise<Todo[]> {
    return Array.from(this.todos.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: TodoId): Promise<Todo | null> {
    return this.todos.get(id.toString()) ?? null;
  }

  async save(todo: Todo): Promise<void> {
    this.todos.set(todo.id, todo);
  }

  async delete(id: TodoId): Promise<void> {
    this.todos.delete(id.toString());
  }
}
