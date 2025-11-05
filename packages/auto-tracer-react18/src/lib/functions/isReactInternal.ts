export function isReactInternal(name: string): boolean {
  const reactInternals = [
    "selfBaseDuration",
    "treeBaseDuration",
    "actualDuration",
    "actualStartTime",
    "flags",
    "subtreeFlags",
    "lanes",
    "childLanes",
    "mode",
    "index",
    "key",
    "ref",
    "type",
    "elementType",
    "pendingProps",
    "memoizedProps",
    "memoizedState",
    "updateQueue",
    "alternate",
    "return",
    "child",
    "sibling",
    "stateNode",
    "tag",
    "dependencies",
  ];

  return (
    reactInternals.includes(name) ||
    name.startsWith("_") ||
    name.includes("react") ||
    name.includes("React") ||
    name.includes("Fiber")
  );
}
