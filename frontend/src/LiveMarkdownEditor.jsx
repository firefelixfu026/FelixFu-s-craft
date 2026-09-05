import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, indentUnit, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { GFM } from '@lezer/markdown';
import { Compartment, EditorSelection, EditorState, StateField, Transaction } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
  placeholder
} from '@codemirror/view';
import katex from 'katex';

import { applyCodeEditorKey, applyTabIndent } from './editorUtils.js';
import { collectCodeRanges, findMathTokens, isInsideRange } from './liveMarkdownUtils.js';

class MathPreviewWidget extends WidgetType {
  constructor(expression, displayMode, sourcePosition) {
    super();
    this.expression = expression;
    this.displayMode = displayMode;
    this.sourcePosition = sourcePosition;
  }

  eq(other) {
    return other.expression === this.expression
      && other.displayMode === this.displayMode
      && other.sourcePosition === this.sourcePosition;
  }

  toDOM(view) {
    const element = document.createElement(this.displayMode ? 'div' : 'span');
    element.className = this.displayMode ? 'cm-live-math cm-live-math-block' : 'cm-live-math cm-live-math-inline';
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', '编辑公式源码');
    element.title = '点击编辑公式源码';
    katex.render(this.expression, element, {
      displayMode: this.displayMode,
      throwOnError: false,
      strict: false
    });
    element.addEventListener('mousedown', (event) => {
      event.preventDefault();
      view.dispatch({
        selection: EditorSelection.cursor(this.sourcePosition),
        scrollIntoView: true
      });
      view.focus();
    });
    return element;
  }

  ignoreEvent(event) {
    return event.type === 'mousedown';
  }
}

class BulletWidget extends WidgetType {
  toDOM() {
    const element = document.createElement('span');
    element.className = 'cm-live-list-bullet';
    element.textContent = '•';
    return element;
  }
}

class TaskWidget extends WidgetType {
  constructor(checked) {
    super();
    this.checked = checked;
  }

  eq(other) {
    return other.checked === this.checked;
  }

  toDOM() {
    const element = document.createElement('span');
    element.className = `cm-live-task${this.checked ? ' is-checked' : ''}`;
    element.setAttribute('aria-hidden', 'true');
    element.textContent = this.checked ? '✓' : '';
    return element;
  }
}

function rangeContainsSelection(state, from, to) {
  return state.selection.ranges.some((range) => (
    range.empty
      ? range.head >= from && range.head < to
      : range.from < to && range.to > from
  ));
}

function sharesActiveLine(state, from, to) {
  const firstLine = state.doc.lineAt(from).number;
  const lastLine = state.doc.lineAt(Math.max(from, to - 1)).number;
  return state.selection.ranges.some((range) => {
    const headLine = state.doc.lineAt(range.head).number;
    return headLine >= firstLine && headLine <= lastLine;
  });
}

function hideRange(decorations, from, to) {
  if (from < to) decorations.push(Decoration.replace({ inclusive: false }).range(from, to));
}

function decorateDelimitedNode(decorations, state, node, className, markerLength) {
  const contentFrom = node.from + markerLength;
  const contentTo = node.to - markerLength;
  if (contentFrom >= contentTo) return;
  decorations.push(Decoration.mark({ class: className }).range(contentFrom, contentTo));
  if (!sharesActiveLine(state, node.from, node.to)) {
    hideRange(decorations, node.from, contentFrom);
    hideRange(decorations, contentTo, node.to);
  }
}

function buildSyntaxDecorations(view) {
  const { state } = view;
  const decorations = [];
  const visited = new Set();
  const decoratedCodeLines = new Set();

  for (const visibleRange of view.visibleRanges) {
    syntaxTree(state).iterate({
      from: visibleRange.from,
      to: visibleRange.to,
      enter(node) {
        const key = node.name === 'FencedCode'
          ? `${node.name}:${node.from}:${node.to}:${visibleRange.from}:${visibleRange.to}`
          : `${node.name}:${node.from}:${node.to}`;
        if (visited.has(key)) return undefined;
        visited.add(key);

        if (/^ATXHeading[1-6]$/.test(node.name)) {
          const level = Number(node.name.slice(-1));
          const source = state.doc.sliceString(node.from, node.to);
          const marker = source.match(/^#{1,6}\s+/)?.[0] || '';
          const contentFrom = node.from + marker.length;
          if (contentFrom < node.to) {
            decorations.push(Decoration.mark({ class: `cm-live-heading cm-live-heading-${level}` }).range(contentFrom, node.to));
            if (!sharesActiveLine(state, node.from, node.to)) hideRange(decorations, node.from, contentFrom);
          }
          return undefined;
        }

        if (node.name === 'StrongEmphasis') {
          decorateDelimitedNode(decorations, state, node, 'cm-live-strong', 2);
        } else if (node.name === 'Emphasis') {
          decorateDelimitedNode(decorations, state, node, 'cm-live-emphasis', 1);
        } else if (node.name === 'Strikethrough') {
          decorateDelimitedNode(decorations, state, node, 'cm-live-strike', 2);
        } else if (node.name === 'InlineCode') {
          decorateDelimitedNode(decorations, state, node, 'cm-live-inline-code', 1);
          return false;
        } else if (node.name === 'Link') {
          const source = state.doc.sliceString(node.from, node.to);
          const match = source.match(/^\[([^\]\n]+)\]\(([^)\n]+)\)$/);
          if (match) {
            const labelFrom = node.from + 1;
            const labelTo = labelFrom + match[1].length;
            decorations.push(Decoration.mark({ class: 'cm-live-link' }).range(labelFrom, labelTo));
            if (!sharesActiveLine(state, node.from, node.to)) {
              hideRange(decorations, node.from, labelFrom);
              hideRange(decorations, labelTo, node.to);
            }
          }
          return false;
        } else if (node.name === 'ListMark' && !sharesActiveLine(state, node.from, node.to)) {
          if (node.node.parent?.getChild('Task')) hideRange(decorations, node.from, Math.min(node.to + 1, state.doc.length));
          else decorations.push(Decoration.replace({ widget: new BulletWidget(), inclusive: false }).range(node.from, node.to));
        } else if (node.name === 'TaskMarker' && !sharesActiveLine(state, node.from, node.to)) {
          const checked = /x/i.test(state.doc.sliceString(node.from, node.to));
          decorations.push(Decoration.replace({ widget: new TaskWidget(checked), inclusive: false }).range(node.from, node.to));
        } else if (node.name === 'FencedCode') {
          let line = state.doc.lineAt(Math.max(node.from, visibleRange.from));
          const finalLine = state.doc.lineAt(Math.max(
            node.from,
            Math.min(node.to - 1, visibleRange.to)
          )).number;
          while (line.number <= finalLine) {
            if (!decoratedCodeLines.has(line.from)) {
              decoratedCodeLines.add(line.from);
              decorations.push(Decoration.line({ class: 'cm-live-code-line' }).range(line.from));
            }
            if (line.number === finalLine) break;
            line = state.doc.line(line.number + 1);
          }
          return false;
        }
        return undefined;
      }
    });
  }

  const codeRanges = collectCodeRanges(state);
  for (const visibleRange of view.visibleRanges) {
    const visibleText = state.doc.sliceString(visibleRange.from, visibleRange.to);
    for (const match of visibleText.matchAll(/==([^=\n]+)==/g)) {
      const from = visibleRange.from + match.index;
      const to = from + match[0].length;
      if (isInsideRange(codeRanges, from, to)) continue;
      const contentFrom = from + 2;
      const contentTo = to - 2;
      decorations.push(Decoration.mark({ class: 'cm-live-highlight' }).range(contentFrom, contentTo));
      if (!sharesActiveLine(state, from, to)) {
        hideRange(decorations, from, contentFrom);
        hideRange(decorations, contentTo, to);
      }
    }
  }

  return Decoration.set(decorations, true);
}

const syntaxPreviewPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = buildSyntaxDecorations(view);
  }

  update(update) {
    if (update.docChanged || update.selectionSet || update.viewportChanged) {
      this.decorations = buildSyntaxDecorations(update.view);
    }
  }
}, {
  decorations: (value) => value.decorations
});

function buildMathDecorations(state) {
  const decorations = [];
  for (const token of findMathTokens(state)) {
    if (rangeContainsSelection(state, token.from, token.to)) continue;
    decorations.push(
      Decoration.replace({
        widget: new MathPreviewWidget(token.expression, token.displayMode, Math.min(token.from + 2, token.to)),
        inclusive: false,
        block: token.block
      }).range(token.from, token.to)
    );
  }
  return Decoration.set(decorations, true);
}

const mathPreviewField = StateField.define({
  create: buildMathDecorations,
  update(decorations, transaction) {
    if (transaction.docChanged || transaction.selection) return buildMathDecorations(transaction.state);
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field)
});

const livePreviewExtensions = [syntaxPreviewPlugin, mathPreviewField];

function dispatchWholeDocumentChange(view, change) {
  const current = view.state.doc.toString();
  if (current === change.content) {
    view.dispatch({
      selection: EditorSelection.single(change.selectionStart, change.selectionEnd),
      scrollIntoView: true
    });
    return;
  }

  let prefix = 0;
  const prefixLimit = Math.min(current.length, change.content.length);
  while (prefix < prefixLimit && current[prefix] === change.content[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < current.length - prefix
    && suffix < change.content.length - prefix
    && current[current.length - 1 - suffix] === change.content[change.content.length - 1 - suffix]
  ) suffix += 1;

  view.dispatch({
    changes: {
      from: prefix,
      to: current.length - suffix,
      insert: change.content.slice(prefix, change.content.length - suffix)
    },
    selection: EditorSelection.single(change.selectionStart, change.selectionEnd),
    scrollIntoView: true,
    userEvent: 'input'
  });
}

const editorTheme = EditorView.theme({
  '&': {
    height: 'min(68vh, 760px)',
    minHeight: '560px',
    fontSize: '14px'
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: '"Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    lineHeight: '1.7'
  },
  '.cm-content': {
    minHeight: '560px',
    padding: '18px 20px'
  },
  '.cm-focused': {
    outline: 'none'
  },
  '.cm-line': {
    padding: '0'
  },
  '.cm-cursor': {
    borderLeftWidth: '2px'
  }
});

const LiveMarkdownEditor = forwardRef(function LiveMarkdownEditor({
  value,
  onChange,
  onKeyDown,
  onSave,
  onDropImage,
  onScroll,
  autoRender,
  editorPlaceholder = '在这里写 Markdown'
}, ref) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onKeyDownRef = useRef(onKeyDown);
  const onSaveRef = useRef(onSave);
  const onDropImageRef = useRef(onDropImage);
  const onScrollRef = useRef(onScroll);
  const livePreviewCompartmentRef = useRef(new Compartment());

  onChangeRef.current = onChange;
  onKeyDownRef.current = onKeyDown;
  onSaveRef.current = onSave;
  onDropImageRef.current = onDropImage;
  onScrollRef.current = onScroll;

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return undefined;

    const eventHandlers = EditorView.domEventHandlers({
      keydown(event, view) {
        const selection = view.state.selection.main;
        const content = view.state.doc.toString();

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          onSaveRef.current?.();
          return true;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          dispatchWholeDocumentChange(view, applyTabIndent(content, selection.from, selection.to, event.shiftKey));
          return true;
        }

        if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
          const codeChange = applyCodeEditorKey(content, selection.from, selection.to, event.key);
          if (codeChange) {
            event.preventDefault();
            dispatchWholeDocumentChange(view, codeChange);
            return true;
          }
        }

        onKeyDownRef.current?.(event);
        return event.defaultPrevented;
      },
      dragover(event) {
        if ([...event.dataTransfer.items].some((item) => item.type.startsWith('image/'))) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          return true;
        }
        return false;
      },
      drop(event) {
        const imageFile = [...event.dataTransfer.files].find((file) => file.type.startsWith('image/'));
        if (!imageFile) return false;
        event.preventDefault();
        onDropImageRef.current?.(imageFile);
        return true;
      }
    });

    const state = EditorState.create({
      doc: value || '',
      extensions: [
        history(),
        highlightSpecialChars(),
        drawSelection(),
        dropCursor(),
        highlightActiveLine(),
        markdown({ extensions: GFM }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorState.tabSize.of(4),
        indentUnit.of('    '),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': '文章 Markdown 编辑器',
          'aria-required': 'true',
          spellcheck: 'true'
        }),
        placeholder(editorPlaceholder),
        editorTheme,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        livePreviewCompartmentRef.current.of(autoRender ? livePreviewExtensions : []),
        eventHandlers,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current?.(update.state.doc.toString());
        })
      ]
    });

    viewRef.current = new EditorView({ state, parent: hostRef.current });
    const view = viewRef.current;
    const handleScroll = () => onScrollRef.current?.(view.scrollDOM);
    view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      view.scrollDOM.removeEventListener('scroll', handleScroll);
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === (value || '')) return;
    const cursor = Math.min(view.state.selection.main.head, (value || '').length);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value || '' },
      selection: EditorSelection.cursor(cursor),
      annotations: Transaction.addToHistory.of(false)
    });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: livePreviewCompartmentRef.current.reconfigure(autoRender ? livePreviewExtensions : [])
    });
  }, [autoRender]);

  useImperativeHandle(ref, () => ({
    get value() {
      return viewRef.current?.state.doc.toString() || '';
    },
    get selectionStart() {
      return viewRef.current?.state.selection.main.from || 0;
    },
    get selectionEnd() {
      return viewRef.current?.state.selection.main.to || 0;
    },
    focus() {
      viewRef.current?.focus();
    },
    setSelectionRange(from, to = from) {
      const view = viewRef.current;
      if (!view) return;
      const max = view.state.doc.length;
      view.dispatch({
        selection: EditorSelection.single(Math.min(from, max), Math.min(to, max)),
        scrollIntoView: true
      });
    },
    applyChange(change) {
      if (viewRef.current) dispatchWholeDocumentChange(viewRef.current, change);
    }
  }), []);

  return <div className={`live-markdown-editor${autoRender ? ' is-live-preview' : ''}`} ref={hostRef} />;
});

export default LiveMarkdownEditor;
