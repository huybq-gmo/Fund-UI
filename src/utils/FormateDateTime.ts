import { format } from 'date-fns'
export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}
