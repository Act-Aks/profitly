import { useRouter } from 'expo-router'
import { Button, Card, Surface } from 'heroui-native'
import { View } from 'react-native'
import Animated, { Easing, PinwheelIn } from 'react-native-reanimated'
import { useSettingsStore } from '@/stores/settings.store'

export const Completed: React.FC = () => {
    const router = useRouter()
    const setOnboardingCompleted = useSettingsStore(state => state.setOnboardingCompleted)

    function startTracking() {
        setOnboardingCompleted(true)
        router.replace('/(tabs)')
    }

    return (
        <Surface className='flex-1 py-safe'>
            <View className='flex-1 items-center justify-center'>
                <Animated.View
                    className='items-center'
                    entering={PinwheelIn.duration(500).easing(Easing.ease)}
                >
                    <Card className='p-6' variant='tertiary'>
                        <Card.Title className='text-4xl'>🎉</Card.Title>
                    </Card>
                    <Card>
                        <Card.Title className='text-center'>You're All Set!</Card.Title>
                        <Card.Description className='text-center'>
                            Welcome to Profitly. Your statement journey starts here.
                        </Card.Description>
                    </Card>
                </Animated.View>
                <Animated.View>
                    <Card
                        className='border-accent border-r-3 border-l-3 shadow-accent'
                        variant='secondary'
                    >
                        <Card.Title className='font-bold'>📋 Quick Tips</Card.Title>
                        <Card.Description>
                            • Add statement summaries for each period
                        </Card.Description>
                        <Card.Description>• Monitor your net earnings growth</Card.Description>
                        <Card.Description>• Upload documents for quick import</Card.Description>
                    </Card>
                </Animated.View>
            </View>
            <Button onPress={startTracking}>
                <Button.Label>Start Tracking</Button.Label>
            </Button>
        </Surface>
    )
}
