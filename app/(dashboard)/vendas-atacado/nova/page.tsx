import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import WholesaleSaleForm from '@/components/wholesale/WholesaleSaleForm'

export const metadata: Metadata = { title: 'Nova Venda Atacado' }

export default function NewWholesaleSalePage() {
  return (
    <div>
      <Header
        title="Nova Venda Atacado"
        subtitle="Registre uma nova venda de atacado"
        actions={
          <Link
            href="/vendas-atacado"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Vendas Atacado
          </Link>
        }
      />
      <div className="px-4 lg:px-8 py-6 max-w-3xl animate-fade-in">
        <WholesaleSaleForm />
      </div>
    </div>
  )
}
