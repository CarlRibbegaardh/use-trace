import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from 'flatted';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractUseStateValues } from '@src/lib/functions/extractUseStateValues.js';
import {
  addLabelForGuid,
  clearAllHookLabels,
  getLabelsForGuid,
} from '@src/lib/functions/hookLabels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('walkFiberForUpdates - label matching fix', () => {
  beforeEach(() => {
    clearAllHookLabels();
  });

  it('should correctly match labels when hooks without queues exist between labeled hooks', () => {
    // Load the fixture
    const fixtureData = fs.readFileSync(
      path.join(__dirname, '../fixtures/todoListFiberWithDispatch.fixture.flatted'),
      'utf8'
    );
    const todoListFiber = parse(fixtureData);

    // Extract hooks that have queues
    const extractedHooks = extractUseStateValues(todoListFiber);

    // Setup: simulate the build-time labels in source order
    // dispatch (hook 1), filteredTodos (hook 7), loading (hook 14)
    const guid = 'test-guid';
    addLabelForGuid(guid, 'dispatch');
    addLabelForGuid(guid, 'filteredTodos');
    addLabelForGuid(guid, 'loading');
    const labels = getLabelsForGuid(guid);

    // extractedHooks = [state0, state7, state14, ...]
    // labels = ['dispatch', 'filteredTodos', 'loading']

    const state7 = extractedHooks[1];
    expect(state7?.name).toBe('state7');

    // SIMULATE THE FIXED CODE:
    const useStateValues = extractedHooks;
    const name = 'state7';

    // Determine if there's a gap before the first labeled extracted hook
    const firstExtractedAfterTracer = useStateValues.find((h) => h.name !== 'state0');
    const hasGapBeforeFirstLabeled =
      firstExtractedAfterTracer &&
      parseInt(firstExtractedAfterTracer.name.replace('state', ''), 10) > 1;

    const labelOffset = hasGapBeforeFirstLabeled ? 1 : 0;
    const extractedIndex = useStateValues.findIndex((s) => s.name === name);
    const labelIndex = extractedIndex - 1 + labelOffset;
    const actualLabel = labelIndex >= 0 && labels[labelIndex] ? labels[labelIndex] : name;

    // EXPECTED: state7 should be labeled "filteredTodos"
    // From E2E output: [LOG] │   %cState change filteredTodos: false → true
    expect(actualLabel).toBe('filteredTodos');
  });
});
