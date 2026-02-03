import { Description } from 'heroui-native'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemeSwitcher } from '@/components/molecules/ThemeSwitcher/ThemeSwitcher'

export default function DashboardScreen() {
    return (
        <ScrollView className='bg-background'>
            <SafeAreaView>
                <Description>Hi</Description>
                <ThemeSwitcher variant='full' />
            </SafeAreaView>
        </ScrollView>
    )
}
