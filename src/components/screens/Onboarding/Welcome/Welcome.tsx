import { useRouter } from 'expo-router'
import { Button, Card, PressableFeedback } from 'heroui-native'
import { Surface } from 'heroui-native/surface'
import { ScrollView, View } from 'react-native'
import Animated, {
    Easing,
    FlipInEasyY,
    FlipOutEasyY,
    StretchInX,
    StretchOutX,
} from 'react-native-reanimated'
import { useSettingsStore } from '@/stores/settings.store'
import { features } from './Welcome.statis'

export const Welcome: React.FC = () => {
    const router = useRouter()
    const setOnboardingCompleted = useSettingsStore(state => state.setOnboardingCompleted)

    return (
        <Surface className='flex-1 py-safe'>
            <Animated.View
                className='items-center gap-2'
                entering={StretchInX.duration(500).easing(Easing.ease)}
                exiting={StretchOutX.duration(500).easing(Easing.ease)}
            >
                <Card className='h-24 w-24 items-center justify-center bg-linear-to-br from-accent/15 to-accent/75'>
                    <Card.Title className='font-bold text-4xl'>₹</Card.Title>
                </Card>
                <Card>
                    <Card.Title className='text-center font-bold text-3xl'>Profitly</Card.Title>
                    <Card.Description className='text-center text-lg'>
                        Track your trading profits and losses with ease
                    </Card.Description>
                </Card>
            </Animated.View>
            <ScrollView>
                <Animated.View
                    className='w-full gap-2'
                    entering={FlipInEasyY.duration(500).easing(Easing.ease)}
                    exiting={FlipOutEasyY.duration(500).easing(Easing.ease)}
                >
                    {features.map(renderFeature)}
                </Animated.View>
            </ScrollView>
            <View className='gap-2'>
                <Button onPress={onGetStarted} pressableFeedbackVariant='ripple'>
                    <Button.Label>Get Started</Button.Label>
                </Button>
                <Button onPress={onSkip} variant='ghost'>
                    <Button.Label className='font-medium text-sm'>Skip for now</Button.Label>
                </Button>
            </View>
        </Surface>
    )

    function onGetStarted() {
        router.navigate('/(onboarding)/theme')
    }

    function onSkip() {
        setOnboardingCompleted(true)
        router.replace('/(tabs)')
    }

    function renderFeature({ title, description }: { title: string; description: string }) {
        return (
            <PressableFeedback key={title}>
                <Card className='border border-accent/30' variant='secondary'>
                    <Card.Title>{title}</Card.Title>
                    <Card.Description>{description}</Card.Description>
                    <PressableFeedback.Ripple
                        animation={{
                            backgroundColor: { value: 'white' },
                            opacity: { value: [0, 0.3, 0] },
                        }}
                    />
                </Card>
            </PressableFeedback>
        )
    }
}
