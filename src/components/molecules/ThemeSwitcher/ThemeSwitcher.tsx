import { Button, Select } from 'heroui-native'
import { ScrollView, Text, View } from 'react-native'
import { capitalize, keys, toTitleCase } from '@/utils/generics'
import { ThemeHooks } from '@/utils/hooks/theme/theme.hooks'
import { THEMES_PRESET, type ThemeName } from '@/utils/theme'
import { colorModesWithLabel, type ThemeSwitcherProps } from './ThemeSwitcher.static'

export function ThemeSwitcher({
    showLabel = true,
    showColorMode = true,
    size = 'sm',
    variant = 'default',
}: ThemeSwitcherProps) {
    const { themeName, themeColorMode, setThemeName, setThemeColorMode } = ThemeHooks.useTheme()

    function handleThemeSelect(option: { label: Capitalize<ThemeName>; value: ThemeName }) {
        setThemeName(option.value)
    }

    // Compact variant - icons only
    if (variant === 'compact') {
        return (
            <View className='flex-row items-center gap-1'>
                <Select
                    // @ts-expect-error SelectOptions
                    onValueChange={handleThemeSelect}
                    value={{ label: capitalize(themeName), value: themeName }}
                >
                    <Select.Trigger asChild>
                        <Button className='h-9 w-9' size='md' variant='ghost'>
                            <Text className='text-lg'>{THEMES_PRESET[themeName].icon}</Text>
                        </Button>
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Overlay />
                        <Select.Content className='rounded-xl' placement='bottom' width={180}>
                            <ScrollView>
                                {keys(THEMES_PRESET).map(name => (
                                    <Select.Item key={name} label={capitalize(name)} value={name}>
                                        <View className='flex-1 flex-row items-center gap-3'>
                                            <Text className='text-lg'>
                                                {THEMES_PRESET[name].icon}
                                            </Text>
                                            <Text className='text-foreground text-sm'>
                                                {capitalize(name)}
                                            </Text>
                                        </View>
                                        <Select.ItemIndicator />
                                    </Select.Item>
                                ))}
                            </ScrollView>
                        </Select.Content>
                    </Select.Portal>
                </Select>
            </View>
        )
    }

    // Full variant - settings page style
    if (variant === 'full') {
        return (
            <View className='gap-6'>
                <View>
                    <Text className='mb-3 font-medium text-foreground text-sm'>Theme</Text>
                    <Select
                        // @ts-expect-error SelectOptions
                        onValueChange={handleThemeSelect}
                        value={{ label: toTitleCase(themeName), value: themeName }}
                    >
                        <Select.Trigger asChild>
                            <Button className='w-full justify-start' size='md' variant='secondary'>
                                <View className='flex-row items-center gap-3'>
                                    <View
                                        className='h-5 w-5 rounded-full'
                                        style={{ backgroundColor: THEMES_PRESET[themeName].color }}
                                    />
                                    <Text className='text-lg'>{THEMES_PRESET[themeName].icon}</Text>
                                    <Text className='text-base text-foreground'>{themeName}</Text>
                                </View>
                            </Button>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Overlay />
                            <Select.Content className='rounded-2xl' placement='bottom' width={280}>
                                <ScrollView className='max-h-[320px]'>
                                    {keys(THEMES_PRESET).map(name => (
                                        <Select.Item
                                            key={name}
                                            label={capitalize(name)}
                                            value={name}
                                        >
                                            <View className='flex-1 flex-row items-center gap-3'>
                                                <View
                                                    className={`h-4 w-4 rounded-full bg-[${THEMES_PRESET[name].color}]`}
                                                />
                                                <Text className='text-xl'>
                                                    {THEMES_PRESET[name].icon}
                                                </Text>
                                                <Text className='flex-1 text-base text-foreground'>
                                                    {name}
                                                </Text>
                                            </View>
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </ScrollView>
                            </Select.Content>
                        </Select.Portal>
                    </Select>
                </View>
                {showColorMode && (
                    <View>
                        <Text className='mb-3 font-medium text-foreground text-sm'>Appearance</Text>
                        <View className='flex-row gap-2'>
                            {(['light', 'dark'] as const).map(mode => (
                                <Button
                                    className='flex-1'
                                    key={mode}
                                    onPress={() => setThemeColorMode(mode)}
                                    size='sm'
                                    variant={themeColorMode === mode ? 'secondary' : 'ghost'}
                                >
                                    <Text className='mr-1.5 text-base'>
                                        {colorModesWithLabel[mode].icon}
                                    </Text>
                                    <Text className='text-foreground text-sm capitalize'>
                                        {capitalize(colorModesWithLabel[mode].label)}
                                    </Text>
                                </Button>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        )
    }

    // Default variant
    return (
        <View className='flex-row items-center gap-2'>
            <Select
                // @ts-expect-error SelectOptions
                onValueChange={handleThemeSelect}
                value={{ label: capitalize(themeName), value: themeName }}
            >
                <Select.Trigger asChild>
                    <Button size={size} variant='tertiary'>
                        <View className='flex-row items-center gap-2'>
                            <Text className='text-base'>{THEMES_PRESET[themeName].icon}</Text>
                            {showLabel && (
                                <Text className='text-foreground text-sm'>{themeName}</Text>
                            )}
                        </View>
                    </Button>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Overlay />
                    <Select.Content className='rounded-2xl' placement='bottom' width={220}>
                        <ScrollView>
                            {keys(THEMES_PRESET).map(name => (
                                <Select.Item key={name} label={capitalize(name)} value={name}>
                                    <View className='flex-1 flex-row items-center gap-3'>
                                        <View
                                            className={`h-3 w-3 rounded-full bg-${THEMES_PRESET[name].color}`}
                                        />
                                        <Text className='text-xl'> {THEMES_PRESET[name].icon}</Text>
                                        <Text className='flex-1 text-base text-foreground'>
                                            {name}
                                        </Text>
                                    </View>
                                    <Select.ItemIndicator />
                                </Select.Item>
                            ))}
                        </ScrollView>
                    </Select.Content>
                </Select.Portal>
            </Select>
        </View>
    )
}
