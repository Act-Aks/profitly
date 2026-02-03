module.exports = api => {
    api.cache(true)
    // biome-ignore assist/source/useSortedKeys: Ignore
    return {
        presets: ['babel-preset-expo'],
        plugins: [['inline-import', { extensions: ['.sql'] }]],
    }
}
