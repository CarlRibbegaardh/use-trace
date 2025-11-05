export interface ComponentInfo {
  name: string;
  isAnonymous: boolean;
  node: any; // Babel AST node
  start?: number;
  end?: number;
}
