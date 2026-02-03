export interface ThemeSwitcherProps {
    showLabel?: boolean
    showColorMode?: boolean
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'compact' | 'full'
}

export const colorModesWithLabel = {
    dark: { icon: '🌙', label: 'dark' },
    light: { icon: '☀️', label: 'light' },
    system: { icon: '💻', label: 'auto' },
} as const
