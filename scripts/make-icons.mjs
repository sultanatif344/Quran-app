// Generates public/icon-192.png and public/icon-512.png (chestnut square, gold crescent)
// with no dependencies — a tiny PNG encoder using Node's zlib.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'public')
mkdirSync(out, { recursive: true })

const BG = [0x5c, 0x2e, 0x1b]
const GOLD = [0xb9, 0x8a, 0x3c]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function render(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  const cx = size / 2
  const cy = size / 2
  const rOuter = size * 0.32
  const cx2 = size * 0.61
  const cy2 = size * 0.45
  const rInner = size * 0.27
  const corner = size * 0.2
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      // rounded-corner mask (transparent corners are avoided for maskable icons; keep bg square)
      let px = BG
      const inOuter = (x - cx) ** 2 + (y - cy) ** 2 <= rOuter ** 2
      const inInner = (x - cx2) ** 2 + (y - cy2) ** 2 <= rInner ** 2
      if (inOuter && !inInner) px = GOLD
      void corner
      const o = y * (size * 3 + 1) + 1 + x * 3
      raw[o] = px[0]
      raw[o + 1] = px[1]
      raw[o + 2] = px[2]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  writeFileSync(join(out, `icon-${size}.png`), render(size))
  console.log(`wrote icon-${size}.png`)
}
