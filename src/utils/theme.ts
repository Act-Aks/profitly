import type { Uniwind } from 'uniwind'
import type { CamelCase } from './generics'

type Themes = Parameters<typeof Uniwind.setTheme>[number]
type BaseThemeName<Theme = Themes> = Theme extends `${infer Name}-dark` | `${infer Name}-light`
    ? Name
    : never

export type ThemePreset = {
    [Name in BaseThemeName<Themes> as CamelCase<Name>]: {
        color: string
        dark: `${Lowercase<Name>}-dark`
        icon: string
        light: `${Lowercase<Name>}-light`
    }
}
export type ThemeName = keyof ThemePreset
export type ThemeColorMode = 'dark' | 'light'

export const THEMES_PRESET = {
    amethyst: {
        color: '#9333ea',
        dark: 'amethyst-dark',
        icon: '💜',
        light: 'amethyst-light',
    },
    champagne: {
        color: '#d97706',
        dark: 'champagne-dark',
        icon: '🥂',
        light: 'champagne-light',
    },
    coral: {
        color: '#f97316',
        dark: 'coral-dark',
        icon: '🧡',
        light: 'coral-light',
    },
    emerald: {
        color: '#10b981',
        dark: 'emerald-dark',
        icon: '💚',
        light: 'emerald-light',
    },
    obsidian: {
        color: '#374151',
        dark: 'obsidian-dark',
        icon: '🖤',
        light: 'obsidian-light',
    },
    roseGold: {
        color: '#f43f5e',
        dark: 'rose-gold-dark',
        icon: '🌸',
        light: 'rose-gold-light',
    },
    sapphire: {
        color: '#3b82f6',
        dark: 'sapphire-dark',
        icon: '💙',
        light: 'sapphire-light',
    },
    slate: {
        color: '#64748b',
        dark: 'slate-dark',
        icon: '�',
        light: 'slate-light',
    },
} as const satisfies ThemePreset
