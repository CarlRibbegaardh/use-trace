export interface IObjectChangeTracker {
  compare: (scopeObject?: object) => void;
}
