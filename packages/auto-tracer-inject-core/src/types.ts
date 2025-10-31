export interface TransformConfig {
  mode: 'opt-in' | 'opt-out';
  include?: string[];
  exclude?: string[];
  serverComponents?: boolean;
  importSource?: string;
}

export interface ComponentInfo {
  name: string;
  isAnonymous: boolean;
  node: any; // Babel AST node
  start?: number;
  end?: number;
}

export interface TransformResult {
  code: string;
  map?: any;
  injected: boolean;
  components: ComponentInfo[];
}

export interface TransformContext {
  filename: string;
  config: TransformConfig;
}
