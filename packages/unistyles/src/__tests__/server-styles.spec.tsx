import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StyleSheet } from 'react-native'

import { getServerUnistylesStyle } from '../core/ServerUnistylesStyle'
import { getServerUnistyles, ServerUnistylesStyles } from '../server'
import * as unistyles from '../web/services'
import { getStyleResourceId, setStyleResourceId } from '../web/styleResource'

describe('ServerUnistylesStyles', () => {
    beforeEach(() => {
        unistyles.services.registry.reset()
    })

    it('flushes collected styles into a style element', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_server',
            propertyKey: 'backgroundColor',
            value: 'tomato',
        })

        const markup = renderToStaticMarkup(<ServerUnistylesStyles nonce="test-nonce" />)

        expect(markup).toBe('<style nonce="test-nonce">.unistyles_server{background-color:tomato;}</style>')
        expect(unistyles.services.registry.css.getStyles()).toBe('')
    })

    it('does not render an empty style element', () => {
        expect(ServerUnistylesStyles({})).toBeNull()
    })

    it('anchors future RSC resources before the mutable browser stylesheet', () => {
        const markup = renderToStaticMarkup(getServerUnistyles({ includeRNWStyles: false }))
        const anchorIndex = markup.indexOf('id="unistyles-resource-anchor"')
        const runtimeStyleIndex = markup.indexOf('id="unistyles-web"')

        expect(anchorIndex).toBeGreaterThan(-1)
        expect(runtimeStyleIndex).toBeGreaterThan(anchorIndex)
    })

    it('keeps legacy RNW output by default and layers it for RSC adapters', () => {
        const originalGetSheetDescriptor = Object.getOwnPropertyDescriptor(StyleSheet, 'getSheet')

        Object.defineProperty(StyleSheet, 'getSheet', {
            configurable: true,
            value: () => ({
                textContent: '.css-view{position:relative;}.r-position-sticky{position:sticky;}',
            }),
        })

        let legacyMarkup = ''
        let layeredMarkup = ''

        try {
            legacyMarkup = renderToStaticMarkup(getServerUnistyles())
            layeredMarkup = renderToStaticMarkup(getServerUnistyles({ layerRNWStyles: true }))
        } finally {
            if (originalGetSheetDescriptor) {
                Object.defineProperty(StyleSheet, 'getSheet', originalGetSheetDescriptor)
            } else {
                Reflect.deleteProperty(StyleSheet, 'getSheet')
            }
        }

        expect(legacyMarkup).toContain(
            '<style id="rnw-style">.css-view{position:relative;}.r-position-sticky{position:sticky;}</style>',
        )
        expect(layeredMarkup).toContain(
            '@layer react-native-unistyles-rnw{.css-view{position:relative;}.r-position-sticky{position:sticky;}}',
        )
    })

    it('does not emit RSC resources during regular component SSR', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_client_ssr',
            propertyKey: 'color',
            value: 'tomato',
        })

        const Probe = () => getServerUnistylesStyle([[{ hash: 'unistyles_client_ssr' }, []]])

        expect(renderToStaticMarkup(<Probe />)).toBe('')
    })

    it('selects only rules owned by requested hashes', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_selected',
            propertyKey: 'backgroundColor',
            value: 'tomato',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_selected:first-child',
            propertyKey: 'color',
            value: 'white',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_selected > *',
            propertyKey: 'display',
            value: 'flex',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_other',
            propertyKey: 'color',
            value: 'black',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_selected',
            isMq: true,
            mediaQuery: '@media (min-width: 768px)',
            propertyKey: 'padding',
            value: '12px',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_other',
            isMq: true,
            mediaQuery: '@media (min-width: 768px)',
            propertyKey: 'padding',
            value: '24px',
        })

        expect(unistyles.services.registry.css.getStylesForHashes(['unistyles_selected'])).toBe(
            '.unistyles_selected{background-color:tomato;}' +
                '.unistyles_selected:first-child{color:white;}' +
                '.unistyles_selected > *{display:flex;}' +
                '@media (min-width: 768px){.unistyles_selected{padding:12px;}}',
        )
    })

    it('keeps normal and child resources independently addressable', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_shared',
            propertyKey: 'color',
            sourceHash: 'unistyles_shared',
            value: 'tomato',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_shared > *',
            propertyKey: 'display',
            sourceHash: 'unistyles_shared > *',
            value: 'flex',
        })

        const normalResource = unistyles.services.registry.css.getStylesheetResources(['unistyles_shared'])[0]!
        const childResource = unistyles.services.registry.css.getStylesheetResources(['unistyles_shared > *'])[0]!

        expect(normalResource.css).toBe('.unistyles_shared{color:tomato;}')
        expect(childResource.css).toBe('.unistyles_shared > *{display:flex;}')
        expect(normalResource.href).not.toBe(childResource.href)
        expect(unistyles.services.registry.css.getStylesheetResourcesForHashes(['unistyles_shared'])).toEqual([
            normalResource,
            childResource,
        ])
    })

    it('caches immutable resources and invalidates only their owner', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_cached',
            propertyKey: 'color',
            value: 'tomato',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_other',
            propertyKey: 'color',
            value: 'black',
        })

        const firstResource = unistyles.services.registry.css.getStylesheetResources(['unistyles_cached'])[0]!
        const sameResource = unistyles.services.registry.css.getStylesheetResources(['unistyles_cached'])[0]!
        const otherResource = unistyles.services.registry.css.getStylesheetResources(['unistyles_other'])[0]!

        expect(sameResource).toBe(firstResource)

        unistyles.services.registry.css.set({
            className: 'unistyles_cached',
            propertyKey: 'color',
            value: 'royalblue',
        })

        const updatedResource = unistyles.services.registry.css.getStylesheetResources(['unistyles_cached'])[0]!
        const sameOtherResource = unistyles.services.registry.css.getStylesheetResources(['unistyles_other'])[0]!

        expect(updatedResource).not.toBe(firstResource)
        expect(updatedResource.href).not.toBe(firstResource.href)
        expect(updatedResource.css).toContain('color:royalblue')
        expect(sameOtherResource).toBe(otherResource)
    })

    it('looks up a resource without scanning unrelated global rules', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_target',
            propertyKey: 'color',
            value: 'tomato',
        })

        for (let index = 0; index < 1000; index++) {
            unistyles.services.registry.css.set({
                className: `unistyles_unrelated_${index}`,
                propertyKey: 'color',
                value: 'black',
            })
        }

        const mainMapIterator = jest.spyOn(unistyles.services.registry.css.mainMap, Symbol.iterator)
        const mqMapIterator = jest.spyOn(unistyles.services.registry.css.mqMap, Symbol.iterator)

        expect(unistyles.services.registry.css.getStylesheetResources(['unistyles_target'])).toHaveLength(1)
        expect(mainMapIterator).not.toHaveBeenCalled()
        expect(mqMapIterator).not.toHaveBeenCalled()
    })

    it('removes pseudo and media rules without deleting an independent child owner', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_removed',
            propertyKey: 'color',
            value: 'tomato',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_removed:hover',
            propertyKey: 'color',
            value: 'royalblue',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_removed > *',
            propertyKey: 'display',
            value: 'flex',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_removed',
            isMq: true,
            mediaQuery: '@media (min-width: 768px)',
            propertyKey: 'padding',
            value: '12px',
        })

        unistyles.services.registry.css.remove('unistyles_removed')

        expect(unistyles.services.registry.css.getStyles()).toBe('.unistyles_removed > *{display:flex;}')
        expect(unistyles.services.registry.css.getStylesheetResources(['unistyles_removed'])).toEqual([])
        expect(unistyles.services.registry.css.getStylesheetResources(['unistyles_removed > *'])).toHaveLength(1)

        unistyles.services.registry.css.remove('unistyles_removed > *')

        expect(unistyles.services.registry.css.getStyles()).toBe('')
    })

    it('does not leave a child registration cached without its CSS', () => {
        const values = { color: 'tomato' }
        const normal = unistyles.services.registry.add(values)
        const child = unistyles.services.registry.add(values, true)

        unistyles.services.registry.css.remove(normal.hash)

        const childRemount = unistyles.services.registry.add(values, true)

        expect(childRemount).toEqual({ existingHash: true, hash: child.hash })
        expect(unistyles.services.registry.css.getStyles()).toContain(`.${child.hash}{color:tomato;}`)
    })

    it('replaces an owner without retaining stale declarations', () => {
        unistyles.services.registry.css.add('unistyles_updated', {
            color: 'tomato',
            _hover: {
                opacity: 0.5,
            },
        } as any)
        unistyles.services.registry.css.add('unistyles_updated', {
            backgroundColor: 'royalblue',
        })

        expect(unistyles.services.registry.css.getStyles()).toBe('.unistyles_updated{background-color:royalblue;}')
        expect(unistyles.services.registry.css.getStylesForHashes(['unistyles_updated'])).toBe(
            '.unistyles_updated{background-color:royalblue;}',
        )
    })

    it('rebuilds the exact resource index when hydrating serialized state', () => {
        unistyles.services.registry.css.set({
            className: 'unistyles_hydrated',
            propertyKey: 'color',
            value: 'tomato',
        })
        unistyles.services.registry.css.set({
            className: 'unistyles_hydrated:hover',
            propertyKey: 'opacity',
            value: 0.5,
        })
        const state = unistyles.services.registry.css.getState()

        unistyles.services.registry.css.reset()

        expect(unistyles.services.registry.css.getStylesheetResources(['unistyles_hydrated'])).toEqual([])

        unistyles.services.registry.css.hydrate(state)

        expect(unistyles.services.registry.css.getStylesheetResources(['unistyles_hydrated'])).toEqual([
            expect.objectContaining({
                css: '.unistyles_hydrated{color:tomato;}.unistyles_hydrated:hover{opacity:0.5;}',
            }),
        ])
    })

    it('keeps exact child resource metadata hidden from React Native Web', () => {
        const metadata = setStyleResourceId(
            { $$css: true, hash: 'unistyles_child', injectedClassName: '' },
            'unistyles_child > *',
        )

        expect(metadata.hash).not.toContain(' > *')
        expect(getStyleResourceId(metadata)).toBe('unistyles_child > *')
        expect(Object.keys(metadata)).toEqual(['$$css', 'hash', 'injectedClassName'])
        expect(Object.getOwnPropertySymbols(metadata)).toEqual([])
    })

    it('shares exact resource metadata across duplicate module evaluations', () => {
        const metadata = setStyleResourceId(
            { $$css: true, hash: 'unistyles_shared', injectedClassName: '' },
            'unistyles_shared > *',
        )

        jest.isolateModules(() => {
            const isolatedStyleResource = require('../web/styleResource') as typeof import('../web/styleResource')

            expect(isolatedStyleResource.getStyleResourceId(metadata)).toBe('unistyles_shared > *')
        })
    })
})
