import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

const STORE_TIME_ZONE = 'America/Sao_Paulo'

/**
 * Chave de data (YYYY-MM-DD) no fuso horário da loja, para agrupar vendas por
 * dia corretamente independente do fuso horário do servidor (evita que vendas
 * feitas à noite caiam no dia seguinte quando agrupadas em UTC).
 */
export function toLocalDateKey(date: string | Date, timeZone: string = STORE_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    COMPLETED: 'Concluída',
    PENDING: 'Pendente',
    CANCELLED: 'Cancelada',
  }
  return labels[status] ?? status
}

export function getStockStatus(quantity: number): {
  label: string
  color: string
} {
  if (quantity === 0) return { label: 'Sem estoque', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
  if (quantity < 10) return { label: 'Estoque baixo', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
  return { label: 'Em estoque', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
}
