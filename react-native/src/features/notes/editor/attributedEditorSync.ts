export type AttributedEditorModel = { text: string; formatSpans: string; styleKey: string };
export type AttributedEditorSync = {
  model: AttributedEditorModel;
  presentation: AttributedEditorModel;
  nativeText: string;
  pendingNativeTexts: string[];
  refreshPending: boolean;
};

export function createAttributedEditorSync(model: AttributedEditorModel): AttributedEditorSync {
  return {
    model,
    presentation: model,
    nativeText: model.text,
    pendingNativeTexts: [],
    refreshPending: false,
  };
}

export function recordNativeEditorText(sync: AttributedEditorSync, text: string): void {
  sync.nativeText = text;
  // Keep enough acknowledgements for batched or temporarily stale React renders.
  sync.pendingNativeTexts.push(text);
  if (sync.pendingNativeTexts.length > 128) sync.pendingNativeTexts.shift();
}

/**
 * Native owns typing/composition. Echoing each keystroke into attributed children
 * makes Fabric replace the Editable and its composing spans. Only an external
 * replacement, explicit formatting or blur should rebuild that presentation.
 */
export function reconcileAttributedEditor(
  sync: AttributedEditorSync,
  model: AttributedEditorModel,
  focused: boolean,
): AttributedEditorModel {
  const textChanged = model.text !== sync.model.text;
  const spansChanged = model.formatSpans !== sync.model.formatSpans;
  const styleChanged = model.styleKey !== sync.model.styleKey;
  const acknowledged = sync.pendingNativeTexts.lastIndexOf(model.text);
  const nativeEcho = acknowledged >= 0 || model.text === sync.nativeText;
  if (acknowledged >= 0) sync.pendingNativeTexts.splice(0, acknowledged + 1);

  if (textChanged && !nativeEcho) {
    // An explicit reset or opening another note is authoritative.
    sync.nativeText = model.text;
    sync.pendingNativeTexts = [];
    sync.presentation = model;
    sync.refreshPending = false;
  } else {
    const explicitSpans = spansChanged && !textChanged && acknowledged < 0;
    if (!focused || styleChanged || explicitSpans) sync.refreshPending = true;
    // A stale native acknowledgement must never overwrite a more recent edit.
    if (sync.refreshPending && model.text === sync.nativeText) {
      sync.presentation = model;
      sync.refreshPending = false;
    }
  }
  sync.model = model;
  return sync.presentation;
}
