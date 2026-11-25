import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const javaCommand = (name: string) =>
  process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? `${name}.exe` : name)
    : name;

test('native PDF fills the missing leading column after a centered, zoomed page reattaches without moving it', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'quran-pdf-tiles-'));
  const files: Record<string, string> = {
    'android/graphics/RectF.java': `package android.graphics;
public class RectF { public float left,top,right,bottom; public RectF(float l,float t,float r,float b) {left=l;top=t;right=r;bottom=b;} }`,
    'android/util/SizeF.java': `package android.util;
public class SizeF { private float w,h; public SizeF(float w,float h) {this.w=w;this.h=h;} public float getWidth(){return w;} public float getHeight(){return h;} }`,
    'android/content/Context.java': 'package android.content; public class Context {}',
    'com/github/barteksc/pdfviewer/util/Constants.java': `package com.github.barteksc.pdfviewer.util;
public class Constants { public static float PART_SIZE=256, THUMBNAIL_RATIO=.3f; public static int PRELOAD_OFFSET=20; public static class Cache {public static int CACHE_SIZE=120;} }`,
    'com/github/barteksc/pdfviewer/util/Util.java': `package com.github.barteksc.pdfviewer.util;
public class Util { public static int getDP(android.content.Context c,int value){return Math.round(value*2.625f);} }`,
    'com/github/barteksc/pdfviewer/LeadingPdfTiles.java': readFileSync(
      new URL('../plugins/pdfRuntime/LeadingPdfTiles.java', import.meta.url),
      'utf8',
    ),
    'com/github/barteksc/pdfviewer/LeadingTilesProbe.java': `package com.github.barteksc.pdfviewer;
import android.graphics.RectF;
import android.util.SizeF;
import android.content.Context;
import java.util.ArrayList;
class Part { int page; RectF bounds; boolean thumbnail; Part(int page,RectF bounds,boolean thumbnail){this.page=page;this.bounds=bounds;this.thumbnail=thumbnail;} }
class RenderingHandler { ArrayList<Part> tasks=new ArrayList<>(); void addRenderingTask(int page,float w,float h,RectF bounds,boolean thumbnail,int order,boolean quality,boolean annotations) {if(w<=0||h<=0)throw new AssertionError("bad tile size");tasks.add(new Part(page,bounds,thumbnail));} }
class CacheManager { boolean cached=false; boolean upPartIfContained(int page,RectF bounds,int order){return cached;} boolean containsThumbnail(int page,RectF bounds){return cached;} }
class PdfFile {
  SizeF getPageSize(int page){return new SizeF(560,800);} SizeF getScaledPageSize(int page,float zoom){return new SizeF(560*zoom,800*zoom);}
  float getPageOffset(int page,float zoom){return 10000;} float getSecondaryPageOffset(int page,float zoom){return 0;}
  int getPageAtOffset(float offset,float zoom){return 72;}
}
class PDFView {
  PdfFile pdfFile=new PdfFile(); RenderingHandler renderingHandler=new RenderingHandler(); CacheManager cacheManager=new CacheManager();
  float zoom=1.25f,x=-9811,y=-200; boolean recycled=false,vertical=false; int page=72;
  boolean isSwipeVertical(){return vertical;} boolean isRecycled(){return recycled;} int getPageCount(){return 612;} int getCurrentPage(){return page;}
  float getZoom(){return zoom;} float getCurrentXOffset(){return x;} float getCurrentYOffset(){return y;} int getWidth(){return 1080;} int getHeight(){return 802;}
  Context getContext(){return new Context();} boolean isBestQuality(){return true;} boolean isAnnotationRendering(){return true;}
}
public class LeadingTilesProbe {
  static boolean firstColumn(PDFView v,int row){return v.renderingHandler.tasks.stream().anyMatch(p->!p.thumbnail&&p.page==72&&p.bounds.left==0&&Math.abs(p.bounds.top-row*.25f)<.001f);}
  public static void main(String[] args) throws Exception {
    PDFView view=new PDFView();
    // The installed viewer's PagesLoader can be supplied to replay its real bytecode too.
    if(args.length>0) {
      Class<?> loader=Class.forName("com.github.barteksc.pdfviewer.PagesLoader");
      java.lang.reflect.Constructor<?> ctor=loader.getDeclaredConstructor(PDFView.class); ctor.setAccessible(true);
      java.lang.reflect.Method load=loader.getDeclaredMethod("loadPages"); load.setAccessible(true); load.invoke(ctor.newInstance(view));
      if(firstColumn(view,0)) throw new AssertionError("upstream fixture must reproduce the missing leading tile");
      view.renderingHandler.tasks.clear();
    }
    LeadingPdfTiles.load(view);
    for(int row=0;row<4;row++) if(!firstColumn(view,row)) throw new AssertionError("missing sharp first-column tile at visible row "+row);
    if(view.renderingHandler.tasks.size()!=4) throw new AssertionError("only the skipped strip needs repair");
    if(view.x!=-9811||view.y!=-200||view.zoom!=1.25f||view.page!=72) throw new AssertionError("tile repair mutated the viewport");
    view.cacheManager.cached=true; LeadingPdfTiles.load(view);
    if(view.renderingHandler.tasks.size()!=4) throw new AssertionError("cached tiles rendered again");
    view.cacheManager.cached=false; view.renderingHandler.tasks.clear(); view.x=-10300;view.zoom=3;
    LeadingPdfTiles.load(view); if(!view.renderingHandler.tasks.isEmpty())throw new AssertionError("ordinary cropped zoom must use upstream loading");
    view.x=-9811;view.zoom=1.25f;view.y=-2000;LeadingPdfTiles.load(view);
    if(!view.renderingHandler.tasks.isEmpty())throw new AssertionError("offscreen page rendered");
    view.y=-200;view.recycled=true;LeadingPdfTiles.load(view);
    if(!view.renderingHandler.tasks.isEmpty())throw new AssertionError("recycled document rendered");
    view.recycled=false;view.vertical=true;LeadingPdfTiles.load(view);
    if(!view.renderingHandler.tasks.isEmpty())throw new AssertionError("horizontal fix changed vertical mode");
  }
}`,
  };
  try {
    for (const [relative, source] of Object.entries(files)) {
      const target = path.join(directory, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, source);
    }
    const compile = spawnSync(
      javaCommand('javac'),
      ['-d', directory, ...Object.keys(files).map((file) => path.join(directory, file))],
      { encoding: 'utf8' },
    );
    assert.ifError(compile.error);
    assert.equal(compile.status, 0, compile.stderr);
    const upstreamJar = process.env.PDF_VIEWER_PROBE_JAR;
    const run = spawnSync(
      javaCommand('java'),
      [
        '-cp',
        [directory, ...(upstreamJar ? [upstreamJar] : [])].join(path.delimiter),
        'com.github.barteksc.pdfviewer.LeadingTilesProbe',
        ...(upstreamJar ? ['upstream'] : []),
      ],
      { encoding: 'utf8' },
    );
    assert.ifError(run.error);
    assert.equal(run.status, 0, run.stderr);
  } finally {
    const target = path.resolve(directory);
    assert.equal(path.dirname(target), path.resolve(tmpdir()));
    assert.ok(path.basename(target).startsWith('quran-pdf-tiles-'));
    rmSync(target, { recursive: true, force: true });
  }
});
