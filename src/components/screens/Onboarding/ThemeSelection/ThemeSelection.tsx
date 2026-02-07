import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Button, Card, PressableFeedback, Surface } from 'heroui-native'
import { ScrollView, View } from 'react-native'
import { capitalize, keys } from '@/utils/generics'
import { ThemeHooks } from '@/utils/hooks/theme/theme.hooks'
import { THEMES_PRESET, type ThemeName } from '@/utils/theme'

export const ThemeSelection: React.FC = () => {
    const router = useRouter()
    const { themeName, setThemeName } = ThemeHooks.useTheme()

    return (
        <Surface className='flex-1 py-safe'>
            <Card>
                <Card.Title className='text-center font-bold text-2xl'>
                    Choose Your Theme
                </Card.Title>
                <Card.Description className='text-center'>
                    Personalize your Profitly experience with your favorite color
                </Card.Description>
            </Card>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Surface className='mb-4 flex-1 gap-1' variant='secondary'>
                    {keys(THEMES_PRESET).map(renderThemeSelectOption)}
                </Surface>
            </ScrollView>
            <Button onPress={onContinue}>
                <Button.Label>Continue</Button.Label>
            </Button>
        </Surface>
    )

    function onContinue() {
        router.navigate({
            params: {},
            pathname: '/(onboarding)/complete',
        })
    }

    function renderThemeSelectOption(name: ThemeName) {
        const theme = THEMES_PRESET[name]
        return (
            <PressableFeedback
                className='rounded-2xl'
                key={name}
                onPress={() => setThemeName(name)}
            >
                <Card
                    className='flex-row items-center justify-between border border-accent/30'
                    variant='secondary'
                >
                    <View className='flex-row items-center gap-2'>
                        <Card.Title>{theme.icon}</Card.Title>
                        <Card.Body>
                            <Card.Title>{capitalize(name)}</Card.Title>
                            <Card.Description className='text-sm'>
                                {theme.description}
                            </Card.Description>
                        </Card.Body>
                    </View>
                    {themeName === name && (
                        <Ionicons color={theme.color} name={'checkmark-circle-outline'} size={24} />
                    )}
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
