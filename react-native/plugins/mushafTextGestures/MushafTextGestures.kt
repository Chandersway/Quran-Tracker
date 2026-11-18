package com.Ameender.qurantracker

import android.annotation.SuppressLint
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.widget.ScrollView
import android.widget.TextView
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManager
import java.lang.ref.WeakReference
import java.util.WeakHashMap
import kotlin.math.abs
import kotlin.math.hypot

/** Observe the existing text/scroll views; never consume native selection or scrolling events. */
class MushafTextGestures(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val bindings = mutableMapOf<String, Binding>()
  private val scrolls = WeakHashMap<ScrollView, ScrollObserver>()
  private val pendingMounts = mutableMapOf<String, Runnable>()
  override fun getName() = "MushafTextGestures"
  override fun getConstants(): Map<String, Any> = mapOf("protocolVersion" to 3)

  private fun emit(binding: String, kind: String, active: Boolean = false, motion: WritableMap? = null, atTop: Boolean = false, atBottom: Boolean = false) {
    if (!context.hasActiveReactInstance()) return
    val data = Arguments.createMap().apply {
      putString("bindingId", binding)
      putString("kind", kind)
      putBoolean("active", active)
      if (motion != null) {
        putMap("motion", motion)
        putMap("edges", Arguments.createMap().apply {
          putBoolean("top", atTop)
          putBoolean("bottom", atBottom)
        })
      }
    }
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("MushafTextGesture", data)
  }

  private inner class Binding(val id: String, text: TextView, page: View, scroll: ScrollView?, private val intentDistance: Float, private val maxMovementDelay: Long) {
    val view = WeakReference(text)
    private val pageView = WeakReference(page)
    val scroller = WeakReference(scroll)
    private val density = text.resources.displayMetrics.density
    private var startX = 0f
    private var startY = 0f
    private var startTime = 0L
    private var blocked = true
    private var maximumX = 0f
    private var maximumY = 0f
    private var maximumDistance = 0f
    private var horizontalTravel = 0f
    private var verticalTravel = 0f
    private var movementDelay: Long? = null
    private var pendingHoldCancelled = false
    private var previousX = 0f
    private var previousY = 0f
    private var previousTime = 0L
    private var pageLeft = 0
    private var pageWidth = 0
    private val pageLocation = IntArray(2)
    private var atTop = false
    private var atBottom = false

    private fun hasSelection(): Boolean {
      // A detached page must never complete an in-flight gesture.
      val text = view.get() ?: return true
      if (!text.isAttachedToWindow) return true
      return text.selectionStart >= 0 && text.selectionEnd >= 0 && text.selectionStart != text.selectionEnd
    }

    private fun recordSample(x: Float, y: Float, time: Long) {
      // Child CANCEL and ScrollView MOVE can contain the same batched samples.
      // Count them once so a scroll takeover cannot fabricate a reversal.
      if (time <= previousTime) return
      val dx = x - startX
      val dy = y - startY
      maximumX = maxOf(maximumX, abs(dx))
      maximumY = maxOf(maximumY, abs(dy))
      maximumDistance = maxOf(maximumDistance, hypot(dx, dy))
      if (movementDelay == null && maximumDistance > intentDistance) movementDelay = time - startTime
      horizontalTravel += abs(x - previousX)
      verticalTravel += abs(y - previousY)
      previousX = x
      previousY = y
      previousTime = time
    }

    private fun recordMotion(event: MotionEvent) {
      // Use screen coordinates for displacement: local TextView coordinates
      // move when its parent scrolls. Convert every measurement to dp once.
      val offsetX = event.rawX - event.x
      val offsetY = event.rawY - event.y
      for (index in 0 until event.historySize) {
        recordSample(
          (event.getHistoricalX(index) + offsetX) / density,
          (event.getHistoricalY(index) + offsetY) / density,
          event.getHistoricalEventTime(index),
        )
      }
      recordSample(event.rawX / density, event.rawY / density, event.eventTime)
      if (event.pointerCount > 1) blocked = true
      if (hasSelection()) blocked = true
      // TextView can keep its selection long-press scheduled while the finger
      // moves inside its bounds. Cancel only that pending hold after prompt
      // movement, before TextView handles this MOVE. Do not clear a selection,
      // consume the event, or interfere with a hold followed by a handle drag.
      val delay = movementDelay
      if (!blocked && !pendingHoldCancelled && event.actionMasked == MotionEvent.ACTION_MOVE &&
          delay != null && delay <= maxMovementDelay) {
        view.get()?.cancelLongPress()
        pendingHoldCancelled = true
      }
    }

    private fun pageUnchanged(): Boolean {
      val page = pageView.get() ?: return false
      if (!page.isAttachedToWindow) return false
      page.getLocationOnScreen(pageLocation)
      // Width/position changes during a gesture (rotation, zoom, pane changes)
      // invalidate its DOWN bounds. Vertical scrolling remains independent.
      return page.width == pageWidth && pageLocation[0] == pageLeft
    }

    fun begin(event: MotionEvent) {
      blocked = true
      val page = pageView.get() ?: return
      if (view.get() == null || !page.isAttachedToWindow) return
      // The listener runs BEFORE TextView.onTouchEvent can collapse/move selection.
      val selected = hasSelection()
      startX = event.rawX / density
      startY = event.rawY / density
      startTime = event.eventTime
      previousX = startX
      previousY = startY
      previousTime = startTime
      page.getLocationOnScreen(pageLocation)
      pageLeft = pageLocation[0]
      pageWidth = page.width
      blocked = selected || event.pointerCount != 1 || pageWidth <= 0
      maximumX = 0f
      maximumY = 0f
      maximumDistance = 0f
      horizontalTravel = 0f
      verticalTravel = 0f
      movementDelay = null
      pendingHoldCancelled = false
      // Reaching an edge during this gesture is a scroll, not a page turn.
      atTop = scroller.get()?.canScrollVertically(-1) == false
      atBottom = scroller.get()?.canScrollVertically(1) == false
      emit(id, "selection", active = selected)
    }

    fun continueTouch(event: MotionEvent, fromScroll: Boolean) {
      when (event.actionMasked) {
        MotionEvent.ACTION_POINTER_DOWN -> blocked = true
        MotionEvent.ACTION_CANCEL -> {
          // A vertical ScrollView sends CANCEL to its child when it starts scrolling.
          // Its own passive listener observes the subsequent MOVE/UP. A real parent
          // cancellation has no UP and therefore can never turn a page.
          // The intercepted MOVE may reach the child only as CANCEL. Keep its
          // extrema so a diagonal or overshoot cannot disappear at takeover.
          recordMotion(event)
          if (fromScroll) blocked = true
        }
        MotionEvent.ACTION_MOVE, MotionEvent.ACTION_UP -> {
          val dx = event.rawX / density - startX
          val dy = event.rawY / density - startY
          recordMotion(event)
          if (event.actionMasked == MotionEvent.ACTION_UP) {
            val elapsed = event.eventTime - startTime
            val selected = hasSelection()
            // Android's selection timeout can be shorter than JS Pressability's.
            // Publish the real UP selection before a pending span press can open meanings.
            emit(id, "selection", active = selected)
            // Selection may have appeared after DOWN (for example with a
            // shorter system long-press timeout). Read it again before turning.
            if (!blocked && !selected && pageUnchanged()) {
              // The bridge feeds this snapshot to the same pure classifier as
              // printed pages. No velocity/edge/intent thresholds live in Kotlin.
              val motion = Arguments.createMap().apply {
                putDouble("startX", (startX - pageLeft / density).toDouble())
                putDouble("pageWidth", (pageWidth / density).toDouble())
                putDouble("dx", dx.toDouble())
                putDouble("dy", dy.toDouble())
                putDouble("elapsed", elapsed.toDouble())
                putDouble("movementDelay", (movementDelay ?: elapsed).toDouble())
                putDouble("maximumX", maximumX.toDouble())
                putDouble("maximumY", maximumY.toDouble())
                putDouble("maximumDistance", maximumDistance.toDouble())
                putDouble("horizontalTravel", horizontalTravel.toDouble())
                putDouble("verticalTravel", verticalTravel.toDouble())
              }
              emit(id, "motion", motion = motion, atTop = atTop, atBottom = atBottom)
            }
            blocked = true
          }
        }
      }
    }
  }

  private inner class ScrollObserver {
    val owners = mutableSetOf<String>()
    var active: String? = null
    fun observe(event: MotionEvent) {
      // A DOWN delivered to the scroll view itself began outside the text.
      if (event.actionMasked == MotionEvent.ACTION_DOWN) { active = null; return }
      active?.let { bindings[it]?.continueTouch(event, true) }
      if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL)
        active = null
    }
  }

  private fun verticalScroll(text: TextView): ScrollView? {
    var parent = text.parent
    while (parent is View) {
      if (parent is ScrollView) return parent
      parent = parent.parent
    }
    return null
  }

  @ReactMethod
  fun attach(tag: Int, id: String, pageTag: Int, intentDistance: Double, maxMovementDelay: Double) {
    UiThreadUtil.runOnUiThread {
      pendingMounts.remove(id)?.let { UiThreadUtil.removeOnUiThread(it) }
      val request = object : Runnable {
        private var attempt = 0
        override fun run() {
          if (pendingMounts[id] !== this) return
          val text = runCatching { UIManagerHelper.getUIManagerForReactTag(context, tag)?.resolveView(tag) }.getOrNull() as? TextView
          val page = runCatching { UIManagerHelper.getUIManagerForReactTag(context, pageTag)?.resolveView(pageTag) }.getOrNull()
          if (text == null || page == null) {
            attempt++
            if (attempt < 32) UiThreadUtil.runOnUiThread(this, 16)
            else {
              pendingMounts.remove(id)
              Log.w("MushafTextGestures", "Native text did not mount before gesture observer timeout")
            }
            return
          }
          pendingMounts.remove(id)
          attachMounted(text, page, id, intentDistance.toFloat(), maxMovementDelay.toLong())
        }
      }
      pendingMounts[id] = request
      request.run()
    }
  }

  @SuppressLint("ClickableViewAccessibility")
  private fun attachMounted(text: TextView, page: View, id: String, intentDistance: Float, maxMovementDelay: Long) {
      bindings.values.filter { it.view.get() == null || it.view.get() === text }.map { it.id }.forEach { detachNow(it) }
      val scroll = verticalScroll(text)
      val binding = Binding(id, text, page, scroll, intentDistance, maxMovementDelay)
      bindings[id] = binding
      if (scroll != null) {
        val observer = scrolls.getOrPut(scroll) {
          ScrollObserver().also { observer ->
            scroll.setOnTouchListener { _, event -> observer.observe(event); false }
          }
        }
        observer.owners.add(id)
      }
      text.setOnTouchListener { _, event ->
        if (event.actionMasked == MotionEvent.ACTION_DOWN) {
          binding.begin(event)
          scroll?.let { scrolls[it]?.active = id }
        } else binding.continueTouch(event, false)
        false // TextView keeps native copy/letter selection, long press and accessibility.
      }
  }

  private fun detachNow(id: String) {
    pendingMounts.remove(id)?.let { UiThreadUtil.removeOnUiThread(it) }
    val binding = bindings.remove(id) ?: return
    binding.view.get()?.setOnTouchListener(null)
    binding.scroller.get()?.let { scroll ->
      val observer = scrolls[scroll] ?: return@let
      observer.owners.remove(id)
      if (observer.active == id) observer.active = null
      if (observer.owners.isEmpty()) { scroll.setOnTouchListener(null); scrolls.remove(scroll) }
    }
  }

  @ReactMethod
  fun detach(id: String) { UiThreadUtil.runOnUiThread { detachNow(id) } }

  override fun invalidate() {
    UiThreadUtil.runOnUiThread { (bindings.keys + pendingMounts.keys).toSet().forEach { detachNow(it) } }
    super.invalidate()
  }
}

class MushafTextGesturesPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(MushafTextGestures(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
