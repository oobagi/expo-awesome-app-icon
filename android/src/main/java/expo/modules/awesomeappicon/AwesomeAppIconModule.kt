package expo.modules.awesomeappicon

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

private const val ICON_NAMES_META_DATA = "expo.modules.awesomeappicon.ICON_NAMES"
private const val ICON_ALIASES_META_DATA = "expo.modules.awesomeappicon.ICON_ALIASES"
private const val DEFAULT_ALIAS_META_DATA = "expo.modules.awesomeappicon.DEFAULT_ALIAS"

private class AwesomeAppIconException(message: String) : CodedException(message)

class AwesomeAppIconModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AwesomeAppIcon")

    Function("supportsAlternateIcons") {
      iconAliases().isNotEmpty()
    }

    Function("getAvailableIcons") {
      iconNames()
    }

    Function("getAppIcon") {
      getCurrentIconName()
    }

    AsyncFunction("setAppIconAsync") { iconName: String? ->
      setAppIcon(iconName)
    }
  }

  private fun context(): Context {
    return appContext.reactContext
      ?: throw AwesomeAppIconException("React context is not available.")
  }

  private fun metaDataValue(name: String): String? {
    val context = context()
    val appInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.packageManager.getApplicationInfo(
        context.packageName,
        PackageManager.ApplicationInfoFlags.of(PackageManager.GET_META_DATA.toLong())
      )
    } else {
      @Suppress("DEPRECATION")
      context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
    }
    return appInfo.metaData?.getString(name)
  }

  private fun iconNames(): List<String> {
    return metaDataValue(ICON_NAMES_META_DATA)
      ?.split(",")
      ?.map { it.trim() }
      ?.filter { it.isNotEmpty() }
      ?: emptyList()
  }

  private fun iconAliases(): Map<String, String> {
    val value = metaDataValue(ICON_ALIASES_META_DATA) ?: return emptyMap()
    val json = JSONObject(value)
    return json.keys().asSequence().associateWith { key -> json.getString(key) }
  }

  private fun defaultAlias(): String {
    return metaDataValue(DEFAULT_ALIAS_META_DATA)
      ?: throw AwesomeAppIconException("Default launcher alias is not configured. Add the react-native-awesome-app-icon config plugin and rebuild the app.")
  }

  private fun aliasComponent(aliasName: String): ComponentName {
    return ComponentName(context().packageName, aliasName)
  }

  private fun isAliasEnabled(aliasName: String): Boolean {
    val packageManager = context().packageManager
    val state = packageManager.getComponentEnabledSetting(aliasComponent(aliasName))
    return state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED ||
      (aliasName == defaultAlias() && state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT)
  }

  private fun getCurrentIconName(): String? {
    val aliases = iconAliases()
    return aliases.entries.firstOrNull { isAliasEnabled(it.value) }?.key
  }

  private fun setAppIcon(iconName: String?) {
    val aliases = iconAliases()
    if (aliases.isEmpty()) {
      throw AwesomeAppIconException("No alternate app icons are configured. Add icons to the config plugin and rebuild the app.")
    }

    val targetAlias = if (iconName == null) {
      defaultAlias()
    } else {
      aliases[iconName]
        ?: throw AwesomeAppIconException("Unknown app icon '$iconName'. Make sure it is declared in the config plugin.")
    }

    val allAliases = listOf(defaultAlias()) + aliases.values
    val packageManager = context().packageManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val settings = allAliases.map { aliasName ->
        PackageManager.ComponentEnabledSetting(
          aliasComponent(aliasName),
          if (aliasName == targetAlias) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED
          } else {
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED
          },
          PackageManager.DONT_KILL_APP
        )
      }
      packageManager.setComponentEnabledSettings(settings)
      return
    }

    packageManager.setComponentEnabledSetting(
      aliasComponent(targetAlias),
      PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
      PackageManager.DONT_KILL_APP
    )

    allAliases
      .filter { it != targetAlias }
      .forEach { aliasName ->
        packageManager.setComponentEnabledSetting(
          aliasComponent(aliasName),
          PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
          PackageManager.DONT_KILL_APP
        )
      }
  }
}
