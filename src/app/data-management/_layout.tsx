import { Stack } from 'expo-router'

export default function DataManagementLayout() {
    return (
        <Stack
            screenOptions={{
                animationEnabled: true,
                headerShown: false,
                presentation: 'modal',
            }}
        >
            <Stack.Screen name='index' />
        </Stack>
    )
}
