<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">LỊCH SỬ GIAO DỊCH</h2>
      <div class="mb-3">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm log theo tên thành viên..."
          class="w-full p-inputtext-sm"
          style="width: 20%"
        />
        <!-- <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" /> -->
      </div>
      <DataTable
        :value="filteredTrans"
        paginator
        :rows="10"
        :first="first"
        @page="onPage"
        :rowsPerPageOptions="[10, 50, 100]"
        class="p-datatable-sm"
      >
        <!-- <Column field="id" header="ID" sortable></Column> -->
        <Column header="STT" sortable>
          <template #body="{ index }">
            {{ first + index + 1 }}
          </template>
        </Column>
        <Column field="transactionType" header="Loại giao dịch" sortable>
          <template #body="{ data }">
            {{ getTransactionLabel(data.transactionType) }}
          </template>
        </Column>

        <Column field="userDto.fullName" header="Tên thành viên" sortable>
          <template #body="{ data }">
            {{ data.userDto?.fullName || 'N/A' }}
          </template>
        </Column>
        <Column field="description" header="Mô tả" sortable></Column>
        <Column field="amount" header="Số Tiền" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.amount) }}
          </template>
        </Column>
        <Column field="createdAt" header="Ngày Tạo" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import axiosInstance from '@/router/Interceptor'
import { useRouter } from 'vue-router'
import formatCurrency from '@/utils/FormatCurrency'
import type Trans from '@/types/Trans'

const token = localStorage.getItem('accessToken')
const trans = ref<Trans[]>([])
const searchQuery = ref('')
const router = useRouter()

const getTransactionLabel = (type: string) => {
  const mapping: Record<string, string> = {
    INCOME_FUND: 'Đóng quỹ',
    INCOME_PENALTY: 'Đóng phạt',
    EXPENSE: 'Chi tiêu',
  }
  return mapping[type] || 'Không xác định'
}

//pagenation
const first = ref<number>(0)
const onPage = (event: { first: number }) => {
  first.value = event.first
}

const fetchExpense = async () => {
  try {
    const response = await axiosInstance.get(`/trans`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    trans.value = response.data
    // console.log();
  } catch (error) {
    console.error('Error fetching funds:', error)
  }
}

const filteredTrans = computed(() => {
  if (!searchQuery.value) return trans.value

  return trans.value.filter((tran) => {
    const descriptionMatch = tran.description
      ?.toLowerCase()
      .includes(searchQuery.value.toLowerCase())
    const fullnameMatch = tran.userDto?.fullName
      ?.toLowerCase()
      .includes(searchQuery.value.toLowerCase())

    return descriptionMatch || fullnameMatch
  })
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

onMounted(() => {
  if (!token) {
    router.push('/')
  } else {
    fetchExpense()
  }
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}
</style>
