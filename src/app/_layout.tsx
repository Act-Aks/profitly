import '@/global.css'
import { Stack } from 'expo-router'
// biome-ignore lint/performance/noNamespaceImport: By docs
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { HeroUINativeProvider } from 'heroui-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaListener } from 'react-native-safe-area-context'
import { Uniwind } from 'uniwind'
import { ThemeProvider } from '@/components/molecules/ThemeProvider/ThemeProvider'
import { AppLockGate } from '@/components/organisms/AppLockGate/AppLockGate'
import { heroUiNativeConfig } from '@/configs/heroUiNative'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { useSettingsStore } from '@/stores/settings.store'
import { Database } from '@/utils/database/seed'
import { AppNotification } from '@/utils/notifications'

AppNotification.initNotificationHandler()

SplashScreen.setOptions({
    duration: 800,
    fade: true,
})

Database.initialize()

function StackLayout() {
    const isOnboardingCompleted = useSettingsStore(state => state.isOnboardingCompleted)

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isOnboardingCompleted}>
                <Stack.Screen name='(onboarding)' />
            </Stack.Protected>
            <Stack.Protected guard={isOnboardingCompleted}>
                <Stack.Screen name='(tabs)' />
                <Stack.Screen name='data-management' options={{ presentation: 'modal' }} />
                <Stack.Screen name='theme-preview/index' options={{ presentation: 'modal' }} />
                <Stack.Screen name='statement-template/index' options={{ presentation: 'modal' }} />
                <Stack.Screen name='statement-new/index' options={{ presentation: 'modal' }} />
                <Stack.Screen name='statement-detail/[id]' options={{ presentation: 'modal' }} />
            </Stack.Protected>
        </Stack>
    )
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
                <NotificationProvider>
                    <KeyboardProvider>
                        <ThemeProvider>
                            <HeroUINativeProvider config={heroUiNativeConfig}>
                                <AppLockGate>
                                    <StackLayout />
                                </AppLockGate>
                                <StatusBar style={'auto'} />
                            </HeroUINativeProvider>
                        </ThemeProvider>
                    </KeyboardProvider>
                </NotificationProvider>
            </SafeAreaListener>
        </GestureHandlerRootView>
    )
}
