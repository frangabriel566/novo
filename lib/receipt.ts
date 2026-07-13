import { formatCurrency, formatDateTime, getStatusLabel } from './utils'

interface ReceiptSale {
  id: string
  total: number
  status: string
  createdAt: string
  customer: { name: string }
  items: { id: string; quantity: number; price: number; product: { name: string } }[]
}

/**
 * Abre uma janela com um recibo simples e imprimível da venda.
 * Funciona tanto para vendas de varejo quanto de atacado (mesmo formato de dados).
 */
export function printSaleReceipt(sale: ReceiptSale) {
  const win = window.open('', '_blank', 'width=380,height=600')
  if (!win) return

  const itemsHtml = sale.items
    .map(
      (item) => `
      <tr>
        <td>${item.product.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    )
    .join('')

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Recibo #${sale.id.slice(-6)}</title>
        <style>
          body { font-family: monospace; font-size: 13px; color: #000; padding: 16px; max-width: 320px; margin: 0 auto; }
          h1 { font-size: 16px; text-align: center; margin: 0 0 4px; }
          .muted { color: #555; text-align: center; font-size: 11px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 4px; font-size: 11px; }
          td { padding: 3px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 15px; }
          .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #555; }
        </style>
      </head>
      <body>
        <h1>King Store</h1>
        <p class="muted">Comprovante de Venda #${sale.id.slice(-6)}</p>
        <div class="row"><span>Cliente</span><span>${sale.customer.name}</span></div>
        <div class="row"><span>Data</span><span>${formatDateTime(sale.createdAt)}</span></div>
        <div class="row"><span>Status</span><span>${getStatusLabel(sale.status)}</span></div>
        <table>
          <thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Subtotal</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="row total"><span>Total</span><span>${formatCurrency(sale.total)}</span></div>
        <p class="footer">Obrigado pela preferência!</p>
      </body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
}
