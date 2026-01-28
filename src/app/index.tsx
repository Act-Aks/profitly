import { Text, View } from 'react-native'
import { ThemeSwitcher } from '../components/molecules/ThemeSwitcher/ThemeSwitcher'

export default function App() {
    return (
        <View className='flex-1 items-center justify-center bg-white px-8 dark:bg-black'>
            {/* Heading */}
            <Text className='mb-3 font-extrabold text-4xl text-gray-800 tracking-tight dark:text-white'>
                🚀 Welcome
            </Text>

            {/* Subheading */}
            <Text className='mb-8 text-center text-gray-700 text-xl leading-relaxed dark:text-white'>
                Build beautiful apps with{' '}
                <Text className='font-semibold text-blue-500'>Expo (Router) + Uniwind 🔥</Text>
            </Text>

            {/* Instruction text */}
            <Text className='max-w-sm text-center text-base text-gray-600 dark:text-white'>
                Start customizing your app by editing{' '}
                <Text className='font-semibold text-gray-800 dark:text-white'>app/index.tsx</Text>
            </Text>

            <ThemeSwitcher />
        </View>
    )
}
