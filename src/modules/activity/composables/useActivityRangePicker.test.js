import { reactive } from 'vue'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { useActivityRangePicker } from './useActivityRangePicker.js'

const createForm = (overrides = {}) =>
  reactive({
    activityStartDate: '',
    activityEndDate: '',
    officialShippingStartDate: '',
    officialShippingEndDate: '',
    ...overrides,
  })

test('activity range picker sets activity end time to 20:00 when selecting end date', () => {
  const form = createForm()
  const { selectRangeDate } = useActivityRangePicker(form)

  const startCompleted = selectRangeDate('activity', '2024-05-01')
  const endCompleted = selectRangeDate('activity', '2024-05-05')

  assert.equal(startCompleted, false)
  assert.equal(endCompleted, true)
  assert.equal(form.activityStartDate, '2024-05-01T00:00')
  assert.equal(form.activityEndDate, '2024-05-05T20:00')
})

test('official shipping range picker keeps official shipping end time at 23:59', () => {
  const form = createForm()
  const { selectRangeDate } = useActivityRangePicker(form)

  const startCompleted = selectRangeDate('officialShipping', '2024-05-01')
  const endCompleted = selectRangeDate('officialShipping', '2024-05-05')

  assert.equal(startCompleted, false)
  assert.equal(endCompleted, true)
  assert.equal(form.officialShippingStartDate, '2024-05-01T00:00')
  assert.equal(form.officialShippingEndDate, '2024-05-05T23:59')
})

test('activity range picker keeps 20:00 end time after reversed selection', () => {
  const form = createForm()
  const { selectRangeDate } = useActivityRangePicker(form)

  selectRangeDate('activity', '2024-05-10')
  const completed = selectRangeDate('activity', '2024-05-05')

  assert.equal(completed, true)
  assert.equal(form.activityStartDate, '2024-05-05T00:00')
  assert.equal(form.activityEndDate, '2024-05-10T20:00')
})

test('custom activity filter range can keep an end-of-day boundary', () => {
  const form = reactive({
    activityDateStart: '',
    activityDateEnd: '',
  })
  const { selectRangeDate } = useActivityRangePicker(form, {
    rangeFieldKeys: {
      activity: {
        start: 'activityDateStart',
        end: 'activityDateEnd',
        endTime: '23:59',
      },
    },
  })

  selectRangeDate('activity', '2024-05-01')
  const completed = selectRangeDate('activity', '2024-05-05')

  assert.equal(completed, true)
  assert.equal(form.activityDateStart, '2024-05-01T00:00')
  assert.equal(form.activityDateEnd, '2024-05-05T23:59')
})
