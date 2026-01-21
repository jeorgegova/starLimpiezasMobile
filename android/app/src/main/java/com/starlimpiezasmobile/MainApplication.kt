package com.starlimpiezasmobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

import com.rnfs.RNFSPackage
import com.th3rdwave.safeareacontext.SafeAreaContextPackage
import com.swmansion.rnscreens.RNScreensPackage
import com.oblador.vectoricons.VectorIconsPackage
import com.htmltopdf.HtmlToPdfPackage
import com.BV.LinearGradient.LinearGradientPackage
import com.christopherdro.RNPrint.RNPrintPackage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage
import com.reactnativecommunity.picker.RNCPickerPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(RNFSPackage())
          add(SafeAreaContextPackage())
          add(RNScreensPackage())
          add(VectorIconsPackage())
          add(HtmlToPdfPackage())
          add(LinearGradientPackage())
          add(RNPrintPackage())
          add(AsyncStoragePackage())
          add(RNCPickerPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
