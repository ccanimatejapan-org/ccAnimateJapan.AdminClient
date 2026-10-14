import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_IMPORT_IMAGE_FILES,
  buildImageManifest,
  buildImportPayload,
  getImageSetError,
  getRowStatus,
  mapPreviewResponse,
  mergeImageFiles,
  pickReferencedImageFiles,
} from './productImport.js'

const file = (name, size = 100, type = 'image/jpeg') => ({ name, size, type })

test('mergeImageFiles keeps supported images, replaces same name case-insensitively and counts skipped files', () => {
  const first = file('A001-1.jpg', 10)
  const replacement = file('a001-1.JPG', 20)
  const { files, skippedCount, duplicateCount } = mergeImageFiles([first], [replacement, file('A002.png'), file('.DS_Store'), file('readme.txt')])

  assert.equal(files.length, 2)
  assert.equal(files[0], replacement)
  assert.equal(skippedCount, 2)
  assert.equal(duplicateCount, 0)
  assert.equal(mergeImageFiles([], [file('x/A.jpg'.split('/')[1]), file('a.JPG')]).duplicateCount, 1)
})

test('getImageSetError enforces file count and total size limits', () => {
  assert.equal(getImageSetError([file('a.jpg')]), '')
  assert.match(getImageSetError(Array.from({ length: MAX_IMPORT_IMAGE_FILES + 1 }, (_, i) => file(`${i}.jpg`))), /最多上傳/)
  assert.match(getImageSetError([file('big.jpg', 201 * 1024 * 1024)]), /總大小/)
})

test('buildImageManifest sends only name, size and type', () => {
  assert.deepEqual(JSON.parse(buildImageManifest([file('a.jpg', 5, '')])), [{ name: 'a.jpg', size: 5, type: '' }])
})

test('mapPreviewResponse normalises rows and counts errors and warnings', () => {
  const preview = mapPreviewResponse({
    rows: [
      { rowNumber: 2, name: 'A', errors: [], warnings: [] },
      { rowNumber: 3, name: 'B', errors: ['x'], warnings: ['y'] },
      { rowNumber: 4, name: 'C', warnings: ['y'] },
    ],
    imageCount: 3,
    unusedImageFileNames: ['z.jpg'],
  })

  assert.equal(preview.totalCount, 3)
  assert.equal(preview.errorCount, 1)
  assert.equal(preview.warningCount, 1)
  assert.deepEqual(preview.rows[2].imageFileNames, [])
  assert.deepEqual(preview.rows.map(getRowStatus), ['ok', 'error', 'warning'])
  assert.deepEqual(preview.unusedImageFileNames, ['z.jpg'])
})

test('buildImportPayload and pickReferencedImageFiles only send what the rows use', () => {
  const rows = mapPreviewResponse({
    rows: [
      { rowNumber: 2, name: 'A', productTypeId: 1, japanCost: 100, rate: 0.2, price: 25, imageFileNames: ['A1.jpg', 'a2.png'] },
      { rowNumber: 3, name: 'B', productTypeId: 1, japanCost: 100, rate: 0.2, price: 25, imageFileNames: ['a1.JPG'] },
    ],
  }).rows
  const images = [file('a1.jpg'), file('A2.png'), file('unused.jpg')]

  const payload = buildImportPayload(rows)
  assert.deepEqual(payload.items[0].imageFileNames, ['A1.jpg', 'a2.png'])
  assert.equal(payload.items[1].rowNumber, 3)
  assert.deepEqual(pickReferencedImageFiles(rows, images).map((image) => image.name), ['a1.jpg', 'A2.png'])
})
