import { useUniwind } from 'uniwind'
import { useSettingsStore } from '@/stores/settings.store'
import { THEMES_PRESET } from '@/utils/theme'

function useTheme() {
    const { theme: currentTheme, hasAdaptiveThemes } = useUniwind()
    const themeColorMode = useSettingsStore(state => state.themeColorMode)
    const themeName = useSettingsStore(state => state.themeName)
    const setThemeColorMode = useSettingsStore(state => state.setThemeColorMode)
    const setThemeName = useSettingsStore(state => state.setThemeName)
    const selectedTheme = THEMES_PRESET[themeName][themeColorMode]

    return {
        currentTheme,
        hasAdaptiveThemes,
        selectedTheme,
        setThemeColorMode,
        setThemeName,
        themeColorMode,
        themeName,
    }
}

export const ThemeHooks = {
    useTheme,
}
