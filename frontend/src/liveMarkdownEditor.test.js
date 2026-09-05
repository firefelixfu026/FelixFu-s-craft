import assert from 'node:assert/strict';
import test from 'node:test';

import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { GFM } from '@lezer/markdown';

import { findMathTokens } from './liveMarkdownUtils.js';

function createMarkdownState(doc) {
  return EditorState.create({ doc, extensions: [markdown({ extensions: GFM })] });
}

test('findMathTokens distinguishes block and inline formulas', () => {
  const state = createMarkdownState([
    '$$\\frac{a}{b}$$',
    'text $x + 1$ tail',
    '$$',
    '\\sum_{i=1}^n i',
    '$$'
  ].join('\n'));

  assert.deepEqual(
    findMathTokens(state).map(({ expression, displayMode, block }) => ({ expression, displayMode, block })),
    [
      { expression: '\\frac{a}{b}', displayMode: true, block: true },
      { expression: 'x + 1', displayMode: false, block: false },
      { expression: '\\sum_{i=1}^n i', displayMode: true, block: true }
    ]
  );
});

test('findMathTokens ignores dollar delimiters inside code', () => {
  const state = createMarkdownState([
    '`$inlineCode$`',
    '```js',
    'const value = "$notMath$";',
    '```',
    '$actualMath$'
  ].join('\n'));

  assert.deepEqual(findMathTokens(state).map(({ expression }) => expression), ['actualMath']);
});
