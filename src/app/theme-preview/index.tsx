import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Uniwind } from 'uniwind'
import { z } from 'zod'
import { useSettingsStore } from '@/stores/settings.store'
import { THEMES_PRESET, type ThemeName } from '@/utils/theme'

const themeNames = Object.keys(THEMES_PRESET) as ThemeName[]
const paramsSchema = z.object({
    mode: z.enum(['dark', 'light']).optional(),
    themeName: z.enum(themeNames as [ThemeName, ...ThemeName[]]),
})

export default function ThemePreviewScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams<{ themeName?: string; mode?: string }>()
    const {
        themeName: currentThemeName,
        themeColorMode,
        setThemeName,
        setThemeColorMode,
    } = useSettingsStore()

    const initialThemeRef = useRef({
        mode: themeColorMode,
        name: currentThemeName,
    })

    const parsedParams = useMemo(() => {
        const result = paramsSchema.safeParse({
            mode: params.mode,
            themeName: params.themeName,
        })
        return result.success ? result.data : null
    }, [params.mode, params.themeName])

    const previewThemeName = parsedParams?.themeName ?? currentThemeName
    const previewMode = parsedParams?.mode ?? themeColorMode

    useEffect(() => {
        const theme = THEMES_PRESET[previewThemeName][previewMode]
        Uniwind.setTheme(theme)
        return () => {
            const initial = initialThemeRef.current
            Uniwind.setTheme(THEMES_PRESET[initial.name][initial.mode])
        }
    }, [previewMode, previewThemeName])

    const handleApply = () => {
        setThemeName(previewThemeName)
        setThemeColorMode(previewMode)
        router.back()
    }

    return (
        <ScrollView
            className='flex-1 bg-slate-950'
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            <View className='px-4 py-6' style={{ paddingTop: insets.top }}>
                <View className='mb-8 flex-row items-center justify-between'>
                    <View>
                        <Text className='font-bold text-3xl text-white'>Theme Preview</Text>
                        <Text className='text-gray-400 text-sm'>
                            {previewThemeName.replace(/([A-Z])/g, ' $1')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className='h-10 w-10 items-center justify-center'
                        onPress={() => router.back()}
                    >
                        <Text className='font-bold text-2xl text-gray-400'>✕</Text>
                    </TouchableOpacity>
                </View>

                <View className='mb-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-6'>
                    <Text className='mb-2 text-gray-400 text-sm'>Net Earnings</Text>
                    <Text className='mb-2 font-bold text-4xl text-green-400'>₹128,420.50</Text>
                    <View className='flex-row items-center gap-2'>
                        <View className='flex-1 rounded-full bg-gray-700' style={{ height: 4 }}>
                            <View className='h-1 w-3/4 bg-green-400' />
                        </View>
                        <Text className='text-green-400'>+12.4%</Text>
                    </View>
                </View>

                <View className='mb-6 flex-row gap-4'>
                    <View className='flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-2 text-gray-400 text-xs'>Income</Text>
                        <Text className='font-bold text-2xl text-white'>₹221k</Text>
                    </View>
                    <View className='flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-2 text-gray-400 text-xs'>Expenses</Text>
                        <Text className='font-bold text-2xl text-white'>₹92k</Text>
                    </View>
                </View>

                <View className='mb-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-5'>
                    <Text className='mb-4 font-semibold text-white'>Recent Statements</Text>
                    <View className='gap-3'>
                        {[
                            { amount: '+₹12,340', label: 'Groww - Jan 2026' },
                            { amount: '-₹2,120', label: 'HDFC - Dec 2025' },
                            { amount: '+₹8,450', label: 'ICICI - Nov 2025' },
                        ].map(item => (
                            <View
                                className='flex-row items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 p-3'
                                key={item.label}
                            >
                                <Text className='text-gray-300 text-sm'>{item.label}</Text>
                                <Text
                                    className={`font-semibold text-sm ${
                                        item.amount.startsWith('+')
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                    }`}
                                >
                                    {item.amount}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className='gap-3'>
                    <TouchableOpacity
                        className='items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-4'
                        onPress={handleApply}
                    >
                        <Text className='font-bold text-lg text-white'>Apply Theme</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className='items-center rounded-lg border border-gray-700 bg-gray-900 py-4'
                        onPress={() => router.back()}
                    >
                        <Text className='font-semibold text-gray-400'>Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    )
}
