import type { StyleSheet } from '../types'
import { mq, parseStyle, proxifyFunction } from '../utils'
import { mockRegistry, mockRuntime } from './mocks'

jest.mock('../core', () => {
    class MockedUnistyles {
        registry = {
            plugins: []
        }
        runtime = {}
    }

    return {
        unistyles: new MockedUnistyles()
    }
})

describe('styles', () => {
    describe('proxifyFunction', () => {
        afterEach(() => {
            jest.restoreAllMocks()
        })

        it('should parse style for dynamic function', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })
            unistyles.registry = mockRegistry()
            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: {
                    sm: isEven
                        ? 'green'
                        : 'red',
                    md: isEven
                        ? 'orange'
                        : 'pink'
                }
            })

            const result = proxifyFunction(
                'container',
                dynamicFunction,
                [],
                unistyles.runtime
            )(true)

            expect(result).toEqual({
                backgroundColor: 'green'
            })
        })

        it('should return proxified function for custom media query', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: {
                    [mq.only.width(null, 399)]: isEven
                        ? 'green'
                        : 'red',
                    [mq.only.width(400)]: isEven
                        ? 'orange'
                        : 'pink'
                }
            })
            const result = proxifyFunction(
                'container',
                dynamicFunction,
                [],
                unistyles.runtime
            )(false)

            expect(result).toEqual({
                backgroundColor: 'pink'
            })
        })

        it('should return same function for no breakpoints nor media queries', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: isEven
                    ? 'pink'
                    : 'purple'
            })
            const result = proxifyFunction(
                'container',
                dynamicFunction,
                [],
                unistyles.runtime
            )(false)

            expect(result).toEqual({
                backgroundColor: 'purple'
            })
        })
    })

    describe('parseStyle', () => {
        it('should correctly parse styles', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

            const style = {
                fontSize: {
                    sm: 12,
                    md: 20
                },
                backgroundColor: {
                    xs: 'pink',
                    md: 'orange'
                },
                fontWeight: 'bold'
            }
            const parsedStyles = parseStyle(
                'container',
                style as StyleSheet,
                [],
                unistyles.runtime
            )

            expect(parsedStyles).toEqual({
                fontSize: 12,
                backgroundColor: 'pink',
                fontWeight: 'bold'
            })
        })

        it('should correctly parse transform styles', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

            const style = {
                transform: [
                    {
                        translateX: {
                            sm: 120,
                            md: 200
                        },
                        translateY: 200
                    }
                ]
            }

            const parsedStyles = parseStyle(
                'container',
                style as StyleSheet,
                [],
                unistyles.runtime
            )

            expect(parsedStyles).toEqual({
                transform: [
                    {
                        translateX: 120,
                        translateY: 200
                    }
                ]
            })
        })

        it('should correctly parse shadowOffset styles', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

            const style = {
                shadowOffset: {
                    width: 0,
                    height: 4
                }
            }
            const styleWithBreakpoints = {
                shadowOffset: {
                    width: 0,
                    height: {
                        sm: 10,
                        md: 20
                    }
                }
            }
            const parsedStyles = parseStyle(
                'container',
                style as StyleSheet,
                [],
                unistyles.runtime
            )
            const parsedStylesWithBreakpoints = parseStyle(
                'container',
                styleWithBreakpoints as StyleSheet,
                [],
                unistyles.runtime
            )

            expect(parsedStyles).toEqual({
                shadowOffset: {
                    width: 0,
                    height: 4
                }
            })
            expect(parsedStylesWithBreakpoints).toEqual({
                shadowOffset: {
                    width: 0,
                    height: 10
                }
            })
        })
    })
})
