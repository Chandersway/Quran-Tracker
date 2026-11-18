package com.Ameender.qurantracker.pdfcrop

import android.os.ParcelFileDescriptor
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import io.legere.pdfiumandroid.PdfDocument
import io.legere.pdfiumandroid.PdfWriteCallback
import io.legere.pdfiumandroid.PdfiumCore
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

internal object PdfCropBridge {
  init { System.loadLibrary("wirdna_pdf_crop") }
  external fun setBoxes(pagePtr: Long, left: Float, bottom: Float, right: Float, top: Float)
}

private class CropCancelled : IOException("PDF preparation cancelled")

class MushafPdfCrop(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val executor = Executors.newSingleThreadExecutor { work -> Thread(work, "MushafPdfCrop") }
  private val jobs = ConcurrentHashMap<String, AtomicBoolean>()
  override fun getName() = "MushafPdfCrop"
  override fun getConstants(): Map<String, Any> = mapOf("protocolVersion" to 1)

  @ReactMethod
  fun prepare(sourceUri: String, destinationUri: String, jobId: String, promise: Promise) {
    if (!jobId.matches(Regex("[A-Za-z0-9_-]{1,96}"))) {
      promise.reject("E_PDF_CROP_INPUT", "Invalid PDF preparation job ID")
      return
    }
    val cancelled = AtomicBoolean(false)
    if (jobs.putIfAbsent(jobId, cancelled) != null) {
      promise.reject("E_PDF_CROP_INPUT", "PDF preparation job already exists")
      return
    }
    try {
      executor.execute {
        var ownedTemporary: File? = null
        var completed = false
        fun checkCancelled() { if (cancelled.get()) throw CropCancelled() }
        try {
          checkCancelled()
          val roots = listOf(context.filesDir, context.cacheDir) + context.getExternalFilesDirs(null).filterNotNull() + context.externalCacheDirs.filterNotNull()
          val source = PdfCropCore.scopedFile(sourceUri, roots)
          val destination = PdfCropCore.destination(destinationUri, context.cacheDir)
          require(source.isFile && source.length() > 0 && source != destination) { "PDF source is missing or invalid" }
          require(destination.parentFile?.isDirectory == true) { "PDF temporary directory does not exist" }
          // No existing file can be replaced or later deleted by this operation.
          require(destination.createNewFile()) { "PDF temporary destination already exists" }
          ownedTemporary = destination
          val core = PdfiumCore(context)
          val descriptor = ParcelFileDescriptor.open(source, ParcelFileDescriptor.MODE_READ_ONLY)
          val document = try { core.newDocument(descriptor) } catch (error: Throwable) { descriptor.close(); throw error }
          var originalPageCount = 0
          document.use { doc ->
            val pageCount = doc.getPageCount()
            originalPageCount = pageCount
            require(pageCount > 0) { "PDF source contains no pages" }
            for (index in 0 until pageCount) {
              checkCancelled()
              synchronized(PdfiumCore.lock) {
                doc.openPage(index).use { page ->
                  val crop = page.getPageCropBox()
                  // PdfiumAndroid stores PDF (left,bottom,right,top) in RectF fields
                  // (left,top,right,bottom); its Android names are not PDF axes.
                  val explicit = PdfBounds(crop.left, crop.top, crop.right, crop.bottom)
                  val effective = if (explicit.valid()) explicit else {
                    val media = page.getPageMediaBox()
                    PdfBounds(media.left, media.top, media.right, media.bottom)
                  }
                  val next = PdfCropCore.crop(effective, page.getPageRotation())
                  PdfCropBridge.setBoxes(page.pagePtr, next.left, next.bottom, next.right, next.top)
                }
              }
            }
            checkCancelled()
            FileOutputStream(destination, false).use { output ->
              var writeFailure: Throwable? = null
              val callback = object : PdfWriteCallback {
                override fun WriteBlock(data: ByteArray?): Int {
                  if (cancelled.get() || writeFailure != null || data == null) return 0
                  return try { output.write(data); 1 } catch (error: Throwable) { writeFailure = error; 0 }
                }
              }
              val saved = synchronized(PdfiumCore.lock) { doc.saveAsCopy(callback, PdfDocument.FPDF_NO_INCREMENTAL) }
              checkCancelled()
              writeFailure?.let { throw IOException("Could not write cropped PDF", it) }
              if (!saved) throw IOException("PDFium could not save the cropped PDF")
              output.flush()
              output.fd.sync()
            }
          }
          checkCancelled()
          require(destination.isFile && destination.length() > 0) { "Cropped PDF is empty" }
          val outputDescriptor = ParcelFileDescriptor.open(destination, ParcelFileDescriptor.MODE_READ_ONLY)
          val verified = try { core.newDocument(outputDescriptor) } catch (error: Throwable) { outputDescriptor.close(); throw error }
          verified.use { require(it.getPageCount() == originalPageCount) { "Cropped PDF page count changed" } }
          checkCancelled()
          completed = true
          promise.resolve(true)
        } catch (error: Throwable) {
          // Resolve/reject only after the stream/document close and partial cleanup.
          if (ownedTemporary != null && !completed) ownedTemporary?.delete()
          promise.reject(if (cancelled.get() || error is CropCancelled) "E_PDF_CROP_CANCELLED" else "E_PDF_CROP", error)
        } finally {
          jobs.remove(jobId, cancelled)
        }
      }
    } catch (error: Throwable) {
      jobs.remove(jobId, cancelled)
      promise.reject("E_PDF_CROP", error)
    }
  }

  @ReactMethod
  fun cancel(jobId: String) { jobs[jobId]?.set(true) }

  override fun invalidate() {
    jobs.values.forEach { it.set(true) }
    // Queued work still runs its cancellation path and settles its promise.
    executor.shutdown()
    super.invalidate()
  }
}

class MushafPdfCropPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(MushafPdfCrop(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
