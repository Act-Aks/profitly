import * as LocalAuthentication from 'expo-local-authentication'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { AppState, Text, TouchableOpacity, View } from 'react-native'
import { useSettingsStore } from '@/stores/settings.store'

interface AppLockGateProps {
    children: ReactNode
}

export function AppLockGate({ children }: AppLockGateProps) {
    const isBiometricLockEnabled = useSettingsStore(state => state.isBiometricLockEnabled)
    const [isLocked, setIsLocked] = useState(isBiometricLockEnabled)
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [isAvailable, setIsAvailable] = useState(true)
    const appState = useRef(AppState.currentState)

    useEffect(() => {
        const checkAvailability = async () => {
            const hasHardware = await LocalAuthentication.hasHardwareAsync()
            const isEnrolled = await LocalAuthentication.isEnrolledAsync()
            setIsAvailable(hasHardware && isEnrolled)
        }
        checkAvailability()
    }, [])

    useEffect(() => {
        if (!(isBiometricLockEnabled && isAvailable)) {
            setIsLocked(false)
            return
        }
        setIsLocked(true)
    }, [isBiometricLockEnabled, isAvailable])

    const authenticate = async () => {
        if (isAuthenticating || !isAvailable) {
            return
        }
        try {
            setIsAuthenticating(true)
            const result = await LocalAuthentication.authenticateAsync({
                fallbackLabel: 'Use Passcode',
                promptMessage: 'Unlock Profitly',
            })
            setIsLocked(!result.success)
        } catch (error) {
            console.error('Biometric auth failed:', error)
            setIsLocked(true)
        } finally {
            setIsAuthenticating(false)
        }
    }

    useEffect(() => {
        if (isBiometricLockEnabled && isAvailable) {
            authenticate()
        }
    }, [isBiometricLockEnabled, isAvailable, authenticate])

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            const wasBackground = appState.current.match(/inactive|background/)
            appState.current = nextState
            if (wasBackground && nextState === 'active' && isBiometricLockEnabled && isAvailable) {
                setIsLocked(true)
                authenticate()
            }
        })
        return () => subscription.remove()
    }, [isBiometricLockEnabled, isAvailable, authenticate])

    if (!(isBiometricLockEnabled && isAvailable && isLocked)) {
        return <>{children}</>
    }

    return (
        <View className='flex-1 items-center justify-center bg-slate-950 px-6'>
            <Text className='mb-2 font-bold text-3xl text-white'>Profitly</Text>
            <Text className='mb-6 text-center text-gray-400'>
                Unlock with Face ID / Touch ID to continue
            </Text>
            <TouchableOpacity
                className='rounded-lg bg-blue-600 px-6 py-3'
                disabled={isAuthenticating}
                onPress={authenticate}
            >
                <Text className='font-semibold text-white'>
                    {isAuthenticating ? 'Authenticating...' : 'Unlock'}
                </Text>
            </TouchableOpacity>
        </View>
    )
}
