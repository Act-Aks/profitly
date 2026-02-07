import type { Uniwind } from 'uniwind'
import type { CamelCase } from './generics'

type Themes = Parameters<typeof Uniwind.setTheme>[number]
type BaseThemeName<Theme> = Theme extends `${infer Name}-dark` | `${infer Name}-light`
    ? Name
    : never

interface Preset<ThemeName extends BaseThemeName<Themes>> {
    color: string
    dark: `${Lowercase<ThemeName>}-dark`
    description: string
    icon: string
    light: `${Lowercase<ThemeName>}-light`
}

export type ThemePreset = {
    [Name in BaseThemeName<Themes> as CamelCase<Name>]: Preset<Name>
}
export type ThemeName = keyof ThemePreset
export type ThemeColorMode = 'dark' | 'light'

export const THEMES_PRESET = {
    amethyst: {
        color: '#9333ea',
        dark: 'amethyst-dark',
        description: 'Creative and bold',
        icon: '💜',
        light: 'amethyst-light',
    },
    champagne: {
        color: '#d97706',
        dark: 'champagne-dark',
        description: 'Warm and inviting',
        icon: '🥂',
        light: 'champagne-light',
    },
    coral: {
        color: '#f97316',
        dark: 'coral-dark',
        description: 'Vibrant and energetic',
        icon: '🧡',
        light: 'coral-light',
    },
    emerald: {
        color: '#10b981',
        dark: 'emerald-dark',
        description: 'Fresh and calming',
        icon: '💚',
        light: 'emerald-light',
    },
    obsidian: {
        color: '#374151',
        dark: 'obsidian-dark',
        description: 'Dark and mysterious',
        icon: '🖤',
        light: 'obsidian-light',
    },
    roseGold: {
        color: '#f43f5e',
        dark: 'rose-gold-dark',
        description: 'Rose and gold',
        icon: '🌸',
        light: 'rose-gold-light',
    },
    sapphire: {
        color: '#3b82f6',
        dark: 'sapphire-dark',
        description: 'Cool and professional',
        icon: '💙',
        light: 'sapphire-light',
    },
    slate: {
        color: '#64748b',
        dark: 'slate-dark',
        description: 'Modern and sleek',
        icon: '⬜',
        light: 'slate-light',
    },
} as const satisfies ThemePreset
