const presses = new Map<string, number>()

// Counted outside React state: a press must not re-render the screen, otherwise every wrapper re-links and hides
// what the component itself rendered below Unistyles
export const countPress = (testID: string) => {
    presses.set(testID, getPresses(testID) + 1)
}

export const getPresses = (testID: string) => presses.get(testID) ?? 0
