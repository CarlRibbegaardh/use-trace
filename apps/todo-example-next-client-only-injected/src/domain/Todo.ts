/**
 * Todo entity - represents a todo item in our domain
 */
export interface Todo {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Value object for TodoId
 */
export class TodoId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TodoId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: TodoId): boolean {
    return this.value === other.value;
  }
}

/**
 * Value object for Todo title
 */
export class TodoTitle {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Todo title cannot be empty');
    }
    if (value.length > 200) {
      throw new Error('Todo title cannot exceed 200 characters');
    }
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Value object for Todo description
 */
export class TodoDescription {
  constructor(private readonly value?: string) {
    if (value && value.length > 1000) {
      throw new Error('Todo description cannot exceed 1000 characters');
    }
  }

  toString(): string | undefined {
    return this.value;
  }
}
