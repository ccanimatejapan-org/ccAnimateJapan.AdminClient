<script setup>
import ActivityImagePicker from '@/modules/activity/components/ActivityImagePicker.vue'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import DateRangePicker from '@/modules/activity/components/DateRangePicker.vue'
import RichHtmlEditor from '@/shared/components/RichHtmlEditor.vue'
import AppButton from '@/shared/components/AppButton.vue'
import FormField from '@/shared/components/FormField.vue'
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import {
  ShippingMode,
  shippingModeOptions,
  shippingShareRuleOptions,
  groupBuyStatusOptions,
  toShippingModeText,
  toShippingShareRuleText,
  toGroupBuyStatusText,
} from '@/modules/activity/utils/activityMapper'

defineProps({
  form: {
    type: Object,
    required: true,
  },
  editingActivityId: {
    type: [Number, String],
    default: null,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  deletingActivityId: {
    type: [Number, String],
    default: null,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  activityTypes: {
    type: Array,
    required: true,
  },
  animateTypes: {
    type: Array,
    required: true,
  },
  activityStatusOptions: {
    type: Array,
    required: true,
  },
  isLoadingActivityTypes: {
    type: Boolean,
    default: false,
  },
  isLoadingAnimateTypes: {
    type: Boolean,
    default: false,
  },
  selectedImageFile: {
    type: Object,
    default: null,
  },
  activityImagePreview: {
    type: String,
    default: '',
  },
  calendarWeekdays: {
    type: Array,
    required: true,
  },
  isRangeOpen: {
    type: Function,
    required: true,
  },
  getActivityRangeLabel: {
    type: Function,
    required: true,
  },
  getPrepRangeLabel: {
    type: Function,
    required: true,
  },
  getRangeMonthLabel: {
    type: Function,
    required: true,
  },
  getRangeCalendarDays: {
    type: Function,
    required: true,
  },
  isRangeDayStart: {
    type: Function,
    required: true,
  },
  isRangeDayEnd: {
    type: Function,
    required: true,
  },
  isRangeDayInRange: {
    type: Function,
    required: true,
  },
  isRangeDaySelected: {
    type: Function,
    required: true,
  },
  getRangeStartLabel: {
    type: Function,
    required: true,
  },
  getRangeEndLabel: {
    type: Function,
    required: true,
  },
  isSelectOpen: {
    type: Function,
    required: true,
  },
  getActivityTypeSelectLabel: {
    type: Function,
    required: true,
  },
  getAnimateTypeSelectLabel: {
    type: Function,
    required: true,
  },
  getStatusSelectLabel: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'close',
  'submit',
  'delete',
  'toggle-range',
  'shift-range',
  'select-range-date',
  'close-range',
  'toggle-select',
  'select-option',
  'image-change',
])
</script>

<template>
  <div class="modal-backdrop">
    <form class="activity-dialog" novalidate @submit.prevent="$emit('submit')">
      <div class="dialog-heading">
        <div>
          <h2>{{ editingActivityId ? '編輯活動' : '新增活動' }}</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <div class="activity-form-grid">
        <FormField label="活動名稱" soft full>
          <input v-model="form.name" required placeholder="活動名稱" />
        </FormField>
        <FormField label="活動地址" soft full>
          <input v-model="form.address" placeholder="活動地址" />
        </FormField>
        <DateRangePicker
          label="活動期間"
          :open="isRangeOpen('activity')"
          :range-label="getActivityRangeLabel()"
          :month-label="getRangeMonthLabel('activity')"
          :weekdays="calendarWeekdays"
          :days="getRangeCalendarDays('activity')"
          :start-label="getRangeStartLabel('activity')"
          :end-label="getRangeEndLabel('activity')"
          :is-day-start="(date) => isRangeDayStart('activity', date)"
          :is-day-end="(date) => isRangeDayEnd('activity', date)"
          :is-day-in-range="(date) => isRangeDayInRange('activity', date)"
          :is-day-selected="(date) => isRangeDaySelected('activity', date)"
          @toggle="$emit('toggle-range', 'activity')"
          @shift="$emit('shift-range', 'activity', $event)"
          @select="$emit('select-range-date', 'activity', $event)"
          @close="$emit('close-range')"
        />
        <DateRangePicker
          v-if="!form.isPreOrder"
          label="準備期間"
          :open="isRangeOpen('prep')"
          :range-label="getPrepRangeLabel()"
          :month-label="getRangeMonthLabel('prep')"
          :weekdays="calendarWeekdays"
          :days="getRangeCalendarDays('prep')"
          :start-label="getRangeStartLabel('prep')"
          :end-label="getRangeEndLabel('prep')"
          :is-day-start="(date) => isRangeDayStart('prep', date)"
          :is-day-end="(date) => isRangeDayEnd('prep', date)"
          :is-day-in-range="(date) => isRangeDayInRange('prep', date)"
          :is-day-selected="(date) => isRangeDaySelected('prep', date)"
          @toggle="$emit('toggle-range', 'prep')"
          @shift="$emit('shift-range', 'prep', $event)"
          @select="$emit('select-range-date', 'prep', $event)"
          @close="$emit('close-range')"
        />
        <FormField as="div" label="活動狀態">
          <CustomSelect
            :label="getStatusSelectLabel()"
            :open="isSelectOpen('status')"
            @toggle="$emit('toggle-select', 'status')"
          >
            <button
              v-for="statusOption in activityStatusOptions"
              :key="statusOption.value"
              class="custom-select-option"
              type="button"
              @click="$emit('select-option', 'status', statusOption.value)"
            >
              {{ statusOption.label }}
            </button>
          </CustomSelect>
        </FormField>
        <FormField as="div" label="活動模式" soft>
          <label class="preorder-switch">
            <input v-model="form.isPreOrder" type="checkbox" />
            <span class="preorder-switch-track" aria-hidden="true">
              <span class="preorder-switch-thumb"></span>
            </span>
            <span class="preorder-switch-text">{{ form.isPreOrder ? '預購' : '現貨' }}</span>
          </label>
        </FormField>

        <!-- 運費 / 開團設定（Step 1：假資料試 UX） -->
        <FormField as="div" label="運費模式">
          <CustomSelect
            :label="toShippingModeText(form.shippingMode)"
            :open="isSelectOpen('shippingMode')"
            @toggle="$emit('toggle-select', 'shippingMode')"
          >
            <button
              v-for="modeOption in shippingModeOptions"
              :key="modeOption.value"
              class="custom-select-option"
              type="button"
              @click="$emit('select-option', 'shippingMode', modeOption.value)"
            >
              {{ modeOption.label }}
            </button>
          </CustomSelect>
        </FormField>
        <FormField as="div" label="開團狀態">
          <CustomSelect
            v-if="form.isPreOrder"
            :label="toGroupBuyStatusText(form.groupBuyStatus)"
            :open="isSelectOpen('groupBuyStatus')"
            @toggle="$emit('toggle-select', 'groupBuyStatus')"
          >
            <button
              v-for="statusOption in groupBuyStatusOptions"
              :key="statusOption.value"
              class="custom-select-option"
              type="button"
              @click="$emit('select-option', 'groupBuyStatus', statusOption.value)"
            >
              {{ statusOption.label }}
            </button>
          </CustomSelect>
          <div v-else class="readonly-field">不需開團（現貨）</div>
        </FormField>

        <!-- A：境內固定運費 -->
        <template v-if="form.shippingMode === ShippingMode.PerItemPrepaid">
          <FormField label="每件預收運費" soft>
            <input v-model.number="form.perItemShipping" type="number" min="0" step="1" placeholder="每件加收的運費（元）" />
          </FormField>
          <FormField label="運費成本（活動一筆）" soft>
            <input v-model.number="form.shippingCost" type="number" min="0" step="1" placeholder="實際支付物流的運費（元）" />
          </FormField>
          <FormField v-if="form.isPreOrder" label="成團數量（件）" soft>
            <input v-model.number="form.groupBuyThreshold" type="number" min="0" step="1" placeholder="達此件數才成團" />
          </FormField>
        </template>

        <!-- B：滿額免運 -->
        <template v-else-if="form.shippingMode === ShippingMode.FreeOverAmount">
          <FormField label="免運門檻（採購總額）" soft>
            <input v-model.number="form.freeShippingThreshold" type="number" min="0" step="1" placeholder="採購總額達此值免運（元）" />
          </FormField>
        </template>

        <!-- C：買了就免運 -->
        <template v-else>
          <FormField v-if="form.isPreOrder" label="開團數量（件）" soft>
            <input v-model.number="form.groupBuyThreshold" type="number" min="0" step="1" placeholder="達此件數才開團" />
          </FormField>
        </template>

        <!-- 補運費設定（境內固定運費 / 滿額免運 適用） -->
        <template v-if="form.shippingMode === ShippingMode.PerItemPrepaid || form.shippingMode === ShippingMode.FreeOverAmount">
          <FormField as="div" label="允許顧客補運費" soft>
            <label class="preorder-switch">
              <input v-model="form.allowCustomerShippingTopUp" type="checkbox" />
              <span class="preorder-switch-track" aria-hidden="true">
                <span class="preorder-switch-thumb"></span>
              </span>
              <span class="preorder-switch-text">{{ form.allowCustomerShippingTopUp ? '允許' : '不允許' }}</span>
            </label>
          </FormField>
          <FormField as="div" label="分攤規則">
            <CustomSelect
              :label="toShippingShareRuleText(form.shippingShareRule)"
              :open="isSelectOpen('shippingShareRule')"
              @toggle="$emit('toggle-select', 'shippingShareRule')"
            >
              <button
                v-for="ruleOption in shippingShareRuleOptions"
                :key="ruleOption.value"
                class="custom-select-option"
                type="button"
                @click="$emit('select-option', 'shippingShareRule', ruleOption.value)"
              >
                {{ ruleOption.label }}
              </button>
            </CustomSelect>
          </FormField>
        </template>

        <FormField as="div" label="活動類型">
          <CustomSelect
            :label="getActivityTypeSelectLabel()"
            :open="isSelectOpen('activityTypeId')"
            :disabled="isLoadingActivityTypes"
            @toggle="$emit('toggle-select', 'activityTypeId', isLoadingActivityTypes)"
          >
            <button class="custom-select-option" type="button" @click="$emit('select-option', 'activityTypeId', '')">
              請選擇活動類型
            </button>
            <button
              v-for="activityType in activityTypes"
              :key="activityType.id"
              class="custom-select-option"
              type="button"
              @click="$emit('select-option', 'activityTypeId', activityType.id)"
            >
              {{ activityType.name || `#${activityType.id}` }}
            </button>
          </CustomSelect>
        </FormField>
        <FormField as="div" label="動漫">
          <CustomSelect
            :label="getAnimateTypeSelectLabel()"
            :open="isSelectOpen('animateTypeId')"
            :disabled="isLoadingAnimateTypes"
            @toggle="$emit('toggle-select', 'animateTypeId', isLoadingAnimateTypes)"
          >
            <button class="custom-select-option" type="button" @click="$emit('select-option', 'animateTypeId', '')">
              請選擇動漫
            </button>
            <button
              v-for="animateType in animateTypes"
              :key="animateType.id"
              class="custom-select-option"
              type="button"
              @click="$emit('select-option', 'animateTypeId', animateType.id)"
            >
              {{ animateType.name || `#${animateType.id}` }}
            </button>
          </CustomSelect>
        </FormField>
        <FormField as="div" label="活動圖片（上傳最大 5MB）" full>
          <ActivityImagePicker
            :selected-file-name="selectedImageFile?.name || ''"
            :preview="activityImagePreview"
            @change="$emit('image-change', $event)"
          />
        </FormField>
        <FormField as="div" label="備註" full>
          <RichHtmlEditor v-model="form.info" placeholder="活動備註" />
        </FormField>
      </div>

      <MessageBlock v-if="errorMessage">{{ errorMessage }}</MessageBlock>

      <div class="dialog-actions">
        <AppButton
          v-if="editingActivityId"
          class="danger-dialog-button delete-dialog-button--muted"
          pill
          :disabled="isSaving || deletingActivityId === editingActivityId"
          @click="$emit('delete')"
        >
          {{ deletingActivityId === editingActivityId ? '刪除中...' : '刪除' }}
        </AppButton>
        <AppButton pill :disabled="isSaving" @click="$emit('close')">取消</AppButton>
        <AppButton variant="primary" pill elevated type="submit" :disabled="isSaving">
          {{ isSaving ? '儲存中...' : '儲存' }}
        </AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgb(19 32 28 / 46%);
  padding: 24px;
}

.activity-dialog {
  display: grid;
  align-content: start;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  width: min(100%, 760px);
  height: 80vh;
  max-height: 80vh;
  overflow: hidden;
  gap: 20px;
  border: 1px solid #eaded2;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(255 250 244 / 98%)),
    #ffffff;
  box-shadow: 0 26px 76px rgb(114 74 56 / 22%);
  padding: 28px;
}

.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #f0e5dc;
  padding-bottom: 16px;
}

.dialog-heading h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.45rem;
  line-height: 1.25;
}

.activity-form-grid {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
  gap: 16px;
}

.preorder-switch {
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: 12px;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #fffdf9;
  padding: 0 13px;
}

.preorder-switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.preorder-switch-track {
  position: relative;
  display: inline-flex;
  width: 46px;
  height: 26px;
  flex: 0 0 auto;
  align-items: center;
  border-radius: 999px;
  background: #dce5df;
  transition: background 0.18s ease;
}

.preorder-switch-thumb {
  position: absolute;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 3px 8px rgb(19 32 28 / 18%);
  transition: transform 0.18s ease;
}

.preorder-switch input:checked + .preorder-switch-track {
  background: #b84d55;
}

.preorder-switch input:checked + .preorder-switch-track .preorder-switch-thumb {
  transform: translateX(20px);
}

.preorder-switch input:focus-visible + .preorder-switch-track {
  box-shadow: 0 0 0 3px rgb(184 77 85 / 15%);
}

.preorder-switch-text {
  color: #384942;
  font-weight: 800;
}

.readonly-field {
  display: flex;
  min-height: 46px;
  align-items: center;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #f6f1ea;
  color: #6b5f54;
  padding: 0 13px;
  font-weight: 700;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.danger-dialog-button {
  margin-right: auto;
}

.delete-dialog-button--muted.app-button--pill {
  border-color: #d6dde3;
  background: #eef1f3;
  color: #4b5563;
}

.delete-dialog-button--muted.app-button--pill:hover:not(:disabled) {
  border-color: #b9c2ca;
  background: #e2e7ea;
  color: #374151;
}

@media (max-width: 560px) {
  .activity-dialog {
    padding: 18px;
  }

  .activity-form-grid {
    grid-template-columns: 1fr;
    padding-right: 2px;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .danger-dialog-button {
    margin-right: 0;
  }
}
</style>
