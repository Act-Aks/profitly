import { type PropsWithChildren, useEffect } from 'react'
import { Uniwind, useUniwind } from 'uniwind'
import { useSettingsStore } from '@/stores/settings.store'
import { THEMES_PRESET } from '@/utils/theme'

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { theme: currentTheme } = useUniwind()
    const themeName = useSettingsStore(state => state.themeName)
    const themeColorMode = useSettingsStore(state => state.themeColorMode)

    useEffect(() => {
        const selectedTheme = THEMES_PRESET[themeName][themeColorMode]
        if (selectedTheme === currentTheme) {
            return
        }

        Uniwind.setTheme(selectedTheme)
    }, [currentTheme, themeColorMode, themeName])

    return <>{children}</>
}
