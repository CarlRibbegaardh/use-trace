// Registry mapping GUID -> labels
const guidToLabelsMap = new Map<string, string[]>();

export function addLabelForGuid(guid: string, label: string) {
  if (!guidToLabelsMap.has(guid)) {
    guidToLabelsMap.set(guid, []);
  }
  guidToLabelsMap.get(guid)!.push(label);
}

export function getLabelsForGuid(guid: string): string[] {
  return guidToLabelsMap.get(guid) || [];
}

export function clearLabelsForGuid(guid: string) {
  guidToLabelsMap.delete(guid);
}

export function clearAllHookLabels(): void {
  guidToLabelsMap.clear();
}
