export const EDITOR_INDENT = '    ';

const AUTO_PAIRS = Object.freeze({
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`'
});

const CLOSING_CHARACTERS = new Set(Object.values(AUTO_PAIRS));
const COLON_INDENT_LANGUAGES = new Set(['python', 'py', 'yaml', 'yml', 'ruby', 'rb']);

function clampSelection(content, value) {
  return Math.max(0, Math.min(content.length, Number.isFinite(value) ? value : 0));
}

function leadingIndentRemoval(line) {
  if (line.startsWith('\t')) return 1;
  return Math.min(EDITOR_INDENT.length, line.match(/^ +/)?.[0].length || 0);
}

export function getFencedCodeContext(content = '', cursor = 0) {
  const targetCursor = clampSelection(content, cursor);
  const lines = content.split('\n');
  let openFence = null;
  let offset = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.replace(/\r$/, '');
    const lineStart = offset;
    const lineEnd = lineStart + rawLine.length;
    const nextLineStart = lineEnd + (index < lines.length - 1 ? 1 : 0);
    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);

    if (!match) {
      offset = nextLineStart;
      continue;
    }

    const marker = match[1];
    const remainder = match[2].trim();
    if (!openFence) {
      openFence = {
        character: marker[0],
        length: marker.length,
        language: remainder.split(/\s+/)[0]?.toLowerCase() || '',
        contentStart: nextLineStart
      };
    } else if (marker[0] === openFence.character && marker.length >= openFence.length && !remainder) {
      if (targetCursor >= openFence.contentStart && targetCursor <= lineStart) {
        return openFence;
      }
      openFence = null;
    }

    offset = nextLineStart;
  }

  return null;
}

export function applyTabIndent(content = '', selectionStart = 0, selectionEnd = selectionStart, shouldUnindent = false) {
  const start = clampSelection(content, selectionStart);
  const end = Math.max(start, clampSelection(content, selectionEnd));

  if (start === end && !shouldUnindent) {
    return {
      content: `${content.slice(0, start)}${EDITOR_INDENT}${content.slice(end)}`,
      selectionStart: start + EDITOR_INDENT.length,
      selectionEnd: start + EDITOR_INDENT.length
    };
  }

  const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const effectiveEnd = end > start && content[end - 1] === '\n' ? end - 1 : end;
  const lineEndIndex = content.indexOf('\n', effectiveEnd);
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
  const lines = content.slice(lineStart, lineEnd).split('\n');

  if (!shouldUnindent) {
    const nextBlock = lines.map((line) => `${EDITOR_INDENT}${line}`).join('\n');
    return {
      content: `${content.slice(0, lineStart)}${nextBlock}${content.slice(lineEnd)}`,
      selectionStart: start + EDITOR_INDENT.length,
      selectionEnd: end + (EDITOR_INDENT.length * lines.length)
    };
  }

  const removals = lines.map(leadingIndentRemoval);
  const nextBlock = lines.map((line, index) => line.slice(removals[index])).join('\n');
  const removedBeforeStart = removals[0] || 0;
  const removedBeforeEnd = removals.reduce((sum, value) => sum + value, 0);
  const nextStart = Math.max(lineStart, start - removedBeforeStart);

  return {
    content: `${content.slice(0, lineStart)}${nextBlock}${content.slice(lineEnd)}`,
    selectionStart: nextStart,
    selectionEnd: Math.max(nextStart, end - removedBeforeEnd)
  };
}

export function applyCodeEditorKey(content = '', selectionStart = 0, selectionEnd = selectionStart, key = '') {
  const start = clampSelection(content, selectionStart);
  const end = Math.max(start, clampSelection(content, selectionEnd));
  const codeContext = getFencedCodeContext(content, start);

  if (!codeContext && key === '`' && start === end) {
    const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEnd = content.indexOf('\n', start);
    const beforeCursor = content.slice(lineStart, start);
    const afterCursor = content.slice(start, lineEnd === -1 ? content.length : lineEnd);
    const openingMatch = beforeCursor.match(/^(\s{0,3})``$/);

    if (openingMatch && !afterCursor.trim()) {
      const indent = openingMatch[1];
      const inserted = `\`\n${indent}\n${indent}\`\`\``;
      const cursor = start + 2 + indent.length;
      return {
        content: `${content.slice(0, start)}${inserted}${content.slice(end)}`,
        selectionStart: cursor,
        selectionEnd: cursor
      };
    }
  }

  if (!codeContext) return null;

  if (key === 'Enter') {
    const beforeSelection = content.slice(0, start);
    const afterSelection = content.slice(end);
    const lineStart = beforeSelection.lastIndexOf('\n') + 1;
    const beforeCursor = beforeSelection.slice(lineStart);
    const lineEndOffset = afterSelection.indexOf('\n');
    const afterCursor = lineEndOffset === -1 ? afterSelection : afterSelection.slice(0, lineEndOffset);
    const baseIndent = beforeCursor.match(/^[\t ]*/)?.[0] || '';
    const trimmedBefore = beforeCursor.trimEnd();
    const trimmedAfter = afterCursor.trimStart();
    const opener = trimmedBefore.slice(-1);
    const closer = AUTO_PAIRS[opener];
    const shouldIndentAfterColon = COLON_INDENT_LANGUAGES.has(codeContext.language) && trimmedBefore.endsWith(':');
    const shouldIndent = Boolean(closer) || shouldIndentAfterColon;

    if (closer && trimmedAfter.startsWith(closer)) {
      const inserted = `\n${baseIndent}${EDITOR_INDENT}\n${baseIndent}`;
      const cursor = start + 1 + baseIndent.length + EDITOR_INDENT.length;
      return {
        content: `${content.slice(0, start)}${inserted}${content.slice(end)}`,
        selectionStart: cursor,
        selectionEnd: cursor
      };
    }

    const inserted = `\n${baseIndent}${shouldIndent ? EDITOR_INDENT : ''}`;
    const cursor = start + inserted.length;
    return {
      content: `${content.slice(0, start)}${inserted}${content.slice(end)}`,
      selectionStart: cursor,
      selectionEnd: cursor
    };
  }

  if (key === 'Backspace' && start === end && start > 0) {
    const previousCharacter = content[start - 1];
    const nextCharacter = content[start];
    if (AUTO_PAIRS[previousCharacter] === nextCharacter) {
      return {
        content: `${content.slice(0, start - 1)}${content.slice(start + 1)}`,
        selectionStart: start - 1,
        selectionEnd: start - 1
      };
    }
    return null;
  }

  if (start === end && CLOSING_CHARACTERS.has(key) && content[start] === key) {
    return {
      content,
      selectionStart: start + 1,
      selectionEnd: start + 1
    };
  }

  if (start === end && [')', ']', '}'].includes(key)) {
    const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const beforeCursor = content.slice(lineStart, start);
    const removal = beforeCursor.trim() ? 0 : leadingIndentRemoval(beforeCursor);
    if (removal > 0) {
      const cursor = start - removal + 1;
      return {
        content: `${content.slice(0, start - removal)}${key}${content.slice(end)}`,
        selectionStart: cursor,
        selectionEnd: cursor
      };
    }
  }

  const closingCharacter = AUTO_PAIRS[key];
  if (!closingCharacter) return null;

  const selectedText = content.slice(start, end);
  if (key === "'" && !selectedText && /[\w$]/.test(content[start - 1] || '') && /[\w$]/.test(content[start] || '')) {
    return null;
  }

  const inserted = `${key}${selectedText}${closingCharacter}`;
  return {
    content: `${content.slice(0, start)}${inserted}${content.slice(end)}`,
    selectionStart: start + 1,
    selectionEnd: selectedText ? end + 1 : start + 1
  };
}
