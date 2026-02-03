import '@/global.css'
import { Stack } from 'expo-router'
// biome-ignore lint/performance/noNamespaceImport: By docs
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { HeroUINativeProvider } from 'heroui-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { ThemeProvider } from '@/components/molecules/ThemeProvider/ThemeProvider'
import { heroUiNativeConfig } from '@/configs/heroUiNative'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { Database } from '@/utils/database/seed'
import { AppNotification } from '@/utils/notifications'

AppNotification.initNotificationHandler()

SplashScreen.setOptions({
    duration: 800,
    fade: true,
})

Database.initialize()

function StackLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='(tabs)' />
        </Stack>
    )
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NotificationProvider>
                <KeyboardProvider>
                    <ThemeProvider>
                        <HeroUINativeProvider config={heroUiNativeConfig}>
                            <StackLayout />
                            <StatusBar style={'auto'} />
                        </HeroUINativeProvider>
                    </ThemeProvider>
                </KeyboardProvider>
            </NotificationProvider>
        </GestureHandlerRootView>
    )
}
