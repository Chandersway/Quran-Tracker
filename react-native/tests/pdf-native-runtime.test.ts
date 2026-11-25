import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const javaCommand = (name: string) =>
  process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? `${name}.exe` : name)
    : name;
const { patchPdfSources } = require('../plugins/pdfRuntime/patchPdf.js') as {
  patchPdfSources: (
    version: string,
    view: string,
    manager: string,
  ) => { view: string; manager: string };
};
const sourceDirectory = new URL(
  '../node_modules/react-native-pdf/android/src/main/java/org/wonday/pdf/',
  import.meta.url,
);
const inputView = readFileSync(new URL('PdfView.java', sourceDirectory), 'utf8');
const inputManager = readFileSync(new URL('PdfManager.java', sourceDirectory), 'utf8');
const patched = patchPdfSources('7.0.5', inputView, inputManager);

function method(source: string, signature: string) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, signature);
  let cursor = source.indexOf('{', start) + 1;
  let depth = 1;
  while (depth) {
    const char = source[cursor++];
    if (char === '{') depth++;
    else if (char === '}') depth--;
  }
  return source.slice(start, cursor);
}

test('PDF adapter patch is idempotent and refuses unexpected versions, partial edits and source drift', () => {
  assert.deepEqual(patchPdfSources('7.0.5', patched.view, patched.manager), patched);
  assert.throws(
    () => patchPdfSources('7.0.6', inputView, inputManager),
    /supports react-native-pdf 7.0.5/,
  );
  assert.throws(
    () => patchPdfSources('7.0.5', inputView + '\n// unexpected local edit', inputManager),
    /Unexpected/,
  );
  assert.throws(
    () => patchPdfSources('7.0.5', inputView, inputManager + '\n// unexpected local edit'),
    /Unexpected/,
  );
});

test('actual patched Java methods keep zoom live, coalesce structural reloads and preserve reattach viewport', () => {
  const source = patched.view;
  const fields = source.slice(
    source.indexOf('    private int page'),
    source.indexOf('    public PdfView('),
  );
  const viewMethods = [
    'public void onLayerDrawn(',
    'public void setScale(',
    'public void setPage(',
    'public void setPath(',
    'public void setHorizontal(',
    'public void setSpacing(',
    'public void setFitPolicy(',
    'public void setEnablePaging(',
    'public void setMinScale(',
    'public void setMaxScale(',
    'protected void onSizeChanged(',
    'protected void onAttachedToWindow(',
    'protected void onDetachedFromWindow(',
    'public void loadComplete(',
    'private void handlePage(',
  ]
    .map((signature) => method(source, signature))
    .join('\n');
  const managerMethods = [
    'public void setPath(',
    'public void setScale(',
    'public void onAfterUpdateTransaction(',
  ]
    .map((signature) => method(patched.manager, signature))
    .join('\n');
  const drawMethod = method(source, 'public void drawPdf(');
  const drawPrelude = drawMethod.slice(drawMethod.indexOf('{') + 1, drawMethod.indexOf('showLog('));
  const directory = mkdtempSync(path.join(tmpdir(), 'quran-pdf-runtime-'));
  try {
    const java = `
import java.util.ArrayDeque;
class Canvas {}
class PointF { final float x, y; PointF(float x, float y) { this.x = x; this.y = y; } }
enum FitPolicy { WIDTH, HEIGHT, BOTH }
class SizeF { float getWidth() { return 100; } float getHeight() { return 200; } }
class Gson { String toJson(Object value) { return "[]"; } }
class Constants { static class Pinch { static float MINIMUM_ZOOM, MAXIMUM_ZOOM; } }
class WritableMap { String message; void putString(String key, String value) { message = value; } }
class Arguments { static WritableMap createMap() { return new WritableMap(); } }
class ThemedReactContext {}
class TopChangeEvent { WritableMap data; TopChangeEvent(int surface, int id, WritableMap data) { this.data = data; } }
class EventDispatcher { static float scale = -1; static int scales = 0; void dispatchEvent(TopChangeEvent event) { if(event.data.message.startsWith("scaleChanged|")) {scale = Float.parseFloat(event.data.message.split("\\\\|")[1]); scales++;} } }
class UIManagerHelper { static EventDispatcher getEventDispatcherForReactTag(ThemedReactContext c, int id) { return new EventDispatcher(); } static int getSurfaceId(Object view) { return 1; } }
class NativeViewerBase {
  float zoom = 1, offsetX = 0, offsetY = 0; boolean recycled = true, attached = true; int width = 200, height = 400, currentPage = 0, jumps = 0, renders = 0, snaps = 0;
  ArrayDeque<Runnable> queue = new ArrayDeque<>();
  Object getContext() { return new ThemedReactContext(); } int getId() { return 1; }
  float getZoom() { return zoom; } void zoomTo(float next) { if(!Float.isFinite(next)) throw new AssertionError("infinite zoom"); zoom = next; }
  // AndroidPdfViewer 4.0.1 zoomCenteredTo contract, verified against the installed AAR bytecode.
  void zoomCenteredTo(float next, PointF pivot) { float ratio = next / zoom; zoomTo(next); moveTo(offsetX * ratio + pivot.x * (1 - ratio), offsetY * ratio + pivot.y * (1 - ratio)); }
  boolean isRecycled() { return recycled; } int getPageCount() { return recycled ? 0 : 612; }
  boolean isAttachedToWindow() { return attached; } int getWidth() { return width; } int getHeight() { return height; }
  void post(Runnable task) { queue.add(task); } void loadPages() { renders++; } void invalidate() {}
  void setMinZoom(float value) {} void setMaxZoom(float value) {} void setMidZoom(float value) {}
  float pageOffset(int page) { return page * 200 * zoom; }
  float paperLeft() { return offsetX + pageOffset(currentPage); }
  void jumpTo(int page) { currentPage = page; jumps++; offsetX = -pageOffset(page); }
  // Actual paging API centers a page narrower than the viewport (CENTER snap edge).
  void performPageSnap(boolean animated) { if(animated) throw new AssertionError("snap must not animate"); snaps++; offsetX = -pageOffset(currentPage) + (width - 100 * zoom) / 2; }
  protected void onSizeChanged(int w, int h, int oldw, int oldh) { width = w; height = h; }
  protected void onAttachedToWindow() { attached = true; } protected void onDetachedFromWindow() { attached = false; recycled = true; zoom = 1; offsetX = 0; offsetY = 0; }
  float getCurrentXOffset() { return offsetX; } float getCurrentYOffset() { return offsetY; }
  void moveTo(float x, float y) { if(recycled) throw new AssertionError("moveTo on recycled PDF"); offsetX = x; offsetY = y; } SizeF getPageSize(int page) { return new SizeF(); } Object getTableOfContents() { return null; }
  void runTasks() { int count = 0; while(!queue.isEmpty()) {if(count++ > 30) throw new AssertionError("reload loop"); queue.remove().run();} }
}
class PdfView extends NativeViewerBase {
  ${fields}
  int reloads = 0;
  void drawPdf() { ${drawPrelude} reloads++; recycled = false; }
  ${viewMethods}
}
class BaseManager { public void onAfterUpdateTransaction(PdfView view) {} }
class PdfManager extends BaseManager { ${managerMethods} }
class PdfRuntimeProbe {
static PdfView queuedRestore(PdfManager manager) {
  PdfView view = new PdfView(); manager.setPath(view,"restore.pdf"); view.runTasks(); view.loadComplete(612); view.runTasks();
  view.setScale(2); view.moveTo(7,8); view.onDetachedFromWindow(); view.onAttachedToWindow(); view.runTasks(); view.loadComplete(612);
  return view;
}
public static void main(String[] args) {
  PdfView view = new PdfView(); view.onLayerDrawn(new Canvas(), 100, 100, 0); view.onLayerDrawn(new Canvas(), 160, 160, 0);
  if (EventDispatcher.scale != 1f) throw new AssertionError("Layout-only resize reported zoom " + EventDispatcher.scale);
  int events = EventDispatcher.scales; view.onLayerDrawn(new Canvas(), 320, 320, 0);
  if(EventDispatcher.scales != events) throw new AssertionError("layout emitted redundant zoom");
  PdfManager manager = new PdfManager(); view.setEnablePaging(true); manager.setPath(view, "original.pdf"); manager.onAfterUpdateTransaction(view);
  if(view.queue.size() != 1) throw new AssertionError("path/transaction must coalesce");
  view.runTasks(); view.loadComplete(612);
  // AndroidPdfViewer calls the adapter load callback BEFORE jumpTo(defaultPage,false).
  view.jumpTo(2);
  if(view.paperLeft() != 0) throw new AssertionError("fixture must reproduce initial left-aligned default jump");
  view.runTasks();
  if(view.paperLeft() != 50) throw new AssertionError("initial narrow page not centered after the upstream default jump");
  if(view.reloads != 1) throw new AssertionError("initial document opened twice");
  view.moveTo(-500, -20);
  final float documentCenterX = (view.getWidth() / 2f - view.offsetX) / view.getZoom();
  final float documentCenterY = (view.getHeight() / 2f - view.offsetY) / view.getZoom();
  manager.setScale(view, 1.5f); manager.onAfterUpdateTransaction(view);
  if(view.getZoom() != 1.5f || view.renders == 0) throw new AssertionError("zoom command must render live");
  if(Math.abs((view.getWidth() / 2f - view.offsetX) / view.getZoom() - documentCenterX) > 0.001f || Math.abs((view.getHeight() / 2f - view.offsetY) / view.getZoom() - documentCenterY) > 0.001f) throw new AssertionError("zoom moved the document point under the viewport center");
  view.onLayerDrawn(new Canvas(), 240, 240, 0);
  if(EventDispatcher.scale != 1.5f) throw new AssertionError("pinch/command must report actual zoom");
  manager.setScale(view, EventDispatcher.scale); manager.onAfterUpdateTransaction(view); view.runTasks();
  if(view.reloads != 1) throw new AssertionError("zoom callback echoed into document reload");
  view.setScale(Float.POSITIVE_INFINITY); view.setScale(Float.NaN); view.setScale(0);
  if(view.getZoom() != 1.5f) throw new AssertionError("invalid command changed zoom");
  view.setPage(2); manager.onAfterUpdateTransaction(view); view.runTasks();
  if(view.currentPage != 1 || view.reloads != 1) throw new AssertionError("page navigation reloaded or reordered PDF");
  if(Math.abs(view.paperLeft() - 25) > 0.001f) throw new AssertionError("programmatic page jump not centered");
  int jumps = view.jumps; view.setPage(2); if(view.jumps != jumps) throw new AssertionError("echoed page command jumped again");
  view.setFitPolicy(2); view.setHorizontal(true); manager.onAfterUpdateTransaction(view); manager.onAfterUpdateTransaction(view);
  if(view.queue.size() != 1) throw new AssertionError("structural changes not coalesced"); view.runTasks();
  if(view.reloads != 2) throw new AssertionError("structural update did not reload");
  view.setFitPolicy(2); view.setHorizontal(true); manager.setPath(view, "original.pdf"); manager.onAfterUpdateTransaction(view); view.runTasks();
  if(view.reloads != 2) throw new AssertionError("identical configuration reloaded");
  view.width = 0; view.setSpacing(20); manager.onAfterUpdateTransaction(view); view.runTasks();
  if(view.reloads != 2) throw new AssertionError("zero-size document load");
  view.onSizeChanged(200,400,0,400); view.runTasks(); if(view.reloads != 3) throw new AssertionError("valid-size retry lost");
  view.setScale(2); view.onLayerDrawn(new Canvas(),400,400,0); view.moveTo(7,8);
  view.onDetachedFromWindow();
  if(view.getZoom() != 1 || view.offsetX != 0 || view.offsetY != 0) throw new AssertionError("fixture must reset the recycled native viewport");
  view.onAttachedToWindow(); manager.onAfterUpdateTransaction(view); view.runTasks(); view.loadComplete(612); view.runTasks();
  if(view.reloads != 4 || view.getZoom() != 2 || view.offsetX != 7 || view.offsetY != 8) throw new AssertionError("reattach viewport not preserved");
  PdfView stale = new PdfView(); stale.setEnablePaging(true); manager.setPath(stale,"one.pdf"); stale.runTasks(); stale.loadComplete(612); stale.jumpTo(2);
  manager.setPath(stale,"two.pdf"); stale.runTasks();
  if(stale.snaps != 0) throw new AssertionError("old document snap ran after source change");
  stale.loadComplete(612); stale.drawPdf(); stale.runTasks();
  if(stale.snaps != 0) throw new AssertionError("old document snap ran after a newer load");
  stale.loadComplete(612); stale.onDetachedFromWindow(); stale.runTasks();
  if(stale.snaps != 0) throw new AssertionError("posted snap ran after detach");
  PdfView detachedRestore = queuedRestore(manager);
  detachedRestore.onDetachedFromWindow(); detachedRestore.runTasks();
  PdfView replacedRestore = queuedRestore(manager);
  replacedRestore.setPath("new-source.pdf"); replacedRestore.moveTo(90,100); replacedRestore.runTasks();
  if(replacedRestore.offsetX != 90 || replacedRestore.offsetY != 100) throw new AssertionError("old restore overwrote the new source viewport");
  PdfView newerLoadRestore = queuedRestore(manager);
  newerLoadRestore.drawPdf(); newerLoadRestore.moveTo(90,100); newerLoadRestore.runTasks();
  if(newerLoadRestore.offsetX != 90 || newerLoadRestore.offsetY != 100) throw new AssertionError("old restore overwrote a newer load viewport");
} }
`;
    const file = path.join(directory, 'PdfRuntimeProbe.java');
    writeFileSync(file, java);
    const compile = spawnSync(javaCommand('javac'), [file], { encoding: 'utf8' });
    assert.ifError(compile.error);
    assert.equal(compile.status, 0, compile.stderr);
    const run = spawnSync(javaCommand('java'), ['-cp', directory, 'PdfRuntimeProbe'], {
      encoding: 'utf8',
    });
    assert.ifError(run.error);
    assert.equal(run.status, 0, run.stderr);
  } finally {
    const target = path.resolve(directory);
    assert.equal(path.dirname(target), path.resolve(tmpdir()));
    assert.ok(path.basename(target).startsWith('quran-pdf-runtime-'));
    rmSync(target, { recursive: true, force: true });
  }
});
