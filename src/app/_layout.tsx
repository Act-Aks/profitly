import '@/global.css'
import { Stack } from 'expo-router'
// biome-ignore lint/performance/noNamespaceImport: By docs
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { HeroUINativeProvider } from 'heroui-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { heroUiNativeConfig } from '@/configs/heroUiNative'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AppThemeProvider } from '@/contexts/ThemeContext'
import { AppNotification } from '@/utils/notifications'

AppNotification.initNotificationHandler()

SplashScreen.setOptions({
    duration: 800,
    fade: true,
})

function StackLayout() {
    return (
        <Stack>
            <Stack.Screen name={'index'} options={{ headerShown: false }} />
        </Stack>
    )
}

export default function Layout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NotificationProvider>
                <KeyboardProvider>
                    <AppThemeProvider>
                        <HeroUINativeProvider config={heroUiNativeConfig}>
                            <StackLayout />
                            <StatusBar style={'auto'} />
                        </HeroUINativeProvider>
                    </AppThemeProvider>
                </KeyboardProvider>
            </NotificationProvider>
        </GestureHandlerRootView>
    )
}
