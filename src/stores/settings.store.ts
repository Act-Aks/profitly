import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExcludeFunctions } from '@/utils/generics'
import { createZustandMmkvStorage } from '@/utils/mmkvStorage'
import type { ThemeColorMode, ThemeName } from '@/utils/theme'

interface SettingsState {
    currency: string
    currencySymbol: string
    isBiometricLockEnabled: boolean
    isHapticFeedbackEnabled: boolean
    isNotificationsEnabled: boolean
    themeColorMode: ThemeColorMode
    themeName: ThemeName

    // Actions
    resetSettings: () => void
    setBiometricLock: (isBiometricLockEnabled: boolean) => void
    setCurrency: (currency: string, symbol: string) => void
    setHapticFeedback: (isHapticFeedbackEnabled: boolean) => void
    setNotifications: (isNotificationsEnabled: boolean) => void
    setThemeColorMode: (themeColorMode: ThemeColorMode) => void
    setThemeName: (themeName: ThemeName) => void
}

const defaultSettings = {
    currency: 'INR',
    currencySymbol: '₹',
    isBiometricLockEnabled: false,
    isHapticFeedbackEnabled: true,
    isNotificationsEnabled: true,
    themeColorMode: 'dark',
    themeName: 'sapphire',
} satisfies ExcludeFunctions<SettingsState>

export const useSettingsStore = create<SettingsState>()(
    persist(
        setState => ({
            ...defaultSettings,
            resetSettings: () => setState(defaultSettings),
            setBiometricLock: isBiometricLockEnabled => setState({ isBiometricLockEnabled }),
            setCurrency: (currency, symbol) => setState({ currency, currencySymbol: symbol }),
            setHapticFeedback: isHapticFeedbackEnabled => setState({ isHapticFeedbackEnabled }),
            setNotifications: isNotificationsEnabled => setState({ isNotificationsEnabled }),
            setThemeColorMode: themeColorMode => setState({ themeColorMode }),
            setThemeName: themeName => setState({ themeName }),
        }),
        {
            ...createZustandMmkvStorage('settings'),
            // Only persist these fields
            partialize: state => ({
                currency: state.currency,
                currencySymbol: state.currencySymbol,
                isBiometricLockEnabled: state.isBiometricLockEnabled,
                isHapticFeedbackEnabled: state.isHapticFeedbackEnabled,
                isNotificationsEnabled: state.isNotificationsEnabled,
                themeColorMode: state.themeColorMode,
                themeName: state.themeName,
            }),
        }
    )
)
