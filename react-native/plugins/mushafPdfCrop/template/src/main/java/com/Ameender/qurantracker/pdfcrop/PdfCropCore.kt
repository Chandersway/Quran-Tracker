package com.Ameender.qurantracker.pdfcrop

import java.io.File
import java.net.URI

internal data class PdfBounds(val left: Float, val bottom: Float, val right: Float, val top: Float) {
  fun valid() = left.isFinite() && bottom.isFinite() && right.isFinite() && top.isFinite() && right > left && top > bottom
}

internal object PdfCropCore {
  // Same physical margins as STANDARD_PDF_CROP; PDFium returns quarter-turn rotation.
  fun crop(box: PdfBounds, rotation: Int): PdfBounds {
    require(box.valid()) { "PDF page has invalid bounds" }
    require(rotation in 0..3) { "PDF page has invalid rotation" }
    val margins = when (rotation) {
      1 -> floatArrayOf(.045f, .055f, .055f, .055f)
      2 -> floatArrayOf(.055f, .055f, .045f, .055f)
      3 -> floatArrayOf(.055f, .045f, .055f, .055f)
      else -> floatArrayOf(.055f, .055f, .055f, .045f)
    }
    val width = box.right - box.left
    val height = box.top - box.bottom
    return PdfBounds(box.left + width * margins[0], box.bottom + height * margins[2],
      box.right - width * margins[1], box.top - height * margins[3])
  }

  fun scopedFile(raw: String, roots: List<File>): File {
    val uri = URI(raw)
    require(uri.scheme == "file" && uri.rawAuthority.isNullOrEmpty() && uri.query == null && uri.fragment == null) {
      "PDF preparation requires a local app file URI"
    }
    val file = File(uri).canonicalFile
    require(roots.any { file.path.startsWith(it.canonicalPath + File.separator) }) {
      "PDF preparation path is outside app storage"
    }
    return file
  }

  fun destination(raw: String, cache: File): File = scopedFile(raw, listOf(cache)).also {
    require(it.name.endsWith(".partial")) { "PDF preparation destination must be a temporary file" }
  }
}
