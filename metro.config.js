const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro') // make sure this import exists

/** @type {import('expo/metro-config').MetroConfig} */
// biome-ignore lint/correctness/noGlobalDirnameFilename: Ignore
const config = getDefaultConfig(__dirname)

config.resolver.sourceExts.push('sql')

const uniwindConfig = withUniwindConfig(config, {
    cssEntryFile: './src/global.css',
    dtsFile: './src/uniwind-types.d.ts',
    extraThemes: [
        'amethyst-dark',
        'obsidian-dark',
        'rose-gold-dark',
        'emerald-dark',
        'champagne-dark',
        'sapphire-dark',
        'slate-dark',
        'coral-dark',
        'amethyst-light',
        'obsidian-light',
        'rose-gold-light',
        'emerald-light',
        'champagne-light',
        'sapphire-light',
        'slate-light',
        'coral-light',
    ],
})

module.exports = uniwindConfig
