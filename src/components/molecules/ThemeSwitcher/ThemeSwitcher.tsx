import { Pressable, Text, View } from 'react-native'
import { useAppTheme } from '@/contexts/ThemeContext'

const themes = [
    { icon: '☀️', label: 'Light', name: 'light' },
    { icon: '🌙', label: 'Dark', name: 'dark' },
    { icon: '⚙️', label: 'System', name: 'system' },
] as const

export const ThemeSwitcher = () => {
    const { setTheme, currentTheme } = useAppTheme()

    return (
        <View className='gap-4 p-4'>
            <Text className='text-gray-600 text-sm dark:text-gray-300'>
                Current: {currentTheme}
            </Text>

            <View className='flex-row gap-2'>
                {themes.map(({ name, label, icon }) => (
                    <Pressable
                        className={`items-center rounded-lg px-4 py-3 ${currentTheme === name ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        key={name}
                        onPress={() => setTheme(name)}
                    >
                        <Text className='mb-1 text-2xl'>{icon}</Text>
                        <Text
                            className={`text-xs ${
                                currentTheme === name
                                    ? 'text-white'
                                    : 'text-gray-900 dark:text-white'
                            }`}
                        >
                            {label}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    )
}
