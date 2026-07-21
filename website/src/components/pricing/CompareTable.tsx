import { HiOutlineCheck, HiOutlineMinus } from 'react-icons/hi2'
import { PRICING_COMPARISON_ROWS } from '@/data/pricingComparisonRows'

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <HiOutlineCheck className="text-success mx-auto h-5 w-5" aria-label="Included" />
    ) : (
      <HiOutlineMinus className="text-gray/40 mx-auto h-5 w-5" aria-label="Not included" />
    )
  }
  return <span className="text-dark text-sm font-medium">{value}</span>
}

export function CompareTable() {
  return (
    <div className="shadow-soft overflow-x-auto rounded-2xl border border-black/5">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface-soft border-b border-black/5">
            <th className="text-gray px-6 py-4 text-left text-xs font-bold tracking-wide uppercase">Feature</th>
            <th className="text-dark px-6 py-4 text-center text-xs font-bold tracking-wide uppercase">Starter</th>
            <th className="text-primary px-6 py-4 text-center text-xs font-bold tracking-wide uppercase">Premium</th>
            <th className="text-dark px-6 py-4 text-center text-xs font-bold tracking-wide uppercase">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {PRICING_COMPARISON_ROWS.map((row) => (
            <tr key={row.feature} className="border-b border-black/5 last:border-0">
              <td className="text-dark px-6 py-3.5 font-medium">{row.feature}</td>
              <td className="px-6 py-3.5 text-center">
                <Cell value={row.starter} />
              </td>
              <td className="bg-primary-50/40 px-6 py-3.5 text-center">
                <Cell value={row.premium} />
              </td>
              <td className="px-6 py-3.5 text-center">
                <Cell value={row.enterprise} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
