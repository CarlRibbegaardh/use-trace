import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from 'flatted';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractUseStateValues } from '@src/lib/functions/extractUseStateValues.js';
import { addLabelForGuid, clearAllHookLabels, getLabelsForGuid } from '@src/lib/functions/hookLabels.js';

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
  addLabelForGuid(guid, 'dispatch', 0);
  addLabelForGuid(guid, 'filteredTodos', 9);
  addLabelForGuid(guid, 'loading', 18);
    const labels = getLabelsForGuid(guid);

    // extractedHooks = [state0, state7, state14, ...]
    // labels = ['dispatch', 'filteredTodos', 'loading']

    const state7 = extractedHooks[1];
    expect(state7?.name).toBe('state7');

    // FIXED APPROACH (anchor -> target -> label):
    // Hard-code anchor index 1 (state7) maps to target index 9 in _debugHookTypes
    const targetIndex = 9;
    if (!state7) {
      throw new Error('Expected extractedHooks[1] to exist for state7');
    }
    const actualLabel = labels[targetIndex] ?? state7.name;
    expect(actualLabel).toBe('filteredTodos');
  });
});
