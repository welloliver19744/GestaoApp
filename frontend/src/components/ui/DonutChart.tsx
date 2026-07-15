import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DonutChartProps {
  data: { name: string; value: number; color: string }[]
  size?: number
  currency?: string
}

export function DonutChart({ data, currency = 'BRL' }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-bold text-surface-100">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(total)}
        </span>
        <span className="text-[10px] text-surface-500">total</span>
      </div>
    </div>
  )
}
