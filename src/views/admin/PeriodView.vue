<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách Kỳ Hạn</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo năm..." class="w-full p-inputtext-sm" />
                <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" />
            </div>
            <DataTable :value="filteredPeriods" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20]"
                class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="month" header="Tháng" sortable></Column>
                <Column field="year" header="Năm" sortable></Column>
                <Column field="totalAmount" header="Tổng cộng" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.totalAmount) }}
                    </template>
                </Column>
                <Column field="deadline" header="Hạn Chót" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.deadline) }}
                    </template>
                </Column>
                <Column field="description" header="Mô Tả" sortable></Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <!-- <Button label="Delete" icon="pi pi-trash" severity="danger"
                            @click="confirmDeletePeriod(data)" /> -->
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>



    <Dialog v-model:visible="showPeriodDialog" modal :header="isUpdate ? 'Update Period' : 'Create Period'"
        @hide="resetErrors" :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="month" class="fw-bold">Tháng</label>
            <Dropdown id="month" v-model="form.month" :options="months" optionLabel="label" optionValue="value"
                class="w-100" />
        </div>
        <div class="mb-3">
            <label for="year" class="fw-bold">Năm</label>
            <InputText id="year" type="number" v-model="form.year" class="w-100" autocomplete="off" disabled />
        </div>
        <div class="mb-3">
            <label for="deadline" class="fw-bold">Hạn Chót</label>
            <Calendar id="deadline" v-model="form.deadline" class="w-100" showIcon />
        </div>
        <div class="mb-3">
            <label for="description" class="fw-bold">Mô Tả</label>
            <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showPeriodDialog = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="savePeriod"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import axios from 'axios';
import { useRouter } from 'vue-router';
import type Period from '@/types/Period';
import months from '@/utils/Months';
import formatCurrency from '@/utils/FormatCurrency';

const showConfirmDialog = ref(false);
const periodToDelete = ref<Period | null>(null);
const token = localStorage.getItem('accessToken');
const periods = ref<Period[]>([]);
const searchQuery = ref("");
const showPeriodDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, month: 1, year: new Date().getFullYear().toString(), deadline: new Date(), description: "" });
const router = useRouter();
const errors = ref({ month: 0, year: 0, description: "", dealdline: "" });

const fetchPeriods = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/periods', {
            headers: { Authorization: `Bearer ${token}` }
        });
        periods.value = response.data;
    } catch (error) {
        console.error('Error fetching periods:', error);
    }
};

const resetErrors = () => {
    errors.value = { month: 0, year: 0, description: "", dealdline: "" };
};

const filteredPeriods = computed(() => {
    if (!searchQuery.value) return periods.value;
    return periods.value.filter(period => period.year.toString().includes(searchQuery.value) || period.month.toString().includes(searchQuery.value));
});

const openCreateDialog = () => {
    form.value = { id: 0, month: 1, year: new Date().getFullYear().toString(), deadline: new Date(), description: "" };
    isUpdate.value = false;
    showPeriodDialog.value = true;
};

const openUpdateDialog = (period: Period) => {
    form.value = { id: period.id, month: period.month, year: period.year.toString(), deadline: new Date(period.deadline), description: period.description };
    isUpdate.value = true;
    showPeriodDialog.value = true;
};

// const confirmDeletePeriod = (period: Period) => {
//     periodToDelete.value = period;
//     showConfirmDialog.value = true;
// };

const savePeriod = async () => {
    try {
        const periodData = { ...form.value, deadline: form.value.deadline.toISOString().split('T')[0] };
        if (isUpdate.value) {
            await axios.put(`http://localhost:8080/api/periods/${form.value.id}`, periodData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            await axios.post('http://localhost:8080/api/periods', periodData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        showPeriodDialog.value = false;
        fetchPeriods();
    } catch (error) {
        console.error('Error saving period:', error);
    }
};

// const deletePeriod = async () => {
//     if (!periodToDelete.value) return;
//     try {
//         await axios.delete(`http://localhost:8080/api/periods/${periodToDelete.value.id}`, {
//             headers: { Authorization: `Bearer ${token}` }
//         });
//         fetchPeriods();
//     } catch (error) {
//         console.error('Error deleting period:', error);
//     } finally {
//         showConfirmDialog.value = false;
//         periodToDelete.value = null;
//     }
// };

const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

onMounted(() => {
    if (!token) {
        router.push('/');
    } else {
        fetchPeriods();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}
</style>
