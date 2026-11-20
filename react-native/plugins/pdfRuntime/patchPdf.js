/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins load as CommonJS. */
const crypto = require('crypto');

const VERSION = '7.0.5';
const hashes = {
  PdfView: {
    upstream: '800de8b269de239c74c66dcd4a6211d21d01a946b3b3ceefb41e778ec07171b7',
    patched: 'caaa7325ee5893b856f861aa2437840265c06b7339f0917e94bf1c2754c2233a',
  },
  PdfManager: {
    upstream: '793ab93ef92ba800cf9ea1bce7d5a7ce1b8ec45ee30a6429bde2c30ef6e8c7c7',
    patched: 'acfb32701b68206ee7a7ef41819af3932bcad0da07d8ec8945fc8dba533859b6',
  },
};
const normalized = (source) => source.replace(/\r\n/g, '\n');
const sha256 = (source) => crypto.createHash('sha256').update(source).digest('hex');

function replaceOnce(source, before, after) {
  if (!source.includes(before) || source.indexOf(before) !== source.lastIndexOf(before))
    throw new Error('PDF runtime patch source anchor changed: ' + before.slice(0, 70));
  return source.replace(before, after);
}

function replaceMethod(source, signature, replacement) {
  const start = source.indexOf(signature);
  if (start < 0 || start !== source.lastIndexOf(signature))
    throw new Error('PDF method changed: ' + signature);
  let end = source.indexOf('{', start) + 1;
  let depth = 1;
  while (depth && end < source.length) {
    const char = source[end++];
    if (char === '{') depth++;
    else if (char === '}') depth--;
  }
  if (depth) throw new Error('PDF method body changed: ' + signature);
  return source.slice(0, start) + replacement.trim() + source.slice(end);
}

function applyCenteredScale(view) {
  view = replaceOnce(
    view,
    'import android.graphics.Canvas;',
    'import android.graphics.Canvas;\nimport android.graphics.PointF;',
  );
  return replaceMethod(
    view,
    'public void setScale(',
    `public void setScale(float scale) {
        if (!Float.isFinite(scale) || scale <= 0) return;
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
        if (!this.isRecycled() && getPageCount() > 0 && Math.abs(getZoom() - this.scale) >= 0.0001f) {
            this.zoomCenteredTo(this.scale, new PointF(getWidth() / 2f, getHeight() / 2f));
            this.loadPages();
            this.invalidate();
        }
    }`,
  );
}

function applyStablePageSnap(view) {
  view = replaceOnce(
    view,
    '    private boolean reloadScheduled = false;',
    `    private boolean reloadScheduled = false;
    private int documentGeneration = 0;

    private void requestInitialPageSnap() {
        final int generation = this.documentGeneration;
        post(() -> {
            if (generation != this.documentGeneration || !isAttachedToWindow() || isRecycled() || getPageCount() <= 0 || !this.enablePaging || this.singlePage) return;
            this.performPageSnap(false);
        });
    }`,
  );
  view = replaceOnce(
    view,
    `                this.loadPages();
            });
        }

        WritableMap event`,
    `                this.loadPages();
            });
        } else if (this.enablePaging && !this.singlePage) {
            // The base viewer jumps to defaultPage after this callback returns.
            requestInitialPageSnap();
        }

        WritableMap event`,
  );
  view = replaceOnce(
    view,
    '    public void drawPdf() {',
    '    public void drawPdf() {\n        this.documentGeneration++;',
  );
  view = replaceOnce(
    view,
    '        this.path = path;\n        configurationDirty = true;',
    '        this.path = path;\n        this.documentGeneration++;\n        configurationDirty = true;',
  );
  view = replaceMethod(
    view,
    'private void handlePage(',
    `private void handlePage(int page) {
        this.jumpTo(page);
        if (this.enablePaging && !this.singlePage && !this.isRecycled()) this.performPageSnap(false);
    }`,
  );
  return view;
}

function applyGuardedRestore(view) {
  view = replaceOnce(
    view,
    '            this.restorePath = null;\n            this.post(() -> {',
    '            this.restorePath = null;\n            final int restoreGeneration = this.documentGeneration;\n            this.post(() -> {',
  );
  return replaceOnce(
    view,
    '            this.post(() -> {\n                this.zoomTo(zoom);',
    '            this.post(() -> {\n                if (restoreGeneration != this.documentGeneration || !isAttachedToWindow() || isRecycled() || getPageCount() <= 0) return;\n                this.zoomTo(zoom);',
  );
}

function applyLeadingTiles(view) {
  return replaceOnce(
    view,
    '    @Override\n    protected void onAttachedToWindow() {',
    `    @Override
    public void loadPages() {
        super.loadPages();
        com.github.barteksc.pdfviewer.LeadingPdfTiles.load(this);
    }

    @Override
    protected void onAttachedToWindow() {`,
  );
}

function transformPdfSources(view, manager) {
  view = normalized(view);
  manager = normalized(manager);
  view = replaceOnce(
    view,
    '    private float originalWidth = 0;\n    private float lastPageWidth = 0;\n    private float lastPageHeight = 0;',
    `    // Quran Tracker: keep live zoom separate from structural document reloads.
    private float lastReportedScale = Float.NaN;
    private boolean configurationDirty = true;
    private boolean reloadScheduled = false;

    public void requestPdfUpdate() {
        if (!configurationDirty || reloadScheduled || this.path == null) return;
        reloadScheduled = true;
        post(() -> {
            reloadScheduled = false;
            if (!configurationDirty || this.path == null || !isAttachedToWindow() || getWidth() <= 0 || getHeight() <= 0) return;
            configurationDirty = false;
            drawPdf();
        });
    }`,
  );
  view = replaceMethod(
    view,
    'public void onLayerDrawn(',
    `public void onLayerDrawn(Canvas canvas, float pageWidth, float pageHeight, int displayedPage) {
        final float zoom = getZoom();
        if (!Float.isFinite(zoom) || zoom <= 0) return;
        this.scale = zoom;
        if (Float.isFinite(lastReportedScale) && Math.abs(zoom - lastReportedScale) < 0.0001f) return;
        lastReportedScale = zoom;
        Constants.Pinch.MINIMUM_ZOOM = this.minScale;
        Constants.Pinch.MAXIMUM_ZOOM = this.maxScale;
        WritableMap event = Arguments.createMap();
        event.putString("message", "scaleChanged|" + zoom);
        ThemedReactContext context = (ThemedReactContext) getContext();
        EventDispatcher dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, getId());
        int surfaceId = UIManagerHelper.getSurfaceId(this);
        if (dispatcher != null) dispatcher.dispatchEvent(new TopChangeEvent(surfaceId, getId(), event));
    }`,
  );
  view = applyCenteredScale(view);
  view = replaceMethod(
    view,
    'public void setPage(',
    `public void setPage(int page) {
        final int next = Math.max(page, 1);
        if (next == this.page) return;
        this.page = next;
        if (this.singlePage) configurationDirty = true;
        else this.handlePage(this.page - 1);
    }`,
  );
  for (const [method, type, field] of [
    ['setPath', 'String', 'path'],
    ['setPassword', 'String', 'password'],
    ['setEnableRTL', 'boolean', 'enableRTL'],
    ['setHorizontal', 'boolean', 'horizontal'],
    ['setScrollEnabled', 'boolean', 'scrollEnabled'],
    ['setSpacing', 'int', 'spacing'],
    ['setEnableAntialiasing', 'boolean', 'enableAntialiasing'],
    ['setEnableAnnotationRendering', 'boolean', 'enableAnnotationRendering'],
    ['setEnableDoubleTapZoom', 'boolean', 'enableDoubleTapZoom'],
    ['setSinglePage', 'boolean', 'singlePage'],
  ]) {
    const equal =
      type === 'String'
        ? `java.util.Objects.equals(this.${field}, ${field})`
        : `this.${field} == ${field}`;
    view = replaceMethod(
      view,
      `public void ${method}(`,
      `public void ${method}(${type} ${field}) {
        if (${equal}) return;
        this.${field} = ${field};
        configurationDirty = true;
    }`,
    );
  }
  for (const [method, field, nativeSetter] of [
    ['setMinScale', 'minScale', 'setMinZoom'],
    ['setMaxScale', 'maxScale', 'setMaxZoom'],
  ]) {
    view = replaceMethod(
      view,
      `public void ${method}(`,
      `public void ${method}(float ${field}) {
        if (!Float.isFinite(${field}) || ${field} <= 0 || this.${field} == ${field}) return;
        this.${field} = ${field};
        this.${nativeSetter}(${field});
        this.setMidZoom((this.maxScale + this.minScale) / 2);
        this.setScale(this.scale);
    }`,
    );
  }
  view = replaceOnce(
    view,
    '        this.enablePaging = enablePaging;',
    '        if (this.enablePaging == enablePaging) return;\n        configurationDirty = true;\n        this.enablePaging = enablePaging;',
  );
  view = replaceMethod(
    view,
    'public void setFitPolicy(',
    `public void setFitPolicy(int fitPolicy) {
        final FitPolicy next = fitPolicy == 0 ? FitPolicy.WIDTH : fitPolicy == 1 ? FitPolicy.HEIGHT : FitPolicy.BOTH;
        if (this.fitPolicy == next) return;
        this.fitPolicy = next;
        configurationDirty = true;
    }`,
  );
  view = replaceOnce(
    view,
    '            this.oldH = h;\n        }',
    '            this.oldH = h;\n        }\n        if (w > 0 && h > 0) requestPdfUpdate();',
  );
  view = replaceOnce(
    view,
    '        if (this.isRecycled())\n            this.drawPdf();',
    '        if (this.isRecycled()) {\n            configurationDirty = true;\n            requestPdfUpdate();\n        }',
  );
  // A reattach can schedule a load before a later source/configuration transaction.
  // Both paths go through the same queued dirty check above.
  manager = replaceOnce(
    manager,
    `        if (path != null && !path.isEmpty()) {
            // Fabric has been observed to skip the first draw on Android new architecture.
            // Posting the render when the resolved file path arrives avoids the blank-view state.
            pdfView.post(pdfView::drawPdf);
        }`,
    '        pdfView.requestPdfUpdate();',
  );
  manager = replaceOnce(
    manager,
    '            pdfView.post(pdfView::drawPdf);',
    '            pdfView.requestPdfUpdate();',
  );
  return { view: applyLeadingTiles(applyGuardedRestore(applyStablePageSnap(view))), manager };
}

function patchPdfSources(version, view, manager) {
  if (version !== VERSION)
    throw new Error(
      `PDF runtime patch supports react-native-pdf ${VERSION}, found ${version}; review the adapter before upgrading.`,
    );
  const input = { PdfView: normalized(view), PdfManager: normalized(manager) };
  if (
    sha256(input.PdfView) === 'b6ba2ab19996bf83f5012e8f43d72eb55b2cf3308be243b16b80bd19753949e3' &&
    sha256(input.PdfManager) === hashes.PdfManager.patched
  ) {
    const completed = applyLeadingTiles(input.PdfView);
    if (sha256(completed) !== hashes.PdfView.patched)
      throw new Error('PDF leading tile patch fingerprint changed: ' + sha256(completed));
    return { view: completed, manager: input.PdfManager };
  }
  if (
    sha256(input.PdfView) === 'd24b46c61b126f3fac959559407e24f13a16f22a4c77a6a5417e04ba29afdd9d' &&
    sha256(input.PdfManager) === hashes.PdfManager.patched
  ) {
    const guarded = applyLeadingTiles(applyGuardedRestore(input.PdfView));
    if (sha256(guarded) !== hashes.PdfView.patched)
      throw new Error('PDF viewport restore guard fingerprint changed.');
    return { view: guarded, manager: input.PdfManager };
  }
  if (
    sha256(input.PdfView) === '124d69278b7fef489dd6d0a2172c384943defd749671a19b289ed0c95e57d17b' &&
    sha256(input.PdfManager) === hashes.PdfManager.patched
  ) {
    const snapped = applyLeadingTiles(applyGuardedRestore(applyStablePageSnap(input.PdfView)));
    if (sha256(snapped) !== hashes.PdfView.patched)
      throw new Error('Initial PDF page snap patch fingerprint changed.');
    return { view: snapped, manager: input.PdfManager };
  }
  // Upgrade only the exact previously shipped adapter, never arbitrary local edits.
  if (
    sha256(input.PdfView) === '0324729f4e8630e61f02bae168eebeb563da1a5be4f9da3e1e04f5a47f1241fc' &&
    sha256(input.PdfManager) === hashes.PdfManager.patched
  ) {
    const centered = applyLeadingTiles(
      applyGuardedRestore(applyStablePageSnap(applyCenteredScale(input.PdfView))),
    );
    if (sha256(centered) !== hashes.PdfView.patched)
      throw new Error('Centered PDF zoom patch fingerprint changed.');
    return { view: centered, manager: input.PdfManager };
  }
  const state = Object.entries(input).map(([name, source]) => {
    const hash = sha256(source);
    if (hash === hashes[name].upstream) return 'upstream';
    if (hash === hashes[name].patched) return 'patched';
    throw new Error(
      `Unexpected react-native-pdf ${name}.java source (${hash}); refusing to overwrite local/upstream changes.`,
    );
  });
  if (state.every((value) => value === 'patched'))
    return { view: input.PdfView, manager: input.PdfManager };
  if (!state.every((value) => value === 'upstream'))
    throw new Error(
      'PDF runtime patch is partially applied; reinstall the dependency before prebuild.',
    );
  const result = transformPdfSources(input.PdfView, input.PdfManager);
  if (
    sha256(result.view) !== hashes.PdfView.patched ||
    sha256(result.manager) !== hashes.PdfManager.patched
  )
    throw new Error(
      'PDF runtime patch output changed; review and update its expected fingerprints.',
    );
  return result;
}

module.exports = { patchPdfSources };
