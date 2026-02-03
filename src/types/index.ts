export type TransactionType = 'income' | 'expense'

export interface Category {
    id: string
    name: string
    icon: string
    color: string
    type: TransactionType
}

export interface Transaction {
    id: string
    amount: number
    type: TransactionType
    categoryId: string
    description: string
    date: Date
    attachmentUri?: string
    source: 'manual' | 'imported'
    createdAt: Date
    updatedAt: Date
}

export interface PeriodSummary {
    totalIncome: number
    totalExpense: number
    netProfit: number
    profitMargin: number
    transactionCount: number
    topCategories: CategorySummary[]
}

export interface CategorySummary {
    categoryId: string
    categoryName: string
    total: number
    percentage: number
    count: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
}

export interface Insight {
    id: string
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    actionable?: string
    priority: number
}

export interface DateRange {
    start: Date
    end: Date
    label: string
}

export interface ChartDataPoint {
    x: string | number
    y: number
    label?: string
    color?: string
}
