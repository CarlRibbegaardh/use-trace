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

  // SKIPPED: This test manually checks the OLD label storage format (labels[index]).
  // The NEW format is an array of LabelEntry objects, accessed via resolveHookLabel().
  // The actual runtime integration test is in tests/lib/functions/walkFiberForUpdates.fix.test.ts
  it.skip('should correctly match labels when hooks without queues exist between labeled hooks', () => {
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
  // NOTE: These tests use old index-based approach - needs migration to value-based matching
  const emptyArray: unknown[] = [];
  addLabelForGuid(guid, { label: 'dispatch', index: 0, value: null });
  addLabelForGuid(guid, { label: 'filteredTodos', index: 9, value: emptyArray });
  addLabelForGuid(guid, { label: 'loading', index: 18, value: false });
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
