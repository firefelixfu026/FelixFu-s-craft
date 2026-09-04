import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EDITOR_INDENT,
  applyCodeEditorKey,
  applyTabIndent,
  getFencedCodeContext
} from './editorUtils.js';

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

test('fenced code context detects open and closed Markdown fences', () => {
  const open = '正文\n```js\nconst value = 1;';
  assert.equal(getFencedCodeContext(open, open.length)?.language, 'js');

  const closed = `${open}\n\`\`\``;
  assert.equal(getFencedCodeContext(closed, closed.length), null);
});

test('auto-pairs symbols only inside fenced code blocks', () => {
  const code = '```js\nconst value = ';
  const paired = applyCodeEditorKey(code, code.length, code.length, '(');
  assert.equal(paired.content, `${code}()`);
  assert.equal(paired.selectionStart, code.length + 1);

  assert.equal(applyCodeEditorKey('普通正文', 4, 4, '('), null);
});

test('typing an existing closing character moves over it', () => {
  const code = '```js\ncall()';
  const cursor = code.length - 1;
  const result = applyCodeEditorKey(code, cursor, cursor, ')');
  assert.equal(result.content, code);
  assert.equal(result.selectionStart, cursor + 1);
});

test('Backspace removes an empty auto-pair', () => {
  const code = '```js\nconst value = {}';
  const cursor = code.length - 1;
  const result = applyCodeEditorKey(code, cursor, cursor, 'Backspace');
  assert.equal(result.content, '```js\nconst value = ');
});

test('Enter keeps indentation and expands paired braces', () => {
  const code = '```js\nfunction run() {}';
  const cursor = code.length - 1;
  const result = applyCodeEditorKey(code, cursor, cursor, 'Enter');
  assert.equal(result.content, '```js\nfunction run() {\n    \n}');
  assert.equal(result.selectionStart, '```js\nfunction run() {\n    '.length);
});

test('Enter indents Python blocks after a colon', () => {
  const code = '```python\nif ready:';
  const result = applyCodeEditorKey(code, code.length, code.length, 'Enter');
  assert.equal(result.content, '```python\nif ready:\n    ');
});
