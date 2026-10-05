export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const nextIdle = () => new Promise(resolve => requestIdleCallback(resolve))

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

// Unistyles commits theme changes synchronously, React work scheduled by them (listeners, re-renders, ref callbacks)
// is done after two idle callbacks, the frames let the native side mount it
export const settle = async () => {
    await nextIdle()
    await nextIdle()
    await nextFrame()
    await nextFrame()
}
