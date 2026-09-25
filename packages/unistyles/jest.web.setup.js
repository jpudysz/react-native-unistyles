// jsdom doesn't implement matchMedia and ResizeObserver
window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}
window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
})
