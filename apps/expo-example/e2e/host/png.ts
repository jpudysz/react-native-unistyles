/// <reference types="bun" />
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

export type Image = {
    width: number
    height: number
    channels: number
    pixels: Uint8Array
}

const CHANNELS: Record<number, number> = { 2: 3, 6: 4 }

const paeth = (left: number, up: number, upLeft: number) => {
    const estimate = left + up - upLeft
    const toLeft = Math.abs(estimate - left)
    const toUp = Math.abs(estimate - up)
    const toUpLeft = Math.abs(estimate - upLeft)

    if (toLeft <= toUp && toLeft <= toUpLeft) {
        return left
    }

    return toUp <= toUpLeft ? up : upLeft
}

const predict = (filter: number, left: number, up: number, upLeft: number) => {
    switch (filter) {
        case 1:
            return left
        case 2:
            return up
        case 3:
            return (left + up) >> 1
        case 4:
            return paeth(left, up, upLeft)
        default:
            return 0
    }
}

// Screenshots only: 8 bit RGB or RGBA, not interlaced
export const readPng = (path: string): Image => {
    const file = readFileSync(path)
    const width = file.readUInt32BE(16)
    const height = file.readUInt32BE(20)
    const channels = CHANNELS[file[25]!]

    if (file[24] !== 8 || channels === undefined || file[28] !== 0) {
        throw new Error(`Unsupported PNG ${path}`)
    }

    const chunks: Array<Buffer> = []

    for (let offset = 8; offset < file.length;) {
        const length = file.readUInt32BE(offset)

        if (file.toString('ascii', offset + 4, offset + 8) === 'IDAT') {
            chunks.push(file.subarray(offset + 8, offset + 8 + length))
        }

        offset += length + 12
    }

    const raw = inflateSync(Buffer.concat(chunks))
    const stride = width * channels
    const pixels = new Uint8Array(stride * height)

    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)]!
        const row = y * stride

        for (let x = 0; x < stride; x++) {
            const value = raw[y * (stride + 1) + 1 + x]!
            const left = x >= channels ? pixels[row + x - channels]! : 0
            const up = y > 0 ? pixels[row - stride + x]! : 0
            const upLeft = x >= channels && y > 0 ? pixels[row - stride + x - channels]! : 0

            pixels[row + x] = (value + predict(filter, left, up, upLeft)) & 0xff
        }
    }

    return { width, height, channels, pixels }
}

// Average color of a square around a normalized point, avoids antialiased edges
export const sampleColor = (image: Image, x: number, y: number, radius = 3) => {
    const centerX = Math.round(x * image.width)
    const centerY = Math.round(y * image.height)
    const sum = [0, 0, 0]
    let count = 0

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const offset = ((centerY + dy) * image.width + centerX + dx) * image.channels

            sum[0] += image.pixels[offset]!
            sum[1] += image.pixels[offset + 1]!
            sum[2] += image.pixels[offset + 2]!
            count++
        }
    }

    return sum.map(value => Math.round(value / count)) as [number, number, number]
}

export const parseHex = (hex: string) => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)) as [number, number, number]

export const toHex = (color: Array<number>) => `#${color.map(value => value.toString(16).padStart(2, '0')).join('')}`

export const colorDistance = (a: Array<number>, b: Array<number>) => Math.max(...a.map((value, index) => Math.abs(value - b[index]!)))
