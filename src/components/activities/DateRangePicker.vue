<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
  rangeLabel: {
    type: String,
    required: true,
  },
  monthLabel: {
    type: String,
    required: true,
  },
  weekdays: {
    type: Array,
    required: true,
  },
  days: {
    type: Array,
    required: true,
  },
  startLabel: {
    type: String,
    required: true,
  },
  endLabel: {
    type: String,
    required: true,
  },
  isDayStart: {
    type: Function,
    required: true,
  },
  isDayEnd: {
    type: Function,
    required: true,
  },
  isDayInRange: {
    type: Function,
    required: true,
  },
  isDaySelected: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['toggle', 'shift', 'select', 'close'])
const rootElement = ref(null)

const handlePointerDown = (event) => {
  if (!props.open) return
  if (rootElement.value?.contains(event.target)) return
  emit('close')
}

const handleEscapeKey = (event) => {
  if (!props.open || event.key !== 'Escape') return
  emit('close')
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown)
  document.addEventListener('keydown', handleEscapeKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<template>
  <div class="date-range-field">
    <span class="date-range-label">{{ label }}</span>
    <div ref="rootElement" class="date-range-picker" :class="{ 'is-open': open }">
      <button class="date-range-trigger" type="button" @click="emit('toggle')">
        <span>{{ rangeLabel }}</span>
        <span aria-hidden="true">v</span>
      </button>
      <div v-if="open" class="date-range-menu">
        <div class="calendar-header">
          <button
            class="calendar-nav-button"
            type="button"
            aria-label="上一個月份"
            @click="emit('shift', -1)"
          >
            &lt;
          </button>
          <strong>{{ monthLabel }}</strong>
          <button
            class="calendar-nav-button"
            type="button"
            aria-label="下一個月份"
            @click="emit('shift', 1)"
          >
            &gt;
          </button>
        </div>
        <div class="calendar-weekdays" aria-hidden="true">
          <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
        </div>
        <div class="calendar-grid">
          <button
            v-for="day in days"
            :key="day.key"
            class="calendar-day"
            type="button"
            :class="{
              'is-empty': !day.date,
              'is-start': isDayStart(day.date),
              'is-end': isDayEnd(day.date),
              'is-in-range': isDayInRange(day.date),
            }"
            :disabled="!day.date"
            :aria-pressed="isDaySelected(day.date)"
            @click="emit('select', day.date)"
          >
            {{ day.day }}
          </button>
        </div>
        <div class="calendar-range-summary">
          <span><strong>開始</strong>{{ startLabel }}</span>
          <span><strong>結束</strong>{{ endLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-range-field {
  --date-range-label-color: #4e443d;
  --date-range-label-size: 0.94rem;
  --date-range-label-weight: 650;
  display: grid;
  gap: 8px;
  align-content: start;
  min-width: 0;
  margin: 0;
  grid-column: 1 / -1;
  border: 0;
  padding: 0;
  color: var(--date-range-label-color);
  font-size: var(--date-range-label-size);
  font-weight: var(--date-range-label-weight);
}

.date-range-label {
  margin: 0;
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  font-weight: inherit;
  line-height: 1.4;
}

.date-range-picker {
  position: relative;
}

.date-range-trigger {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #fffdf9;
  color: #2a2825;
  font: inherit;
  padding: 0 12px;
  text-align: left;
}

.date-range-trigger span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-range-trigger span:last-child {
  color: #8a6c61;
  font-size: 0.82rem;
  font-weight: 800;
}

.date-range-trigger:hover,
.date-range-picker.is-open .date-range-trigger {
  border-color: #b84d55;
  box-shadow: 0 0 0 3px rgb(184 77 85 / 12%);
}

.date-range-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  display: grid;
  width: min(100%, 390px);
  gap: 16px;
  border: 1px solid #eaded2;
  border-radius: 18px;
  background: #fffdf9;
  box-shadow: 0 24px 58px rgb(114 74 56 / 18%);
  padding: 18px;
}

.calendar-header {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 8px;
  color: #2a2825;
  text-align: center;
}

.calendar-header strong {
  font-size: 0.98rem;
  font-weight: 800;
}

.calendar-nav-button {
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #eaded2;
  border-radius: 999px;
  background: #fff8ef;
  color: #8f3f47;
  font-family: inherit;
  font-size: 1.1rem;
  line-height: 1;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.calendar-nav-button:hover,
.calendar-nav-button:focus-visible {
  border-color: #b84d55;
  background: #fff2ea;
  box-shadow: 0 0 0 3px rgb(184 77 85 / 12%);
  transform: translateY(-1px);
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.calendar-weekdays span {
  display: grid;
  min-height: 28px;
  place-items: center;
  color: #8a6c61;
  font-size: 0.78rem;
  font-weight: 800;
}

.calendar-day {
  position: relative;
  display: grid;
  min-width: 0;
  height: 40px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #3d3832;
  font-family: inherit;
  font-weight: 780;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.calendar-day:hover:not(:disabled),
.calendar-day:focus-visible:not(:disabled) {
  border-color: #b84d55;
  background: #fff3ed;
  box-shadow: 0 0 0 3px rgb(184 77 85 / 10%);
  transform: translateY(-1px);
}

.calendar-day.is-in-range {
  border-radius: 10px;
  background: #fff0ea;
  color: #8f3f47;
}

.calendar-day.is-start,
.calendar-day.is-end {
  border-color: #b84d55;
  border-radius: 999px;
  background: #b84d55;
  color: #fff;
  box-shadow: 0 10px 22px rgb(184 77 85 / 24%);
}

.calendar-day.is-empty {
  visibility: hidden;
}

.calendar-range-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.calendar-range-summary span {
  display: grid;
  gap: 3px;
  border: 1px solid #f0e2d6;
  border-radius: 12px;
  background: #fff8ef;
  color: #3d3832;
  padding: 10px 12px;
  font-size: 0.84rem;
  font-weight: 700;
}

.calendar-range-summary strong {
  color: #8f3f47;
  font-size: 0.74rem;
  font-weight: 800;
}

@media (max-width: 560px) {
  .date-range-menu {
    position: static;
    width: 100%;
    margin-top: 8px;
  }

  .calendar-range-summary {
    grid-template-columns: 1fr;
  }
}
</style>
