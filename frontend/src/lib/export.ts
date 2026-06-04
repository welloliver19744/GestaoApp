import type { Transaction, Category } from '../api/types'
import { formatCurrency } from './utils'

export function exportCSV(transactions: Transaction[], categories: Category[], filename: string) {
  const catMap = new Map(categories.map(c => [c.id, c.name]))

  const headers = [
    'Data Vencimento',
    'Descrição',
    'Categoria',
    'Estabelecimento',
    'Valor',
    'Tipo',
    'Parcela',
    'Pago',
    'Data Pagamento',
    'Observações',
  ]

  const rows = transactions.map(tx => [
    tx.due_date,
    `"${tx.description.replace(/"/g, '""')}"`,
    `"${catMap.get(tx.category) || tx.category}"`,
    `"${(tx.store || '').replace(/"/g, '""')}"`,
    tx.total_amount.toFixed(2).replace('.', ','),
    tx.payment_type === 'installment' ? 'Parcelado' : 'À vista',
    tx.payment_type === 'installment' ? `${tx.installment_number}/${tx.installment_count}` : '-',
    tx.paid ? 'Sim' : 'Não',
    tx.paid_at ? tx.paid_at.slice(0, 10) : '',
    `"${(tx.notes || '').replace(/"/g, '""')}"`,
  ])

  const csv = [
    '\uFEFF' + headers.join(';'),
    ...rows.map(r => r.join(';')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPDF(transactions: Transaction[], categories: Category[], monthLabel: string) {
  const catMap = new Map(categories.map(c => [c.id, c.name]))

  const paid = transactions.filter(tx => tx.paid)
  const unpaid = transactions.filter(tx => !tx.paid)
  const totalPaid = paid.reduce((s, tx) => s + tx.total_amount, 0)
  const totalUnpaid = unpaid.reduce((s, tx) => s + tx.total_amount, 0)

  const rows = transactions.map(tx => [
    tx.due_date.slice(0, 10),
    tx.description,
    catMap.get(tx.category) || tx.category,
    tx.store || '',
    formatCurrency(tx.total_amount),
    tx.paid ? 'Pago' : 'Pendente',
  ])

  // Dynamically import jspdf (keeps initial bundle smaller)
  import('jspdf').then(async ({ default: jsPDF }) => {
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const margin = 14

    // Header
    doc.setFontSize(18)
    doc.setTextColor(0, 150, 200)
    doc.text('Gestão Casa', margin, 20)

    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Extrato Financeiro - ${monthLabel}`, margin, 28)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, 34)

    // Summary
    doc.setFontSize(10)
    doc.setTextColor(60)
    const summaryY = 44
    doc.text(`Total de transações: ${transactions.length}`, margin, summaryY)
    doc.text(`Total pago: ${formatCurrency(totalPaid)}`, margin, summaryY + 5)
    doc.text(`Total pendente: ${formatCurrency(totalUnpaid)}`, margin + 80, summaryY)
    doc.text(`Saldo restante: ${formatCurrency(totalPaid - totalUnpaid)}`, margin + 80, summaryY + 5)

    // Table
    autoTable(doc, {
      head: [['Data', 'Descrição', 'Categoria', 'Estabelecimento', 'Valor', 'Status']],
      body: rows,
      startY: summaryY + 14,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 150, 200], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 18, halign: 'center' },
      },
    })

    doc.save(`gestao-casa-${monthLabel.replace(/ /g, '-')}.pdf`)
  })
}
