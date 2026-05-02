export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  category: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email?: string | null
  phone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  _count?: { sales: number }
}

export interface SaleItem {
  id: string
  quantity: number
  price: number
  productId: string
  product: Product
  saleId: string
}

export interface Sale {
  id: string
  total: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  customerId: string
  customer: Customer
  userId: string
  user: User
  items: SaleItem[]
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalProducts: number
  totalCustomers: number
  lowStockProducts: number
  recentSales: Sale[]
  salesChartData: { date: string; total: number; count: number }[]
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// Form types
export interface ProductFormData {
  name: string
  description: string
  price: number
  quantity: number
  category: string
}

export interface CustomerFormData {
  name: string
  phone: string
  address: string
}

export interface SaleItemInput {
  productId: string
  quantity: number
  price: number
  product?: Product
}

export interface SaleFormData {
  customerId: string
  items: SaleItemInput[]
  notes: string
  status: 'PENDING' | 'COMPLETED'
}
