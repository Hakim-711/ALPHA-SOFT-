export function dateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function today() {
  return dateInputValue()
}

export function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  return dateInputValue(date)
}
