/** Normalizes a data series into an SVG `d` path string for a line/area chart. */
export function buildLinePath(data: number[], width: number, height: number, padding = 4) {
  if (data.length === 0) return ''
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = (width - padding * 2) / (data.length - 1 || 1)

  const points = data.map((value, i) => {
    const x = padding + i * stepX
    const y = padding + (height - padding * 2) * (1 - (value - min) / range)
    return { x, y }
  })

  return points.reduce((path, point, i) => {
    return path + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
  }, '')
}

export function buildAreaPath(data: number[], width: number, height: number, padding = 4) {
  const linePath = buildLinePath(data, width, height, padding)
  if (!linePath) return ''
  return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`
}
