<script setup>
defineProps({
  as: {
    type: String,
    default: 'label',
  },
  label: {
    type: String,
    default: '',
  },
  full: {
    type: Boolean,
    default: false,
  },
  checkbox: {
    type: Boolean,
    default: false,
  },
  soft: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <component
    :is="as"
    class="form-field"
    :class="{
      'form-field--full': full,
      'form-field--checkbox': checkbox,
      'form-field--soft': soft,
    }"
  >
    <span v-if="label">{{ label }}</span>
    <slot />
  </component>
</template>

<style scoped>
.form-field {
  display: grid;
  gap: 8px;
  color: #4e443d;
  font-size: 0.94rem;
  font-weight: 650;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field--checkbox {
  min-height: 72px;
  align-items: start;
  justify-content: center;
}

.form-field :slotted(input),
.form-field :slotted(select),
.form-field :slotted(textarea) {
  width: 100%;
  min-height: 46px;
  border: 1px solid #e2d2c7;
  border-radius: 8px;
  background: #fffaf4;
  color: #2a2825;
  outline: none;
  padding: 0 13px;
}

.form-field :slotted(textarea) {
  resize: vertical;
  padding: 12px 13px;
}

.form-field :slotted(input:focus),
.form-field :slotted(select:focus),
.form-field :slotted(textarea:focus) {
  border-color: #b84d55;
  box-shadow: 0 0 0 3px rgb(184 77 85 / 15%);
}

.form-field--checkbox :slotted(input) {
  width: 18px;
  height: 18px;
  min-height: 0;
  accent-color: #b84d55;
}

.form-field--soft :slotted(input),
.form-field--soft :slotted(select),
.form-field--soft :slotted(textarea) {
  border-color: #eaded2;
  border-radius: 10px;
  background: #fffdf9;
}
</style>
