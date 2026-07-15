import type { Attrs, NodeType } from "@tiptap/pm/model";
import { TextSelection, type Selection, type Transaction } from "@tiptap/pm/state";
import { canSplit } from "@tiptap/pm/transform";

export function areSelectionFormattingControlsDisabled(editorDisabled: boolean): boolean {
  return editorDisabled;
}

export function hasTextSelection(selection: Pick<Selection, "empty">): boolean {
  return !selection.empty;
}

export type TextSelectionSnapshot = {
  from: number;
  to: number;
  hasSelection: boolean;
};

export function getTextSelectionSnapshot(
  selection: Pick<Selection, "empty" | "from" | "to">,
): TextSelectionSnapshot {
  return {
    from: selection.from,
    to: selection.to,
    hasSelection: hasTextSelection(selection),
  };
}

export function preserveTextSelection(event: { preventDefault(): void }): void {
  event.preventDefault();
}

export function createSelectionPreservingControlHandlers(action: () => void) {
  return {
    onMouseDown: preserveTextSelection,
    onClick: action,
  };
}

export function setSelectedBlockType(
  transaction: Transaction,
  nodeType: NodeType,
  attributes?: Attrs,
): Transaction | null {
  const { selection } = transaction;
  if (!(selection instanceof TextSelection) || selection.empty) return null;

  const { from, to, $from, $to } = selection;
  if (!$from.parent.isTextblock || !$to.parent.isTextblock) return null;

  const splitEnd = $to.parentOffset > 0 && $to.parentOffset < $to.parent.content.size;
  const splitStart = $from.parentOffset > 0 && $from.parentOffset < $from.parent.content.size;

  if (
    (splitEnd && !canSplit(transaction.doc, to)) ||
    (splitStart && !canSplit(transaction.doc, from))
  ) {
    return null;
  }

  if (splitEnd) transaction.split(to);
  if (splitStart) transaction.split(from);

  const targetFrom = from + (splitStart ? 2 : 0);
  const targetTo = to + (splitStart ? 2 : 0);
  transaction.setBlockType(targetFrom, targetTo, nodeType, attributes);
  transaction.setSelection(TextSelection.create(transaction.doc, targetFrom, targetTo));
  return transaction;
}
