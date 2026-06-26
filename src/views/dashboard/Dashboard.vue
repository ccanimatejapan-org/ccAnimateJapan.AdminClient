<script setup>
import { useRouter } from 'vue-router'
import DashboardModuleCard from '@/components/dashboard/DashboardModuleCard.vue'
import PageShell from '@/components/layout/PageShell.vue'

const router = useRouter()

const iconPaths = {
  calendar: [
    'M8 3v4',
    'M16 3v4',
    'M4 9h16',
    'M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  ],
  inventory: [
    'M12 3 21 8l-9 5-9-5 9-5Z',
    'M3 8v8l9 5 9-5V8',
    'M12 13v8',
  ],
  receipt: [
    'M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z',
    'M8 8h8',
    'M8 12h8',
    'M8 16h5',
  ],
  chart: [
    'M5 19V9',
    'M12 19V5',
    'M19 19v-8',
    'M3 19h18',
  ],
  art: [
    'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
    'M3 16l5-4 4 3 3-2 6 5',
    'M9 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  ],
}

const modules = [
  {
    title: '活動管理',
    icon: 'calendar',
    accent: '#b84d55',
    path: '/activities',
  },
  {
    title: '作品管理',
    icon: 'art',
    accent: '#7a5bb0',
    path: '/animate-types',
  },
  {
    title: '庫存管理',
    icon: 'inventory',
    accent: '#277867',
    path: '/inventory',
  },
  {
    title: '訂單管理',
    icon: 'receipt',
    accent: '#c48445',
    path: '/orders',
  },
  {
    title: '報表分析',
    icon: 'chart',
    accent: '#5468a6',
    path: '/reports',
  },
]

const openModule = (module) => {
  if (module.path) {
    router.push(module.path)
  }
}
</script>

<template>
  <PageShell>
    <div class="module-grid" aria-label="後台功能入口">
      <DashboardModuleCard
        v-for="module in modules"
        :key="module.title"
        :module="module"
        :icon-paths="iconPaths[module.icon]"
        @open="openModule"
      />
    </div>
  </PageShell>
</template>

<style scoped>
.module-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 860px) {
  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
