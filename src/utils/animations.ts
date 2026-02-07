import type { CSSAnimationKeyframes } from 'react-native-reanimated'

const pulse: CSSAnimationKeyframes = {
    from: {
        transform: [{ scale: 0.8 }, { rotateZ: '-15deg' }],
    },
    to: {
        transform: [{ scale: 1.2 }, { rotateZ: '15deg' }],
    },
}

export const Animations = {
    pulse,
}
