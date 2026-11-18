package com.Ameender.qurantracker

import android.app.DownloadManager
import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.system.Os
import android.util.AtomicFile
import android.util.Xml
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import org.json.JSONArray
import org.json.JSONObject
import org.xmlpull.v1.XmlPullParser
import java.io.*
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.zip.GZIPInputStream

/** OS-owned transfers and native installation. No React runtime is needed by the receiver/job. */
object MushafBackgroundEngine {
  private const val JOB = 942604
  private const val INSTALL_JOB = 942605
  private val lock = Any()
  val executor = Executors.newSingleThreadExecutor()
  private fun catalog(context: Context) = JSONObject(context.resources.openRawResource(
    context.resources.getIdentifier("mushaf_download_catalog", "raw", context.packageName)
  ).bufferedReader().use { it.readText() })
  private fun store(context: Context) = AtomicFile(File(context.noBackupFilesDir, "mushaf-background-v1.json"))
  private fun read(context: Context): JSONObject? {
    val file = store(context)
    if (!file.baseFile.exists()) return null
    val job = JSONObject(file.openRead().bufferedReader().use { it.readText() })
    UUID.fromString(job.getString("id"))
    require(catalog(context).has(job.getString("edition"))) { "Unknown Mushaf edition" }
    return job
  }
  private fun save(context: Context, job: JSONObject) {
    val atomic = store(context)
    val stream = atomic.startWrite()
    try { stream.write(job.toString().toByteArray(Charsets.UTF_8)); atomic.finishWrite(stream) }
    catch (error: Exception) { atomic.failWrite(stream); throw error }
  }
  private fun dm(context: Context) = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
  private fun marker(context: Context, edition: String) = File(context.filesDir, "downloaded_mushafs/.ignore-$edition")
  private fun destination(context: Context, edition: String, page: Int, type: String): File {
    require(catalog(context).has(edition))
    val option = catalog(context).getJSONObject(edition)
    require(page in 1..option.getInt("pages") && type == option.getString("type"))
    val root = File(context.filesDir, "downloaded_mushafs").canonicalFile
    val file = File(root, "$edition/${if (type == "pdf") "mushaf.pdf" else "%03d.$type".format(page)}").canonicalFile
    require(file.path.startsWith(root.path + File.separator))
    return file
  }
  private fun staging(context: Context, job: JSONObject, page: Int): File {
    val root = requireNotNull(context.getExternalFilesDir("mushaf_staging")).canonicalFile
    val file = File(root, "${UUID.fromString(job.getString("id"))}/$page.download").canonicalFile
    require(file.path.startsWith(root.path + File.separator)); return file
  }
  private fun source(option: JSONObject, page: Int): Uri {
    val base = option.getString("url")
    val url = if (option.getString("type") == "pdf") base else "$base/$page.${option.getString("type")}" 
    val uri = Uri.parse(url)
    require(uri.scheme == "https" && uri.userInfo == null && uri.port == -1 && uri.query == null && uri.fragment == null)
    return uri
  }
  private fun svg(input: InputStream): Boolean {
    input.use { raw ->
      val bounded = object : FilterInputStream(raw) {
        var count = 0
        override fun read(): Int { val value = super.read(); if (value >= 0 && ++count > 16 * 1024 * 1024) throw IOException("SVG too large"); return value }
        override fun read(bytes: ByteArray, offset: Int, length: Int): Int {
          val value = super.read(bytes, offset, length); if (value > 0) count += value
          if (count > 16 * 1024 * 1024) throw IOException("SVG too large"); return value
        }
      }
      val parser = Xml.newPullParser(); parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, true)
      parser.setInput(bounded, "UTF-8")
      var root = false; var depth = 0
      while (parser.eventType != XmlPullParser.END_DOCUMENT) {
        if (parser.eventType == XmlPullParser.DOCDECL) return false
        if (parser.eventType == XmlPullParser.START_TAG) { if (!root) { if (parser.name != "svg") return false; root = true }; depth++ }
        if (parser.eventType == XmlPullParser.END_TAG) depth--
        parser.next()
      }
      return root && depth == 0
    }
  }
  private fun valid(file: File, type: String): Boolean = try {
    if (!file.isFile || file.length() <= 0 || file.length() > (if (type == "pdf") 512L else 10L) * 1024 * 1024) false
    else RandomAccessFile(file, "r").use { handle ->
      val head = ByteArray(minOf(4096L, file.length()).toInt()); handle.readFully(head)
      if (type == "svgz") {
        if (head.size > 1 && head[0] == 0x1f.toByte() && head[1] == 0x8b.toByte()) svg(GZIPInputStream(FileInputStream(file)))
        else svg(FileInputStream(file))
      } else {
        val tail = ByteArray(minOf(4096L, file.length()).toInt()); handle.seek(file.length() - tail.size); handle.readFully(tail)
        if (type == "pdf") String(head, Charsets.ISO_8859_1).startsWith("%PDF") && String(tail, Charsets.ISO_8859_1).contains("%%EOF")
        else head.size >= 8 && head.take(8).toByteArray().contentEquals(byteArrayOf(0x89.toByte(), 0x50, 0x4e, 0x47, 13, 10, 26, 10)) &&
          tail.size >= 12 && tail.takeLast(12).take(8).toByteArray().contentEquals(byteArrayOf(0, 0, 0, 0, 73, 69, 78, 68))
      }
    }
  } catch (_: Exception) { false }
  private fun schedule(context: Context) {
    val scheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
    if (scheduler.getPendingJob(JOB) == null) {
      check(scheduler.schedule(JobInfo.Builder(JOB, ComponentName(context, MushafDownloadJob::class.java))
        .setPersisted(true).setPeriodic(15 * 60 * 1000L).build()) == JobScheduler.RESULT_SUCCESS) { "Could not persist download reconciliation" }
    }
  }
  /** A receiver has a short execution budget; large validation/copy work belongs in JobService. */
  fun deferLargeInstall(context: Context): Boolean {
    val large = try {
      val job = read(context) ?: return false
      val option = catalog(context).getJSONObject(job.getString("edition"))
      option.getString("type") == "pdf" || (0 until job.getJSONArray("items").length()).any { index ->
        val item = job.getJSONArray("items").getJSONObject(index)
        item.optLong("downloadId") > 0 && staging(context, job, index + 1).length() > 1024 * 1024
      }
    } catch (_: Exception) { true }
    if (!large) return false
    val scheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
    if (scheduler.getPendingJob(INSTALL_JOB) == null) {
      scheduler.schedule(JobInfo.Builder(INSTALL_JOB, ComponentName(context, MushafDownloadJob::class.java))
        .setPersisted(true).setMinimumLatency(1).setOverrideDeadline(1000).build())
    }
    return true // The already persisted periodic job remains a fallback if scheduling is deferred.
  }
  private fun finish(context: Context, job: JSONObject, status: String, error: String? = null) {
    job.put("status", status); if (error != null) job.put("error", error)
    val items = job.getJSONArray("items")
    for (index in 0 until items.length()) { val value = items.getJSONObject(index).optLong("downloadId"); if (value > 0) dm(context).remove(value) }
    save(context, job)
    (context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler).cancel(JOB)
  }
  private fun reconcile(context: Context, job: JSONObject) {
    if (job.getString("status") !in listOf("checking", "downloading")) return
    val edition = job.getString("edition"); val option = catalog(context).getJSONObject(edition); val type = option.getString("type")
    if (marker(context, edition).exists()) { finish(context, job, "cancelled"); return }
    val items = job.getJSONArray("items")
    require(items.length() == option.getInt("pages"))
    var pending: JSONObject? = null
    for (index in 0 until items.length()) {
      if (Thread.currentThread().isInterrupted) return
      val page = index + 1; val item = items.getJSONObject(index); val target = destination(context, edition, page, type)
      if (item.optBoolean("done") && target.isFile && target.length() > 0) continue
      item.put("done", false)
      val downloadId = item.optLong("downloadId")
      if (downloadId <= 0 && valid(target, type)) { item.put("done", true); continue }
      if (downloadId > 0) {
        var found = false
        dm(context).query(DownloadManager.Query().setFilterById(downloadId))?.use { cursor ->
          if (cursor.moveToFirst()) {
            found = true
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            item.put("bytes", cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)))
            item.put("total", cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)))
            item.put("waiting", status == DownloadManager.STATUS_PENDING || status == DownloadManager.STATUS_PAUSED)
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
              val temporary = staging(context, job, page)
              try {
                check(valid(temporary, type)) { "Invalid downloaded file" }
                val expected = item.optLong("total", -1)
                check(expected <= 0 || expected == temporary.length()) { "Incomplete downloaded file" }
                target.parentFile!!.mkdirs()
                val install = File(target.parentFile, ".${job.getString("id")}.install")
                try {
                  FileInputStream(temporary).use { input -> FileOutputStream(install).use { output ->
                    val buffer = ByteArray(65536); var count: Int
                    while (input.read(buffer).also { count = it } >= 0) { if (Thread.currentThread().isInterrupted) throw InterruptedIOException(); output.write(buffer, 0, count) }
                    output.fd.sync()
                  } }
                  if (marker(context, edition).exists()) throw InterruptedIOException()
                  Os.rename(install.absolutePath, target.absolutePath)
                  item.put("done", true)
                } finally { install.delete() }
              } catch (error: Exception) {
                if (error is InterruptedIOException) return
                item.put("retries", item.optInt("retries") + 1)
              } finally { dm(context).remove(downloadId); item.put("downloadId", 0); temporary.delete() }
            } else if (status == DownloadManager.STATUS_FAILED) {
              dm(context).remove(downloadId); item.put("downloadId", 0); item.put("retries", item.optInt("retries") + 1)
            } else pending = item
          }
        }
        if (!found) item.put("downloadId", 0)
      }
      if (item.optInt("retries") >= 3) { finish(context, job, "failed", "Download failed or file validation failed"); return }
      if (!item.optBoolean("done") && pending == null) pending = item
    }
    if (items.length() == (0 until items.length()).count { items.getJSONObject(it).optBoolean("done") }) { finish(context, job, "completed"); return }
    save(context, job)
    // A complete native manifest owns the queue; one system transfer avoids 604 notifications.
    val next = pending ?: return
    if (next.optLong("downloadId") == 0L) {
      val page = (0 until items.length()).first { items.getJSONObject(it) === next } + 1
      val temp = staging(context, job, page); temp.parentFile!!.mkdirs()
      // Recover the tiny process-death gap between enqueue() and manifest persistence.
      dm(context).query(DownloadManager.Query())?.use { cursor ->
        while (cursor.moveToNext()) {
          val local = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI))
          if (local == Uri.fromFile(temp).toString()) { next.put("downloadId", cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_ID))); break }
        }
      }
      if (next.optLong("downloadId") > 0) { save(context, job); return }
      temp.delete()
      val request = DownloadManager.Request(source(option, page))
        .setDestinationInExternalFilesDir(context, "mushaf_staging", "${job.getString("id")}/$page.download")
        .setTitle("Quran Tracker · $edition").setDescription(if (type == "pdf") "PDF" else "$page / ${items.length()}")
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
        .setAllowedOverRoaming(false).addRequestHeader("User-Agent", "Mozilla/5.0 (compatible; Wirdna/1.0)")
      next.put("downloadId", dm(context).enqueue(request)); next.put("waiting", true)
    }
    job.put("status", "downloading"); save(context, job)
  }
  private fun snapshot(job: JSONObject?): WritableMap? {
    if (job == null) return null
    val items = job.getJSONArray("items"); val pdf = job.getString("edition") in listOf("hafs_madina_pdf", "hafs_indopak_15")
    val completed = (0 until items.length()).count { items.getJSONObject(it).optBoolean("done") }
    val current = (0 until items.length()).map { items.getJSONObject(it) }.firstOrNull { it.optLong("downloadId") > 0 }
    return Arguments.createMap().apply {
      putString("id", job.getString("id")); putString("edition", job.getString("edition")); putString("status", job.getString("status"))
      putString("unit", if (pdf) "bytes" else "pages")
      putDouble("completed", if (pdf) (current?.optLong("bytes") ?: job.optLong("finalBytes")).toDouble() else completed.toDouble())
      if (pdf && (current?.optLong("total", -1) ?: -1) <= 0) putNull("total") else putDouble("total", if (pdf) current!!.optLong("total").toDouble() else items.length().toDouble())
      putBoolean("waiting", current?.optBoolean("waiting") ?: false)
      if (job.has("error")) putString("error", job.getString("error"))
    }
  }
  fun inspect(context: Context): WritableMap? = synchronized(lock) {
    val job = read(context); if (job != null) { reconcile(context, job); if (job.getString("status") in listOf("checking", "downloading")) schedule(context) }; snapshot(job)
  }
  fun start(context: Context, edition: String): WritableMap? = synchronized(lock) {
    val option = catalog(context).getJSONObject(edition)
    val previous = read(context)
    if (previous != null && previous.getString("status") in listOf("checking", "downloading")) { reconcile(context, previous); return@synchronized snapshot(previous) }
    val items = JSONArray(); repeat(option.getInt("pages")) { items.put(JSONObject().put("done", false).put("downloadId", 0)) }
    val job = JSONObject().put("id", UUID.randomUUID().toString()).put("edition", edition).put("status", "checking").put("items", items)
    marker(context, edition).delete(); save(context, job); schedule(context); reconcile(context, job); snapshot(job)
  }
  fun cancel(context: Context, id: String): WritableMap? = synchronized(lock) {
    val job = read(context)
    if (job != null && job.getString("id") == id && job.getString("status") in listOf("checking", "downloading")) finish(context, job, "cancelled")
    snapshot(job)
  }
}

class BackgroundMushafDownloads(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "BackgroundMushafDownloads"
  private fun action(promise: Promise, block: () -> Any?) { MushafBackgroundEngine.executor.execute { try { promise.resolve(block()) } catch (error: Exception) { promise.reject("MUSHAF_DOWNLOAD", error) } } }
  @ReactMethod fun inspect(promise: Promise) = action(promise) { MushafBackgroundEngine.inspect(reactApplicationContext) }
  @ReactMethod fun start(edition: String, promise: Promise) = action(promise) { MushafBackgroundEngine.start(reactApplicationContext, edition) }
  @ReactMethod fun cancel(id: String, promise: Promise) = action(promise) { MushafBackgroundEngine.cancel(reactApplicationContext, id) }
}
class BackgroundMushafDownloadsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(BackgroundMushafDownloads(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
class MushafDownloadReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == DownloadManager.ACTION_NOTIFICATION_CLICKED) {
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { context.startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
      return
    }
    if (intent.action != DownloadManager.ACTION_DOWNLOAD_COMPLETE) return
    if (MushafBackgroundEngine.deferLargeInstall(context.applicationContext)) return
    val pending = goAsync()
    MushafBackgroundEngine.executor.execute { try { MushafBackgroundEngine.inspect(context.applicationContext) } catch (_: Exception) { /* Persisted job retries reconciliation. */ } finally { pending.finish() } }
  }
}
class MushafDownloadJob : JobService() {
  private var future: Future<*>? = null
  override fun onStartJob(params: JobParameters): Boolean {
    future = MushafBackgroundEngine.executor.submit { try { MushafBackgroundEngine.inspect(applicationContext) } catch (_: Exception) { /* Periodic reconciliation remains scheduled. */ } finally { if (!Thread.currentThread().isInterrupted) jobFinished(params, false) } }
    return true
  }
  override fun onStopJob(params: JobParameters): Boolean { future?.cancel(true); return true }
}
