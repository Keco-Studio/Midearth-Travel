import assert from "node:assert/strict";
import test from "node:test";
import { getSchema } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import {
  areSelectionFormattingControlsDisabled,
  createSelectionPreservingControlHandlers,
  getTextSelectionSnapshot,
  hasTextSelection,
  preserveTextSelection,
  setSelectedBlockType,
} from "../src/lib/rich-text-selection.ts";

const schema = getSchema([StarterKit]);

function paragraph(value: string): ProseMirrorNode {
  return schema.nodes.paragraph.create(null, schema.text(value));
}

function heading(value: string, level: 2 | 3): ProseMirrorNode {
  return schema.nodes.heading.create({ level }, schema.text(value));
}

function createState(nodes: ProseMirrorNode[]): EditorState {
  return EditorState.create({
    schema,
    doc: schema.nodes.doc.create(null, nodes),
  });
}

function select(state: EditorState, from: number, to = from): EditorState {
  return state.apply(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
}

test("recognizes only non-empty text selections", () => {
  const state = createState([paragraph("abcdef")]);

  assert.equal(hasTextSelection(TextSelection.create(state.doc, 2)), false);
  assert.equal(hasTextSelection(TextSelection.create(state.doc, 2, 5)), true);
});

test("keeps selection formatting controls available in an editable editor", () => {
  assert.equal(areSelectionFormattingControlsDisabled(false), false);
  assert.equal(areSelectionFormattingControlsDisabled(true), true);
});

test("creates a stable toolbar snapshot from the current text selection", () => {
  const state = createState([paragraph("abcdef")]);

  assert.deepEqual(
    getTextSelectionSnapshot(TextSelection.create(state.doc, 2)),
    { from: 2, to: 2, hasSelection: false },
  );
  assert.deepEqual(
    getTextSelectionSnapshot(TextSelection.create(state.doc, 2, 5)),
    { from: 2, to: 5, hasSelection: true },
  );
});

test("converts only a partial paragraph selection into a heading", () => {
  const state = select(createState([paragraph("abcdef")]), 2, 5);
  const transaction = setSelectedBlockType(
    state.tr,
    state.schema.nodes.heading,
    { level: 2 },
  );

  assert.ok(transaction);
  assert.equal(
    transaction.doc.toString(),
    'doc(paragraph("a"), heading("bcd"), paragraph("ef"))',
  );
  assert.deepEqual(
    transaction.steps.map((step) => step.constructor.name),
    ["ReplaceStep", "ReplaceStep", "ReplaceAroundStep"],
  );
});

test("converts a partial heading selection into a paragraph", () => {
  const state = select(createState([heading("abcdef", 2)]), 2, 5);
  const transaction = setSelectedBlockType(state.tr, state.schema.nodes.paragraph);

  assert.ok(transaction);
  assert.equal(
    transaction.doc.toString(),
    'doc(heading("a"), paragraph("bcd"), heading("ef"))',
  );
});

test("isolates both edges of a selection spanning paragraphs", () => {
  const state = select(
    createState([paragraph("abcd"), paragraph("efgh")]),
    3,
    9,
  );
  const transaction = setSelectedBlockType(
    state.tr,
    state.schema.nodes.heading,
    { level: 3 },
  );

  assert.ok(transaction);
  assert.equal(
    transaction.doc.toString(),
    'doc(paragraph("ab"), heading("cd"), heading("ef"), paragraph("gh"))',
  );
});

test("does not create a transaction for a collapsed selection", () => {
  const state = select(createState([paragraph("abcdef")]), 3);

  assert.equal(
    setSelectedBlockType(state.tr, state.schema.nodes.heading, { level: 2 }),
    null,
  );
});

test("prevents toolbar mouse-down from moving the editor selection", () => {
  let prevented = false;

  preserveTextSelection({
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
});

test("preserves selection and runs a direct toolbar action on the first interaction", () => {
  let prevented = false;
  let actionCount = 0;
  const handlers = createSelectionPreservingControlHandlers(() => {
    actionCount += 1;
  });

  handlers.onMouseDown({
    preventDefault() {
      prevented = true;
    },
  });
  handlers.onClick();

  assert.equal(prevented, true);
  assert.equal(actionCount, 1);
});
