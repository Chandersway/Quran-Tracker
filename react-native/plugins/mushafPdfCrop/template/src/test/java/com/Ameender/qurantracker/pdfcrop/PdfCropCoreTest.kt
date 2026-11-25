package com.Ameender.qurantracker.pdfcrop

import java.io.File
import java.nio.file.Files
import org.junit.Assert.*
import org.junit.Test

class PdfCropCoreTest {
  @Test fun rotatedMarginsMatchTheExistingPdfCrop() {
    val input = PdfBounds(10f, 20f, 210f, 420f)
    val expected = listOf(
      PdfBounds(21f, 42f, 199f, 402f),
      PdfBounds(19f, 42f, 199f, 398f),
      PdfBounds(21f, 38f, 199f, 398f),
      PdfBounds(21f, 42f, 201f, 398f),
    )
    expected.forEachIndexed { rotation, box ->
      val actual = PdfCropCore.crop(input, rotation)
      assertEquals(box.left, actual.left, .001f)
      assertEquals(box.bottom, actual.bottom, .001f)
      assertEquals(box.right, actual.right, .001f)
      assertEquals(box.top, actual.top, .001f)
    }
  }

  @Test fun invalidBoundsAndRotationRejectBeforeNativeCalls() {
    for (invalid in listOf(PdfBounds(0f, 0f, 0f, 1f), PdfBounds(Float.NaN, 0f, 1f, 1f))) {
      assertThrows(IllegalArgumentException::class.java) { PdfCropCore.crop(invalid, 0) }
    }
    assertThrows(IllegalArgumentException::class.java) { PdfCropCore.crop(PdfBounds(0f, 0f, 1f, 1f), 4) }
  }

  @Test fun fileScopeRejectsNetworkTraversalSiblingPrefixAndNonTemporaryOutput() {
    val base = Files.createTempDirectory("pdf-crop-policy").toFile()
    try {
      val cache = File(base, "cache").apply { mkdir() }
      val good = File(cache, "book.partial")
      assertEquals(good.canonicalFile, PdfCropCore.destination(good.toURI().toString(), cache))
      val invalid = listOf("https://example.com/book.pdf", "content://provider/book", File(base, "cache-other/book.partial").toURI().toString(), File(cache, "../outside.partial").toURI().toString())
      invalid.forEach { uri -> assertThrows(IllegalArgumentException::class.java) { PdfCropCore.destination(uri, cache) } }
      assertThrows(IllegalArgumentException::class.java) { PdfCropCore.destination(File(cache, "original.pdf").toURI().toString(), cache) }
      assertThrows(IllegalArgumentException::class.java) { PdfCropCore.scopedFile(good.toURI().toString() + "?x=y", listOf(cache)) }
      assertThrows(IllegalArgumentException::class.java) { PdfCropCore.scopedFile("file://remote${good.absolutePath.replace('\\', '/')}", listOf(cache)) }
    } finally { base.deleteRecursively() }
  }
}
