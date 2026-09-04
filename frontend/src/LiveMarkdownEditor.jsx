import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { Compartment, EditorSelection, EditorState, Transaction } from '@codemirror/state';
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

class MathPreviewWidget extends WidgetType {
  constructor(expression, displayMode) {
    super();
    this.expression = expression;
    this.displayMode = displayMode;
  }

  eq(other) {
    return other.expression === this.expression && other.displayMode === this.displayMode;
  }

  toDOM() {
    const element = document.createElement(this.displayMode ? 'div' : 'span');
    element.className = this.displayMode ? 'cm-live-math cm-live-math-block' : 'cm-live-math cm-live-math-inline';
    katex.render(this.expression, element, {
      displayMode: this.displayMode,
      throwOnError: false,
      strict: false
    });
    return element;
  }

  ignoreEvent() {
    return false;
  }
}

function rangeContainsSelection(state, from, to) {
  return state.selection.ranges.some((range) => (
    range.empty
      ? range.head >= from && range.head < to
      : range.from < to && range.to > from
  ));
}

function collectFencedRanges(content) {
  const ranges = [];
  const lines = content.split('\n');
  let offset = 0;
  let opening = null;

  lines.forEach((rawLine, index) => {
    const line = rawLine.replace(/\r$/, '');
    const from = offset;
    const to = from + rawLine.length;
    const next = to + (index < lines.length - 1 ? 1 : 0);
    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);

    if (match) {
      const marker = match[1];
      const remainder = match[2].trim();
      if (!opening) {
        opening = { from, character: marker[0], length: marker.length };
      } else if (marker[0] === opening.character && marker.length >= opening.length && !remainder) {
        ranges.push({ from: opening.from, to });
        opening = null;
      }
    }
    offset = next;
  });

  if (opening) ranges.push({ from: opening.from, to: content.length });
  return ranges;
}

function isInsideRange(ranges, from, to) {
  return ranges.some((range) => from >= range.from && to <= range.to);
}

function addMarkupDecorations(decorations, state, content, fencedRanges, pattern, className, prefixLength, suffixLength) {
  for (const match of content.matchAll(pattern)) {
    const from = match.index;
    const to = from + match[0].length;
    if (isInsideRange(fencedRanges, from, to) || rangeContainsSelection(state, from, to)) continue;

    const contentFrom = from + prefixLength;
    const contentTo = to - suffixLength;
    if (contentFrom >= contentTo) continue;
    decorations.push(Decoration.replace({ inclusive: false }).range(from, contentFrom));
    decorations.push(Decoration.mark({ class: className }).range(contentFrom, contentTo));
    decorations.push(Decoration.replace({ inclusive: false }).range(contentTo, to));
  }
}

function buildLivePreviewDecorations(view) {
  const state = view.state;
  const content = state.doc.toString();
  const fencedRanges = collectFencedRanges(content);
  const decorations = [];
  const occupied = [];

  const addMath = (pattern, displayMode) => {
    for (const match of content.matchAll(pattern)) {
      const from = match.index;
      const to = from + match[0].length;
      if (
        isInsideRange(fencedRanges, from, to)
        || rangeContainsSelection(state, from, to)
        || occupied.some((range) => from < range.to && to > range.from)
      ) continue;

      const expression = match[1].trim();
      if (!expression) continue;
      occupied.push({ from, to });
      decorations.push(
        Decoration.replace({
          widget: new MathPreviewWidget(expression, displayMode),
          inclusive: false
        }).range(from, to)
      );
    }
  };

  addMath(/\$\$([^$\n]+?)\$\$/g, true);
  addMath(/(?<!\\)(?<!\$)\$([^$\n]+?)\$(?!\$)/g, false);

  for (const match of content.matchAll(/^(#{1,6})\s+(.+)$/gm)) {
    const from = match.index;
    const to = from + match[0].length;
    if (isInsideRange(fencedRanges, from, to) || rangeContainsSelection(state, from, to)) continue;
    const contentFrom = from + match[1].length + 1;
    decorations.push(Decoration.replace({ inclusive: false }).range(from, contentFrom));
    decorations.push(Decoration.mark({ class: `cm-live-heading cm-live-heading-${match[1].length}` }).range(contentFrom, to));
  }

  addMarkupDecorations(decorations, state, content, fencedRanges, /\*\*([^*\n]+)\*\*/g, 'cm-live-strong', 2, 2);
  addMarkupDecorations(decorations, state, content, fencedRanges, /~~([^~\n]+)~~/g, 'cm-live-strike', 2, 2);
  addMarkupDecorations(decorations, state, content, fencedRanges, /==([^=\n]+)==/g, 'cm-live-highlight', 2, 2);
  addMarkupDecorations(decorations, state, content, fencedRanges, /`([^`\n]+)`/g, 'cm-live-inline-code', 1, 1);

  for (const match of content.matchAll(/\[([^\]\n]+)\]\(([^)\n]+)\)/g)) {
    const from = match.index;
    const to = from + match[0].length;
    if (isInsideRange(fencedRanges, from, to) || rangeContainsSelection(state, from, to)) continue;
    const labelFrom = from + 1;
    const labelTo = labelFrom + match[1].length;
    decorations.push(Decoration.replace({ inclusive: false }).range(from, labelFrom));
    decorations.push(Decoration.mark({ class: 'cm-live-link' }).range(labelFrom, labelTo));
    decorations.push(Decoration.replace({ inclusive: false }).range(labelTo, to));
  }

  return Decoration.set(decorations, true);
}

const livePreviewPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = buildLivePreviewDecorations(view);
  }

  update(update) {
    if (update.docChanged || update.selectionSet || update.viewportChanged) {
      this.decorations = buildLivePreviewDecorations(update.view);
    }
  }
}, {
  decorations: (value) => value.decorations
});

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
        markdown(),
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
        livePreviewCompartmentRef.current.of(autoRender ? livePreviewPlugin : []),
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
      effects: livePreviewCompartmentRef.current.reconfigure(autoRender ? livePreviewPlugin : [])
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
