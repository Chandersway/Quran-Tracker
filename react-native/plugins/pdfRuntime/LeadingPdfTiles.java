package com.github.barteksc.pdfviewer;

import android.graphics.RectF;
import android.util.SizeF;
import com.github.barteksc.pdfviewer.util.Constants;
import com.github.barteksc.pdfviewer.util.Util;

/** Completes the leading strip that AndroidPdfViewer 4.0.1 skips on centered pages. */
public final class LeadingPdfTiles {
    private LeadingPdfTiles() {}

    public static void load(PDFView view) {
        if (view.isSwipeVertical() || view.isRecycled() || view.pdfFile == null
                || view.renderingHandler == null || view.getPageCount() <= 0) return;
        final int page = view.getCurrentPage();
        final float zoom = view.getZoom();
        final SizeF size = view.pdfFile.getScaledPageSize(page, zoom);
        final float left = view.getCurrentXOffset() + view.pdfFile.getPageOffset(page, zoom);
        final float top = view.getCurrentYOffset() + view.pdfFile.getSecondaryPageOffset(page, zoom);
        if (left <= 0 || left >= view.getWidth() || size.getWidth() <= 0 || size.getHeight() <= 0
                || top >= view.getHeight() || top + size.getHeight() <= 0) return;

        // Match the viewer's tile grid exactly so its cache can reuse these parts.
        final SizeF unscaled = view.pdfFile.getPageSize(page);
        final int cols = (int) Math.ceil(1f / (Constants.PART_SIZE * (1f / unscaled.getWidth()) / zoom));
        final int rows = (int) Math.ceil(1f / (Constants.PART_SIZE * (1f / unscaled.getHeight()) / zoom));
        if (cols <= 0 || rows <= 0) return;
        final float tileWidth = size.getWidth() / cols;
        final float tileHeight = size.getHeight() / rows;
        final int preload = Util.getDP(view.getContext(), Constants.PRELOAD_OFFSET);
        // Upstream takes abs before dividing here: a blank leading margin becomes
        // a positive column index. Only supplement that skipped strip, not all tiles.
        final int skippedCols = Math.min(cols, (int) Math.floor((left + preload) / tileWidth));
        final int firstRow = Math.max(0, (int) Math.floor(-top / tileHeight));
        final int lastRow = Math.min(rows - 1, (int) Math.floor((view.getHeight() - top) / tileHeight));
        final float relativeWidth = 1f / cols;
        final float relativeHeight = 1f / rows;
        int order = Constants.Cache.CACHE_SIZE;
        int requested = 0;
        for (int row = firstRow; row <= lastRow; row++) {
            for (int col = 0; col < skippedCols; col++) {
                if (++requested > Constants.Cache.CACHE_SIZE) return;
                final float x = relativeWidth * col;
                final float y = relativeHeight * row;
                final float width = Math.min(relativeWidth, 1 - x);
                final float height = Math.min(relativeHeight, 1 - y);
                final RectF bounds = new RectF(x, y, x + width, y + height);
                if (!view.cacheManager.upPartIfContained(page, bounds, ++order)) {
                    view.renderingHandler.addRenderingTask(page,
                            Constants.PART_SIZE / relativeWidth * width,
                            Constants.PART_SIZE / relativeHeight * height,
                            bounds, false, order, view.isBestQuality(), view.isAnnotationRendering());
                }
            }
        }
    }
}
