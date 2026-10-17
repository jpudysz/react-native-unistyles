import { getMediaQuery } from '../web/utils/unistyle'

jest.mock('../web/services', () => ({
    services: {
        runtime: {
            breakpoints: { xs: 0, sm: 576, md: 768, lg: 992 },
        },
    },
}))

describe('getMediaQuery for named breakpoints', () => {
    it('ends each range 0.02px below the next breakpoint so fractional viewport widths always match one range', () => {
        expect(getMediaQuery('xs', ['xs', 'md'])).toBe('@media (min-width: 0px) and (max-width: 767.98px)')
        expect(getMediaQuery('md', ['xs', 'md'])).toBe('@media (min-width: 768px)')
    })

    it('closes the range at the next breakpoint the style actually uses', () => {
        expect(getMediaQuery('xs', ['xs', 'lg'])).toBe('@media (min-width: 0px) and (max-width: 991.98px)')
        expect(getMediaQuery('sm', ['sm', 'md', 'lg'])).toBe('@media (min-width: 576px) and (max-width: 767.98px)')
        expect(getMediaQuery('lg', ['sm', 'md', 'lg'])).toBe('@media (min-width: 992px)')
    })
})
