#include <jni.h>
#include <dlfcn.h>
#include <cmath>
#include <cstdint>
#include <mutex>

namespace {
// PDFium's public fpdf_transformpage.h ABI, already exported by installed 1.0.32.
// https://pdfium.googlesource.com/pdfium/+/refs/heads/main/public/fpdf_transformpage.h
using SetBox = void (*)(void*, float, float, float, float);
std::mutex symbolsMutex;
void* pdfiumHandle = nullptr;
SetBox setCrop = nullptr;
SetBox setMedia = nullptr;

void fail(JNIEnv* env, const char* message) {
  jclass type = env->FindClass("java/lang/IllegalStateException");
  if (type != nullptr) env->ThrowNew(type, message);
}
bool loadSymbols(JNIEnv* env) {
  std::lock_guard<std::mutex> lock(symbolsMutex);
  if (setCrop != nullptr && setMedia != nullptr) return true;
  // PdfiumCore has loaded the same library before a page pointer can exist.
  // Retain the handle: no pointer can outlive its code or be mixed with another engine.
  if (pdfiumHandle == nullptr) pdfiumHandle = dlopen("libpdfium.so", RTLD_NOW | RTLD_LOCAL);
  if (pdfiumHandle == nullptr) {
    fail(env, "The installed PDFium library could not be opened");
    return false;
  }
  setCrop = reinterpret_cast<SetBox>(dlsym(pdfiumHandle, "FPDFPage_SetCropBox"));
  setMedia = reinterpret_cast<SetBox>(dlsym(pdfiumHandle, "FPDFPage_SetMediaBox"));
  if (setCrop == nullptr || setMedia == nullptr) {
    fail(env, "The installed PDFium library does not expose page box editing");
    return false;
  }
  return true;
}
}  // namespace

extern "C" JNIEXPORT void JNICALL
Java_com_Ameender_qurantracker_pdfcrop_PdfCropBridge_setBoxes(
    JNIEnv* env, jobject, jlong pagePtr, jfloat left, jfloat bottom,
    jfloat right, jfloat top) {
  if (pagePtr == 0 || !std::isfinite(left) || !std::isfinite(bottom) ||
      !std::isfinite(right) || !std::isfinite(top) || right <= left || top <= bottom) {
    fail(env, "Invalid PDF crop bounds");
    return;
  }
  if (!loadSymbols(env)) return;
  // PdfPage.pagePtr is raw FPDF_PAGE. Never cast PdfDocument.mNativeDocPtr:
  // that field points to PdfiumAndroid's DocumentFile wrapper instead.
  auto* page = reinterpret_cast<void*>(static_cast<uintptr_t>(pagePtr));
  setCrop(page, left, bottom, right, top);
  setMedia(page, left, bottom, right, top);
}
