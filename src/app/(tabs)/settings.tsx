import * as LocalAuthentication from 'expo-local-authentication'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettingsStore } from '@/stores/settings.store'
import { THEMES_PRESET, type ThemeName } from '@/utils/theme'

const currencies = [
    { symbol: '₹', value: 'INR' },
    { symbol: '$', value: 'USD' },
    { symbol: '€', value: 'EUR' },
    { symbol: '£', value: 'GBP' },
    { symbol: '¥', value: 'JPY' },
    { symbol: '₽', value: 'RUB' },
]

export default function SettingsScreen() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const {
        themeName,
        themeColorMode,
        setThemeName,
        setThemeColorMode,
        currency,
        setCurrency,
        isBiometricLockEnabled,
        setBiometricLock,
        isHapticFeedbackEnabled,
        setHapticFeedback,
        isNotificationsEnabled,
        setNotifications,
    } = useSettingsStore()
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false)
    const [isBiometricPending, setIsBiometricPending] = useState(false)

    useEffect(() => {
        const checkBiometrics = async () => {
            const hasHardware = await LocalAuthentication.hasHardwareAsync()
            const isEnrolled = await LocalAuthentication.isEnrolledAsync()
            setIsBiometricAvailable(hasHardware && isEnrolled)
        }
        checkBiometrics()
    }, [])

    const handleToggleBiometric = async (nextValue: boolean) => {
        if (isBiometricPending) {
            return
        }
        if (nextValue && !isBiometricAvailable) {
            Alert.alert('Biometrics Unavailable', 'Set up Face ID/Touch ID on your device.')
            setBiometricLock(false)
            return
        }
        if (nextValue) {
            setIsBiometricPending(true)
            try {
                const result = await LocalAuthentication.authenticateAsync({
                    fallbackLabel: 'Use Passcode',
                    promptMessage: 'Enable biometric lock',
                })
                setBiometricLock(result.success)
            } catch (error) {
                console.error('Biometric toggle failed:', error)
                setBiometricLock(false)
            } finally {
                setIsBiometricPending(false)
            }
            return
        }
        setBiometricLock(false)
    }

    const themes = Object.entries(THEMES_PRESET).map(([id, theme]) => ({
        color: theme.color,
        description: theme.description,
        icon: theme.icon,
        id: id as ThemeName,
        name: id.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase()),
    }))

    return (
        <ScrollView
            className='flex-1 bg-slate-950'
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            <View className='px-4 py-6' style={{ paddingTop: insets.top }}>
                {/* Header */}
                <View className='mb-8'>
                    <Text className='font-bold text-3xl text-white'>Settings</Text>
                    <Text className='text-gray-400 text-sm'>Customize your experience</Text>
                </View>

                {/* Appearance Section */}
                <View className='mb-8'>
                    <Text className='mb-4 font-semibold text-white'>Appearance</Text>
                    <View className='mb-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-3 font-semibold text-white'>Mode</Text>
                        <View className='flex-row gap-3'>
                            {(['dark', 'light'] as const).map(mode => (
                                <TouchableOpacity
                                    className={`flex-1 rounded-lg border-2 py-3 ${
                                        themeColorMode === mode
                                            ? 'border-blue-500 bg-blue-900/30'
                                            : 'border-gray-700 bg-gray-900'
                                    }`}
                                    key={mode}
                                    onPress={() => setThemeColorMode(mode)}
                                >
                                    <Text
                                        className={`text-center font-semibold ${
                                            themeColorMode === mode
                                                ? 'text-blue-400'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {mode === 'dark' ? 'Dark' : 'Light'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View className='mt-3 flex-row gap-3'>
                            <TouchableOpacity
                                className='flex-1 items-center rounded-lg border border-gray-700 bg-gray-900 py-2'
                                onPress={() =>
                                    router.push({
                                        params: {
                                            mode: themeColorMode === 'dark' ? 'light' : 'dark',
                                            themeName,
                                        },
                                        pathname: '/theme-preview',
                                    })
                                }
                            >
                                <Text className='font-medium text-gray-300 text-sm'>
                                    Preview Mode
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className='flex-1 items-center rounded-lg bg-blue-600 py-2'
                                onPress={() =>
                                    setThemeColorMode(themeColorMode === 'dark' ? 'light' : 'dark')
                                }
                            >
                                <Text className='font-medium text-sm text-white'>Toggle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text className='mb-3 font-semibold text-white'>Theme Palette</Text>
                    <View className='gap-3'>
                        {themes.map(theme => (
                            <View
                                className={`rounded-xl border-2 p-4 transition-all ${
                                    themeName === theme.id
                                        ? 'border-gray-200 bg-gray-900/80'
                                        : 'border-gray-800 bg-gray-900/40'
                                }`}
                                key={theme.id}
                            >
                                <View className='flex-row items-center gap-3'>
                                    <View
                                        className='h-12 w-12 items-center justify-center rounded-2xl'
                                        style={{ backgroundColor: theme.color }}
                                    >
                                        <Text className='text-lg'>{theme.icon}</Text>
                                    </View>
                                    <View className='flex-1'>
                                        <Text className='font-semibold text-white'>
                                            {theme.name}
                                        </Text>
                                        <Text className='text-gray-400 text-xs'>
                                            {theme.description}
                                        </Text>
                                    </View>
                                    {themeName === theme.id && (
                                        <Text className='text-gray-400'>✓</Text>
                                    )}
                                </View>
                                <View className='mt-4 flex-row gap-3'>
                                    <TouchableOpacity
                                        className='flex-1 items-center rounded-lg border border-gray-700 bg-gray-900 py-2'
                                        onPress={() =>
                                            router.push({
                                                params: {
                                                    mode: themeColorMode,
                                                    themeName: theme.id,
                                                },
                                                pathname: '/theme-preview',
                                            })
                                        }
                                    >
                                        <Text className='font-medium text-gray-300 text-sm'>
                                            Preview
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className={`flex-1 items-center rounded-lg py-2 ${
                                            themeName === theme.id ? 'bg-gray-800' : 'bg-blue-600'
                                        }`}
                                        disabled={themeName === theme.id}
                                        onPress={() => setThemeName(theme.id)}
                                    >
                                        <Text className='font-medium text-sm text-white'>
                                            {themeName === theme.id ? 'Selected' : 'Apply'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Currency Section */}
                <View className='mb-8'>
                    <Text className='mb-4 font-semibold text-white'>Currency</Text>
                    <View className='gap-3'>
                        {currencies.map(curr => (
                            <TouchableOpacity
                                className={`flex-row items-center rounded-lg border-2 p-3 transition-all ${
                                    currency === curr.value
                                        ? 'border-gray-200 bg-gray-900/80'
                                        : 'border-gray-800 bg-gray-900/40'
                                }`}
                                key={curr.value}
                                onPress={() => setCurrency(curr.value, curr.symbol)}
                            >
                                <Text className='mr-3 font-bold text-lg text-white'>
                                    {curr.symbol}
                                </Text>
                                <View className='flex-1'>
                                    <Text className='font-medium text-white'>{curr.value}</Text>
                                </View>
                                {currency === curr.value && (
                                    <Text className='text-gray-400'>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Preferences Section */}
                <View className='mb-8'>
                    <Text className='mb-4 font-semibold text-white'>Preferences</Text>

                    <View className='mb-3 flex-row items-center rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                        <View className='flex-1'>
                            <Text className='font-medium text-white'>Biometric Lock</Text>
                            <Text className='text-gray-400 text-xs'>
                                Require Face ID / Touch ID
                            </Text>
                        </View>
                        <Switch
                            disabled={!isBiometricAvailable || isBiometricPending}
                            onValueChange={handleToggleBiometric}
                            value={isBiometricLockEnabled}
                        />
                    </View>

                    <View className='mb-3 flex-row items-center rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                        <View className='flex-1'>
                            <Text className='font-medium text-white'>Haptic Feedback</Text>
                            <Text className='text-gray-400 text-xs'>Vibration on interactions</Text>
                        </View>
                        <Switch onValueChange={setHapticFeedback} value={isHapticFeedbackEnabled} />
                    </View>

                    <View className='flex-row items-center rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                        <View className='flex-1'>
                            <Text className='font-medium text-white'>Notifications</Text>
                            <Text className='text-gray-400 text-xs'>
                                Alerts for important events
                            </Text>
                        </View>
                        <Switch onValueChange={setNotifications} value={isNotificationsEnabled} />
                    </View>
                </View>

                {/* About Section */}
                <View className='mb-8'>
                    <Text className='mb-4 font-semibold text-white'>About</Text>

                    <View className='rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                        <View className='mb-3 flex-row items-center justify-between border-gray-800 border-b pb-3'>
                            <Text className='text-gray-400'>Version</Text>
                            <Text className='font-medium text-white'>1.0.0</Text>
                        </View>
                        <View className='flex-row items-center justify-between'>
                            <Text className='text-gray-400'>Developer</Text>
                            <Text className='font-medium text-white'>Profitly Team</Text>
                        </View>
                    </View>
                </View>

                {/* Data Management */}
                <View className='gap-3'>
                    <TouchableOpacity
                        className='flex-row items-center rounded-lg border border-gray-800 bg-gray-900/50 p-4 active:opacity-70'
                        onPress={() => router.push('/(tabs)/data-management')}
                    >
                        <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-blue-600'>
                            <Text className='text-lg'>💾</Text>
                        </View>
                        <View className='flex-1'>
                            <Text className='font-medium text-white'>Data Management</Text>
                            <Text className='text-gray-400 text-xs'>
                                Export, backup, and manage your data
                            </Text>
                        </View>
                        <Text className='text-gray-400'>›</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    )
}
