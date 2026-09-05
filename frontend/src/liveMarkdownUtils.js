import { syntaxTree } from '@codemirror/language';

export function collectCodeRanges(state) {
  const ranges = [];
  syntaxTree(state).iterate({
    enter(node) {
      if (node.name === 'FencedCode' || node.name === 'InlineCode' || node.name === 'CodeBlock') {
        ranges.push({ from: node.from, to: node.to });
        return false;
      }
      return undefined;
    }
  });
  return ranges;
}

export function isInsideRange(ranges, from, to) {
  return ranges.some((range) => from >= range.from && to <= range.to);
}

export function findMathTokens(state) {
  const content = state.doc.toString();
  const codeRanges = collectCodeRanges(state);
  const tokens = [];
  const occupied = [];
  const addToken = (from, to, expression, displayMode, block = false) => {
    if (
      !expression.trim()
      || isInsideRange(codeRanges, from, to)
      || occupied.some((range) => from < range.to && to > range.from)
    ) return;
    occupied.push({ from, to });
    tokens.push({ from, to, expression: expression.trim(), displayMode, block });
  };

  const lines = [];
  for (let number = 1; number <= state.doc.lines; number += 1) lines.push(state.doc.line(number));
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const singleLine = line.text.match(/^\s*\$\$(.+?)\$\$\s*$/);
    if (singleLine) {
      addToken(line.from, line.to, singleLine[1], true, true);
      continue;
    }
    if (!/^\s*\$\$\s*$/.test(line.text)) continue;
    for (let closing = index + 1; closing < lines.length; closing += 1) {
      if (!/^\s*\$\$\s*$/.test(lines[closing].text)) continue;
      const expressionFrom = line.to + 1;
      const expressionTo = lines[closing].from - 1;
      addToken(line.from, lines[closing].to, content.slice(expressionFrom, expressionTo), true, true);
      index = closing;
      break;
    }
  }

  for (const match of content.matchAll(/\$\$([^$\n]+?)\$\$/g)) {
    addToken(match.index, match.index + match[0].length, match[1], false);
  }
  for (const match of content.matchAll(/(?<!\\)(?<!\$)\$([^$\n]+?)\$(?!\$)/g)) {
    addToken(match.index, match.index + match[0].length, match[1], false);
  }
  return tokens.sort((left, right) => left.from - right.from);
}
