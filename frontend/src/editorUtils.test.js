import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EDITOR_INDENT,
  applyCodeEditorKey,
  applyTabIndent,
  getFencedCodeContext,
  getMarkdownListShortcut
} from './editorUtils.js';

test('Ctrl/Command Shift 7 and 8 use physical number-row keys', () => {
  assert.equal(getMarkdownListShortcut({ ctrlKey: true, shiftKey: true, code: 'Digit7', key: '&' }), 'list');
  assert.equal(getMarkdownListShortcut({ metaKey: true, shiftKey: true, code: 'Digit8', key: '*' }), 'todo');
  assert.equal(getMarkdownListShortcut({ ctrlKey: true, shiftKey: false, code: 'Digit7', key: '7' }), null);
});

test('Tab inserts four spaces at the cursor', () => {
  const result = applyTabIndent('const value = 1;', 6, 6);
  assert.equal(result.content, `const ${EDITOR_INDENT}value = 1;`);
  assert.equal(result.selectionStart, 10);
  assert.equal(result.selectionEnd, 10);
});

test('Tab and Shift+Tab indent or unindent every selected line', () => {
  const indented = applyTabIndent('one\ntwo', 0, 7);
  assert.equal(indented.content, '    one\n    two');

  const unindented = applyTabIndent('   one\n    two', 0, 14, true);
  assert.equal(unindented.content, 'one\ntwo');
});

test('fenced code context only activates between paired Markdown fences', () => {
  const paired = '正文\n```js\nconst value = 1;\n```\n结尾';
  const insideCursor = paired.indexOf('const value') + 5;
  assert.equal(getFencedCodeContext(paired, insideCursor)?.language, 'js');
  assert.equal(getFencedCodeContext(paired, paired.indexOf('```js') + 3), null);
  assert.equal(getFencedCodeContext(paired, paired.length), null);

  const unclosed = '正文\n```js\nconst value = 1;';
  assert.equal(getFencedCodeContext(unclosed, unclosed.length), null);
});

test('typing the third backtick inserts a complete fenced block', () => {
  const content = '正文\n``';
  const result = applyCodeEditorKey(content, content.length, content.length, '`');
  assert.equal(result.content, '正文\n```\n\n```');
  assert.equal(result.selectionStart, '正文\n```\n'.length);
  assert.equal(result.selectionEnd, '正文\n```\n'.length);
});

test('auto-pairs symbols only inside fenced code blocks', () => {
  const code = '```js\nconst value = \n```';
  const cursor = code.indexOf('\n```');
  const paired = applyCodeEditorKey(code, cursor, cursor, '(');
  assert.equal(paired.content, '```js\nconst value = ()\n```');
  assert.equal(paired.selectionStart, cursor + 1);

  assert.equal(applyCodeEditorKey('普通正文', 4, 4, '('), null);
});

test('typing an existing closing character moves over it', () => {
  const code = '```js\ncall()\n```';
  const cursor = code.indexOf(')');
  const result = applyCodeEditorKey(code, cursor, cursor, ')');
  assert.equal(result.content, code);
  assert.equal(result.selectionStart, cursor + 1);
});

test('Backspace removes an empty auto-pair', () => {
  const code = '```js\nconst value = {}\n```';
  const cursor = code.indexOf('}');
  const result = applyCodeEditorKey(code, cursor, cursor, 'Backspace');
  assert.equal(result.content, '```js\nconst value = \n```');
});

test('Enter keeps indentation and expands paired braces', () => {
  const code = '```js\nfunction run() {}\n```';
  const cursor = code.indexOf('}');
  const result = applyCodeEditorKey(code, cursor, cursor, 'Enter');
  assert.equal(result.content, '```js\nfunction run() {\n    \n}\n```');
  assert.equal(result.selectionStart, '```js\nfunction run() {\n    '.length);
});

test('Enter indents Python blocks after a colon', () => {
  const code = '```python\nif ready:\n```';
  const cursor = code.indexOf('\n```');
  const result = applyCodeEditorKey(code, cursor, cursor, 'Enter');
  assert.equal(result.content, '```python\nif ready:\n    \n```');
});
