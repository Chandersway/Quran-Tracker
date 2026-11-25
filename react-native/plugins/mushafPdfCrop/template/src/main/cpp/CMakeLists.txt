cmake_minimum_required(VERSION 3.22.1)
project(wirdna_pdf_crop)
add_library(wirdna_pdf_crop SHARED PdfCropBridge.cpp)
target_compile_features(wirdna_pdf_crop PRIVATE cxx_std_17)
target_compile_options(wirdna_pdf_crop PRIVATE -Wall -Wextra -Werror)
target_link_libraries(wirdna_pdf_crop dl)
# Keep compatibility with devices using 16 KiB memory pages.
target_link_options(wirdna_pdf_crop PRIVATE "-Wl,-z,max-page-size=16384")
