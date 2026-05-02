import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import SaleForm from '@/components/sales/SaleForm'

export const metadata: Metadata = { title: 'Nova Venda' }

export default function NewSalePage() {
  return (
    <div>
      <Header
        title="Nova Venda"
        subtitle="Registre uma nova venda"
        actions={
          <Link
            href="/sales"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Vendas
          </Link>
        }
      />
      <div className="px-8 py-6 max-w-3xl animate-fade-in">
        <SaleForm />
      </div>
    </div>
  )
}
