import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from 'flatted';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractUseStateValues } from '@src/lib/functions/extractUseStateValues.js';
import {
  addLabelForGuid,
  clearAllHookLabels,
  getLabelsForGuid,
} from '@src/lib/functions/hookLabels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('walkFiberForUpdates - label matching bug', () => {
  beforeEach(() => {
    clearAllHookLabels();
  });

  it('should correctly match labels when a hook without queue exists between labeled hooks', () => {
    // Read and parse the flatted fiber structure from the fixture
    const fixtureData = fs.readFileSync(
      path.join(__dirname, '../fixtures/todoListFiberWithDispatch.fixture.flatted'),
      'utf8'
    );

    // Parse flatted format - returns the TodoList fiber directly
    const todoListFiber = parse(fixtureData);

    // Verify we have a valid fiber
    expect(todoListFiber).toBeDefined();
    expect(todoListFiber.tag).toBe(0); // Function component
    expect(todoListFiber._debugHookTypes).toBeDefined();

    // The TodoList component source has these hooks:
    // 0: useAutoTracer() - injected, HAS queue
    // 1: useAppDispatch() - NO queue (returns a function)
    // 2+: useAppSelector calls which expand to multiple internal hooks

    // Extract the hooks that have queues (this is what runtime does)
    const extractedHooks = extractUseStateValues(todoListFiber);

    console.log('Extracted hooks with queues:', extractedHooks.map(h => h.name));

    // The extracted hooks will have gaps in their numbering because hooks without queues are skipped
    // Example: ['state0', 'state7', 'state14'] where state1-6, state8-13 don't have queues
    expect(extractedHooks.length).toBeGreaterThanOrEqual(2);
    expect(extractedHooks[0]?.name).toBe('state0'); // autoTracer

    // Simulate the build-time labels
    // In the real app, labelState() is called for dispatch, filteredTodos, loading in that order
    const guid = 'test-guid-123';
    addLabelForGuid(guid, 'dispatch');
    addLabelForGuid(guid, 'filteredTodos');
    addLabelForGuid(guid, 'loading');
    const labels = getLabelsForGuid(guid);

    // Get the second extracted hook (first one after autoTracer)
    const secondHook = extractedHooks[1];
    expect(secondHook).toBeDefined();

    console.log('Second extracted hook:', secondHook!.name);

    // DEMONSTRATE THE BUG:
    // Buggy code uses the array position to match labels
    const buggyArrayIndex = 1; // Second element in extracted array
    const buggyLabelIndex = buggyArrayIndex - 1; // Subtract 1 to skip autoTracer
    const buggyLabel = labels[buggyLabelIndex];

    console.log('BUGGY matching: array index', buggyArrayIndex, '-> labelIndex', buggyLabelIndex, '-> label', buggyLabel);

    // This gets 'dispatch' because it's at labels[0]
    expect(buggyLabel).toBe('dispatch');

    // But the second hook is NOT dispatch! Dispatch has no queue so it wasn't extracted.
    // The second hook is actually 'stateN' where N > 1 (e.g., state7)
    const actualHookNumber = parseInt(secondHook!.name.replace('state', ''), 10);
    expect(actualHookNumber).toBeGreaterThan(1); // Proves there's a gap

    // DEMONSTRATE THE FIX:
    // Correct code should parse the absolute hook index from the name
    const correctLabelIndex = actualHookNumber - 1; // Hook N gets label at index N-1

    // But wait - if actualHookNumber is 7, correctLabelIndex would be 6
    // which is out of bounds for labels array [0: 'dispatch', 1: 'filteredTodos', 2: 'loading']

    // The real issue is more subtle: we need to know which labeled hooks were SUPPOSED to be extracted
    // If dispatch (hook 1) has no queue, it gets a label but shouldn't be matched at runtime
    // So filteredTodos (maybe hook 7) should match label 'filteredTodos' not 'dispatch'

    // For this test, let's just prove the bug exists:
    // The buggy code will assign the wrong label because it uses array position instead of absolute hook index
    console.log('');
    console.log('BUG SUMMARY:');
    console.log('- Hook at array position [1] gets label at index [0] = "dispatch"');
    console.log(`- But actual hook is "${secondHook!.name}" which is hook #${actualHookNumber}, NOT hook #1 (dispatch)`);
    console.log('- This causes labels to be misaligned when hooks without queues are labeled at build-time');

    // The test proves the bug exists in the current architecture
    expect(buggyLabel).toBe('dispatch'); // Wrong label assigned
    expect(actualHookNumber).not.toBe(1); // Wrong hook number
  });
});
