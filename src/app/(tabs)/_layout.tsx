import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useThemeColor } from 'heroui-native'

export default function TabLayout() {
    const [backgroundColor, accentColor, foregroundColor] = useThemeColor([
        'background',
        'accent',
        'foreground',
    ])

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: accentColor,
                tabBarInactiveTintColor: foregroundColor,
                tabBarStyle: {
                    backgroundColor,
                    borderTopColor: accentColor,
                },
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons color={color} name={'home'} size={size} />
                    ),
                    title: 'Dashboard',
                }}
            />
            <Tabs.Screen
                name='import'
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons color={color} name={'document'} size={size} />
                    ),
                    title: 'Statements',
                }}
            />
            <Tabs.Screen
                name='settings'
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons color={color} name={'settings'} size={size} />
                    ),
                    title: 'Settings',
                }}
            />
        </Tabs>
    )
}
