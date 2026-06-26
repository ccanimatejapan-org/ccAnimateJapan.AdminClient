<script setup>
import { ref } from 'vue'
import { PERIOD_PRESETS, buildPeriod } from '@/utils/reports/reportPeriods'

const props = defineProps({
  period: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['change'])

const customStart = ref('')
const customEnd = ref('')

const selectPreset = (key) => {
  if (key === 'custom') {
    emit('change', buildPeriod('custom', customStart.value, customEnd.value))
    return
  }
  emit('change', buildPeriod(key))
}

const applyCustom = () => {
  if (!customStart.value || !customEnd.value) return
  emit('change', buildPeriod('custom', customStart.value, customEnd.value))
}
</script>

<template>
  <div class="report-filter">
    <div class="preset-row" role="group" aria-label="報表期間">
      <button
        v-for="preset in PERIOD_PRESETS"
        :key="preset.key"
        type="button"
        class="preset-btn"
        :class="{ 'preset-btn--active': period.key === preset.key }"
        @click="selectPreset(preset.key)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div v-if="period.key === 'custom'" class="custom-row">
      <label>
        <span>起</span>
        <input v-model="customStart" type="date" @change="applyCustom" />
      </label>
      <label>
        <span>迄</span>
        <input v-model="customEnd" type="date" @change="applyCustom" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.report-filter {
  display: grid;
  gap: 12px;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-btn {
  border: 1px solid #cdd6ea;
  border-radius: 999px;
  background: #ffffff;
  color: #44506e;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 7px 16px;
  cursor: pointer;
}

.preset-btn:hover {
  border-color: #5468a6;
}

.preset-btn--active {
  border-color: #5468a6;
  background: #eef1fb;
  color: #2f3c66;
}

.custom-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.custom-row label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #59665f;
  font-size: 0.88rem;
}

.custom-row input {
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 7px 10px;
}
</style>
