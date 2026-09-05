import assert from 'node:assert/strict';
import test from 'node:test';

import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { GFM } from '@lezer/markdown';

import { findMathTokens, findTableTokens, splitMarkdownTableRow } from './liveMarkdownUtils.js';

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

test('findTableTokens parses rows, escaped pipes, and alignment', () => {
  const state = createMarkdownState([
    '| 项目 | 说明 | 数量 |',
    '| :--- | :---: | ---: |',
    '| A | 含有\\|竖线 | 2 |'
  ].join('\n'));
  const [table] = findTableTokens(state);

  assert.deepEqual(table.header, ['项目', '说明', '数量']);
  assert.deepEqual(table.alignments, ['left', 'center', 'right']);
  assert.deepEqual(table.rows, [['A', '含有|竖线', '2']]);
});

test('math inside a rendered table is not decorated twice', () => {
  const state = createMarkdownState([
    '| 公式 |',
    '| --- |',
    '| $x$ |',
    '',
    '$outside$'
  ].join('\n'));

  assert.deepEqual(findMathTokens(state).map(({ expression }) => expression), ['outside']);
});

test('splitMarkdownTableRow supports rows without outer pipes', () => {
  assert.deepEqual(splitMarkdownTableRow('A | B | C'), ['A', 'B', 'C']);
});
