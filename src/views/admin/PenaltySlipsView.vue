<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">PHIẾU PHẠT</h2>
      <div class="mb-3 d-flex justify-content-between align-items-center">
        <div>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm kiếm theo id, tên..."
            class="w-full p-inputtext-sm"
          />
          <Button
            label="Tạo phiếu phạt"
            severity="success"
            class="left-10"
            raised
            size="small"
            @click="openCreateDialog"
          />
        </div>
        <div>
          <Button
            label="Thông báo"
            icon="pi pi-cog"
            class="p-button-sm"
            severity="success"
            raised
            @click="openScheduleDialog"
          />
        </div>
      </div>
      <DataTable
        :value="filteredPeriods"
        paginator
        :rows="10"
        :first="first"
        @page="onPage"
        :rowsPerPageOptions="[10, 50, 100]"
        class="p-datatable-sm"
      >
        <Column header="STT" sortable>
          <template #body="{ index }">
            {{ first + index + 1 }}
          </template>
        </Column>
        <Column field="user.fullName" header="Tên thành viên" sortable></Column>
        <Column field="penalty.description" header="Loại phạt" sortable></Column>
        <Column field="description" header="Mô tả" sortable>
          <template #body="{ data }">
            {{ data.description !== '' ? data.description : '-' }}
          </template>
        </Column>
        <Column field="amount" header="Tổng cộng" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.amount) }}
          </template>
        </Column>
        <Column field="dueDate" header="Ngày đến hạn" sortable>
          <template #body="{ data }">
            {{ formatDate(data.dueDate) }}
          </template>
        </Column>
        <!-- <Column header="Actions">
          <template #body="{ data }">
            <Button
              label="Sửa"
              icon="pi pi-pencil"
              severity="info"
              @click="openUpdateDialog(data)"
            />
            <Button
              label="Xóa"
              icon="pi pi-trash"
              class="left-10"
              severity="danger"
              @click="confirmDeletePenalty(data)"
            />
          </template>
        </Column> -->
        <Column header="Trạng thái">
          <template #body="{ data }">
            <Tag
              :value="getPaymentStatusLabel(data.paymentStatus)"
              :severity="getPaymentStatusSeverity(data.paymentStatus)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <!-- <Dialog
    v-model:visible="showConfirmDialog"
    modal
    header="Xác nhận xóa"
    :style="{ width: '25rem' }"
  >
    <div>Bạn có chắc chắn muốn xóa quỹ phạt này?</div>
    <div class="d-flex justify-content-end gap-2 mt-3">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button label="Xóa" severity="danger" @click="deletePenalty" />
    </div>
  </Dialog> -->

  <!-- Dialog Cài đặt thông báo đi muộn -->
  <Dialog
    v-model:visible="showScheduleDialog"
    header="Thông báo đóng tiền phạt"
    modal
    class="container-dialog"
  >
    <!-- Thông tin hiện tại -->
    <!-- <div class="col-12 mb-3 item-dialog lh-2">
      <p class="text-sm text-gray-600">
        ⏰ <strong>Thông báo đóng tiền phạt</strong>
      </p>
    </div> -->

    <!-- Form chọn lại -->
    <!-- <div class="col-12 mb-3 item-dialog">
      <label class="font-bold mb-2">
        Channel id <span class="text-danger">*</span></label
      >
      <InputText
        v-model="scheduleForm.channelId"
        placeholder="Vui lòng nhập channel id của chatops"
        class="w-full"
      />
      <small class="text-danger" v-if="errorsForm.channelId">{{
        errorsForm.channelId
      }}</small>
      <label class="font-bold mb-2"> Thời gian gửi <span class="text-danger">*</span> </label>
      <Calendar v-model="scheduleForm.sendTime" timeOnly hourFormat="24" class="w-full" />
    </div> -->

    <div class="actions-dialog">
      <Button label="Hủy" severity="secondary" @click="showScheduleDialog = false" />
      <Button label="Gửi thông báo ngay" severity="primary" @click="sendLateNotification" />
    </div>
  </Dialog>

  <Dialog
    v-model:visible="showPenaltyDialog"
    modal
    :header="isUpdate ? 'Cập nhật phiếu phạt' : 'Tạo phiếu phạt'"
    @hide="resetErrors"
    :style="{ width: '30rem' }"
  >
    <div class="mb-3">
      <label for="penaltySlug" class="fw-bold">
        Loại phiếu phạt <span class="text-danger">*</span>
      </label>
      <Select
        v-model="form.penaltySlug"
        :options="penaltyTypes"
        optionLabel="description"
        optionValue="slug"
        placeholder="Chọn loại phiếu phạt"
        class="w-100"
      />
      <small class="text-danger" v-if="errors.penaltySlug">{{ errors.penaltySlug }}</small>
    </div>
    <div class="mb-3">
      <label for="description" class="fw-bold"> Mô tả</label>
      <InputText
        id="description"
        type="text"
        v-model="form.description"
        class="w-100"
        autocomplete="off"
      />
    </div>
    <div class="mb-3">
      <label for="userIds" class="fw-bold"> Thành Viên <span class="text-danger">*</span> </label>
      <MultiSelect
        filter
        v-model="form.userIds"
        :options="user"
        optionLabel="fullName"
        optionValue="id"
        placeholder="Chọn thành viên"
        class="w-100"
      />
      <small class="text-danger" v-if="errors.userIds">{{ errors.userIds }}</small>
    </div>

    <div class="mb-3">
      <label for="dueDate" class="fw-bold"> Ngày đến hạn <span class="text-danger">*</span> </label>
      <Calendar
        id="dueDate"
        v-model="form.dueDate"
        dateFormat="dd/mm/yy"
        class="w-100"
        placeholder="Chọn ngày đến hạn"
      />
      <small class="text-danger" v-if="errors.dueDate">{{ errors.dueDate }}</small>
    </div>

    <!-- <div class="mb-3">
      <label for="amount" class="fw-bold"> Tổng tiền <span class="text-danger">*</span> </label>
      <InputNumber
        id="amount"
        v-model="form.amount"
        mode="currency"
        currency="VND"
        class="w-100"
        locale="en-US"
        :min="0"
      />
      <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
    </div> -->

    <div class="d-flex justify-content-end gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="showPenaltyDialog = false"
      ></Button>
      <Button type="button" label="Save" severity="primary" @click="savePenaltySlips"></Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Calendar from 'primevue/calendar'

// import Dialog from 'primevue/dialog'
import axiosInstance from '@/router/Interceptor'
import { useRouter } from 'vue-router'
import formatCurrency from '@/utils/FormatCurrency'
import type PenaltySlip from '@/types/PenaltySlip'
import type Penalty from '@/types/Penalty'
import type { User } from '@/types/User'

const toast = useToast()

// const baseURL = "http://localhost:8080/api/v1";
// const showConfirmDialog = ref(false)
// const penaltyDelete = ref<Penalty | null>(null)
const token = localStorage.getItem('accessToken')
const penaltySlips = ref<PenaltySlip[]>([])
const searchQuery = ref('')

// DATA FOR PENALTY DIALOG
const penaltyTypes = ref<Penalty[]>([])

// DATA FOR USER
const user = ref<User[]>([])

// FORM FOR LATE DIALOG
const showScheduleDialog = ref(false)
// const scheduleForm = ref({
//   fromDate: new Date(),
//   sendTime: new Date(),
//   type: 'late_notification',
//   channelId: '',
// })

// Hàm lưu cài đặt thông báo
const sendLateNotification = async () => {
  // try {
  //   const dataForm = {
  //     fromDate: formatDateToApiString(scheduleForm.value.fromDate),
  //     sendTime: formatTimeToApiString(scheduleForm.value.sendTime),
  //     type: scheduleForm.value.type,
  //     channelId: scheduleForm.value.channelId,
  //   }

  //   console.log('scheduleForm update gửi lên:', dataForm)

  //   await axiosInstance.put(`/schedules/${dataForm.type}`, dataForm)
  //   showScheduleDialog.value = false
  // } catch (error) {
  //   console.error('Lỗi khi cập nhật schedule:', error)
  // }
  try {
    const response = await axiosInstance.post(
      `/pen-bills/notification`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    console.log('Notification sent successfully:', response.data)
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Gửi thông báo thành công!',
      life: 3000,
    })
    showScheduleDialog.value = false
  } catch (error) {
    console.error('Error sending notification:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Gửi thông báo thất bại!',
      life: 3000,
    })
  }
}

// Hàm mở dialog cài đặt
const openScheduleDialog = () => {
  showScheduleDialog.value = true
}

// SHOW PENALTY DIALOG
const form = ref({
  id: 0,
  penaltySlug: '',
  description: '',
  amount: 0,
  userIds: '',
  dueDate: new Date(),
})
const errors = ref({ penaltySlug: '', amount: '', userIds: '', dueDate: '' })
const isUpdate = ref(false)
const showPenaltyDialog = ref(false)

const router = useRouter()

//pagenation
const first = ref<number>(0)
const onPage = (event: { first: number }) => {
  first.value = event.first
}
const fetchPenaltySlips = async () => {
  try {
    const response = await axiosInstance.get(`/pen-bills`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    penaltySlips.value = response.data
  } catch (error) {
    console.error('Error fetching periods:', error)
  }
}

const fetchPenaltyTypes = async () => {
  try {
    const response = await axiosInstance.get(`/penalties`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    penaltyTypes.value = response.data.map((penalty: { name: string; slug: string }) => ({
      description: penalty.name,
      slug: penalty.slug,
    }))
  } catch (error) {
    console.error('Error fetching penalty types:', error)
  }
}

const fetchUsers = async () => {
  try {
    const response = await axiosInstance.get(`/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    user.value = response.data.map((user: { id: number; fullName: string }) => ({
      id: user.id,
      fullName: `${user.id} - ${user.fullName}`,
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const filteredPeriods = computed(() => {
  if (!searchQuery.value) return penaltySlips.value
  return penaltySlips.value.filter(
    (pen) =>
      pen.user.fullName.includes(searchQuery.value) ||
      pen.user.id.toString().includes(searchQuery.value),
  )
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'Đã thanh toán'
    case 'PENDING':
      return 'Chờ xử lý'
    case 'UNPAID':
      return 'Chưa thanh toán'
    case 'CANCELED':
      return 'Đã hủy'
    default:
      return 'Không xác định'
  }
}

const getPaymentStatusSeverity = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'UNPAID':
      return 'danger'
    case 'CANCELED':
      return 'info'
    default:
      return 'info'
  }
}

onMounted(() => {
  if (!token) {
    router.push('/')
  } else {
    fetchPenaltySlips()
    fetchPenaltyTypes()
    fetchUsers()
  }
})

// const form = ref({ id: 0, penaltySlug: '', description: '', amount: 0, userIds: '' })
// const errors = ref({ penaltySlug: '', amount: 0, userIds: '' })
const validateForm = () => {
  errors.value = { penaltySlug: '', amount: '', userIds: '', dueDate: '' }

  if (!form.value.penaltySlug) errors.value.penaltySlug = 'Vui lòng chọn loại phiếu phạt!'
  // if (!form.value.amount || isNaN(Number(form.value.amount)))
  //   errors.value.amount = 'Vui lòng nhập số tiền hợp lệ!'
  if (!form.value.userIds) errors.value.userIds = 'Vui lòng chọn người bị phạt!'
  if (!form.value.dueDate) errors.value.dueDate = 'Vui lòng chọn ngày đến hạn!'

  return Object.values(errors.value).every((err) => err === '')
}

const resetErrors = () => {
  errors.value = { penaltySlug: '', amount: '', userIds: '', dueDate: '' }
}

const openCreateDialog = () => {
  form.value = {
    id: 0,
    penaltySlug: '',
    description: '',
    amount: 0,
    userIds: '',
    dueDate: new Date(),
  }
  isUpdate.value = false
  showPenaltyDialog.value = true
}

const savePenaltySlips = async () => {
  if (!validateForm()) return
  console.log('Form Data:', form.value)
  try {
    const penaltyData = { ...form.value, paymentStatus: 'UNPAID' }
    console.log('Penalty Data:', penaltyData)
    if (isUpdate.value) {
      await axiosInstance.put(`/pen-bills/${form.value.id}`, penaltyData, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } else {
      await axiosInstance.post(`/pen-bills`, penaltyData, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    showPenaltyDialog.value = false
    fetchPenaltySlips()
  } catch (error) {
    console.error('Error saving penalty:', error)
  }
}

// // Hàm định dạng ngày tháng theo yêu cầu API (yyyy-MM-dd)
// const formatDateToApiString = (date: Date): string => {
//   const year = date.getFullYear()
//   const month = String(date.getMonth() + 1).padStart(2, '0')
//   const day = String(date.getDate()).padStart(2, '0')
//   return `${year}-${month}-${day}T00:00:00`
// }

// // Hàm định dạng thời gian theo yêu cầu API (HH:mm:ss)
// const formatTimeToApiString = (date: Date): string => {
//   const hours = String(date.getHours()).padStart(2, '0')
//   const minutes = String(date.getMinutes()).padStart(2, '0')
//   const seconds = String(date.getSeconds()).padStart(2, '0')
//   return `${hours}:${minutes}:${seconds}`
// }

// const openUpdateDialog = (penalty: Penalty) => {
//   form.value = {
//     id: penalty.id,
//     name: penalty.name,
//     description: penalty.description,
//     penaltySlug: penalty.penaltySlug,
//     amount: penalty.amount,
//   }
//   isUpdate.value = true
//   showPenaltyDialog.value = true
// }

// const confirmDeletePenalty = (pen: Penalty) => {
//   penaltyDelete.value = pen
//   showConfirmDialog.value = true
// }

// const deletePenalty = async () => {
//   if (!penaltyDelete.value) return
//   try {
//     await axiosInstance.delete(`/penalties/${penaltyDelete.value.id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//     fetchPenaltySlips()
//   } catch (error) {
//     console.error('Error deleting period:', error)
//   } finally {
//     showConfirmDialog.value = false
//     penaltyDelete.value = null
//   }
// }
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

.left-10 {
  margin-left: 10px;
}
</style>
