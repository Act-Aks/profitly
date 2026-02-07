import type { Statement } from '@/utils/database/schema'

export interface StatementDraft {
    accountLabel?: string | null
    closingBalance?: number | null
    currency: string
    currencySymbol: string
    fees: number
    grossExpense: number
    grossIncome: number
    netProfit: number
    notes?: string | null
    openingBalance?: number | null
    periodEnd: Date
    periodStart: Date
    sourceName?: string | null
    sourceType: 'bank' | 'broker' | 'manual' | 'import'
    taxes: number
}

export interface StatementFileDraft {
    fileName: string
    fileSize: number
    fileUri: string
    mimeType?: string | null
    parseMethod: 'csv' | 'ofx' | 'qfx' | 'pdf' | 'image' | 'manual' | 'unknown'
    parseStatus: 'success' | 'partial' | 'failed'
}

export interface CsvMapping {
    amount?: string | null
    balance?: string | null
    credit?: string | null
    date?: string | null
    debit?: string | null
    description?: string | null
    type?: string | null
}

interface CsvTransaction {
    amount?: number
    balance?: number
    date?: Date
    description?: string
    type?: string
}

export const normalizeHeader = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')

const numberRegex = /[-+]?\d*\.?\d+/g

const parseNumber = (value: string | number | undefined | null) => {
    if (typeof value === 'number') {
        return value
    }
    if (!value) {
        return 0
    }
    const cleaned = String(value)
        .replace(/[,₹$€£¥]/g, '')
        .trim()
    const matches = cleaned.match(numberRegex)
    if (!matches) {
        return 0
    }
    return Number.parseFloat(matches.join(''))
}

const parseDate = (value?: string | null) => {
    if (!value) {
        return undefined
    }
    const normalized = value.trim()
    if (!normalized) {
        return undefined
    }
    const date = new Date(normalized)
    if (!Number.isNaN(date.getTime())) {
        return date
    }
    const numeric = normalized.replace(/[^0-9]/g, '')
    if (numeric.length >= 8) {
        const year = Number.parseInt(numeric.slice(0, 4), 10)
        const month = Number.parseInt(numeric.slice(4, 6), 10) - 1
        const day = Number.parseInt(numeric.slice(6, 8), 10)
        const fallback = new Date(year, month, day)
        if (!Number.isNaN(fallback.getTime())) {
            return fallback
        }
    }
    return undefined
}

export function parseCsv(text: string) {
    const rows: string[][] = []
    let row: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const next = text[i + 1]

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"'
                i++
                continue
            }
            if (char === '"') {
                inQuotes = false
                continue
            }
            current += char
            continue
        }

        if (char === '"') {
            inQuotes = true
            continue
        }

        if (char === ',') {
            row.push(current)
            current = ''
            continue
        }

        if (char === '\n' || char === '\r') {
            if (char === '\r' && next === '\n') {
                i++
            }
            row.push(current)
            const hasValues = row.some(cell => cell.trim().length > 0)
            if (hasValues) {
                rows.push(row)
            }
            row = []
            current = ''
            continue
        }

        current += char
    }

    if (current.length > 0 || row.length > 0) {
        row.push(current)
        const hasValues = row.some(cell => cell.trim().length > 0)
        if (hasValues) {
            rows.push(row)
        }
    }

    return rows
}

export function inferCsvMapping(headers: string[]): CsvMapping {
    const normalized = headers.map(normalizeHeader)
    const findHeader = (candidates: string[]) =>
        headers[normalized.findIndex(h => candidates.includes(h))] ?? null

    return {
        amount: findHeader(['amount', 'amt', 'transactionamount']),
        balance: findHeader(['balance', 'closingbalance', 'runningbalance']),
        credit: findHeader(['credit', 'cr', 'deposit']),
        date: findHeader(['date', 'transactiondate', 'postingdate', 'valuedate']),
        debit: findHeader(['debit', 'dr', 'withdrawal']),
        description: findHeader(['description', 'narration', 'details', 'remark', 'memo']),
        type: findHeader(['type', 'transactiontype', 'drcr', 'debitcredit']),
    }
}

export function buildStatementFromCsv(
    headers: string[],
    rows: string[][],
    mapping: CsvMapping,
    currency: string,
    currencySymbol: string
) {
    const headerIndex = new Map(headers.map((h, index) => [h, index]))
    const getValue = (row: string[], header?: string | null) => {
        if (!header) {
            return undefined
        }
        const index = headerIndex.get(header)
        if (index === undefined) {
            return undefined
        }
        return row[index]
    }

    const transactions: CsvTransaction[] = rows.map(row => {
        const amountValue = getValue(row, mapping.amount)
        const debitValue = getValue(row, mapping.debit)
        const creditValue = getValue(row, mapping.credit)
        const typeValue = getValue(row, mapping.type)
        const balanceValue = getValue(row, mapping.balance)
        return {
            amount:
                mapping.credit && mapping.debit
                    ? parseNumber(creditValue) - parseNumber(debitValue)
                    : parseNumber(amountValue),
            balance: parseNumber(balanceValue),
            date: parseDate(getValue(row, mapping.date)),
            description: getValue(row, mapping.description),
            type: typeValue?.toLowerCase(),
        }
    })

    let grossIncome = 0
    let grossExpense = 0
    let netProfit = 0
    let openingBalance: number | undefined
    let closingBalance: number | undefined
    let periodStart: Date | undefined
    let periodEnd: Date | undefined

    for (const txn of transactions) {
        const amount = txn.amount ?? 0
        const normalizedType = txn.type ?? ''
        const _isCredit = normalizedType.includes('cr') || normalizedType.includes('credit')
        const isDebit = normalizedType.includes('dr') || normalizedType.includes('debit')

        if (amount >= 0 && !isDebit) {
            grossIncome += amount
        }
        if (amount < 0 || isDebit) {
            grossExpense += Math.abs(amount)
        }

        netProfit += amount

        if (txn.balance && !Number.isNaN(txn.balance)) {
            if (openingBalance === undefined) {
                openingBalance = txn.balance
            }
            closingBalance = txn.balance
        }

        if (txn.date) {
            if (!periodStart || txn.date < periodStart) {
                periodStart = txn.date
            }
            if (!periodEnd || txn.date > periodEnd) {
                periodEnd = txn.date
            }
        }
    }

    const now = new Date()

    return {
        statement: {
            accountLabel: null,
            closingBalance: closingBalance ?? null,
            currency,
            currencySymbol,
            fees: 0,
            grossExpense,
            grossIncome,
            netProfit,
            notes: '',
            openingBalance: openingBalance ?? null,
            periodEnd: periodEnd ?? now,
            periodStart: periodStart ?? now,
            sourceName: null,
            sourceType: 'import' as const,
            taxes: 0,
        },
        transactionCount: transactions.length,
    }
}

const extractTagValue = (block: string, tag: string) => {
    const regex = new RegExp(`<${tag}>([^<\\n\\r]*)`, 'i')
    const match = block.match(regex)
    return match ? match[1].trim() : undefined
}

const parseOfxDate = (value?: string) => {
    if (!value) {
        return undefined
    }
    const digits = value.replace(/[^0-9]/g, '')
    if (digits.length < 8) {
        return undefined
    }
    const year = Number.parseInt(digits.slice(0, 4), 10)
    const month = Number.parseInt(digits.slice(4, 6), 10) - 1
    const day = Number.parseInt(digits.slice(6, 8), 10)
    return new Date(year, month, day)
}

export function buildStatementFromOfx(text: string, currency: string, currencySymbol: string) {
    const transactions: CsvTransaction[] = []
    const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
    let match = stmtRegex.exec(text)
    while (match) {
        const block = match[1]
        const amount = parseNumber(extractTagValue(block, 'TRNAMT'))
        const date = parseOfxDate(extractTagValue(block, 'DTPOSTED'))
        const description = extractTagValue(block, 'MEMO') || extractTagValue(block, 'NAME')
        const type = extractTagValue(block, 'TRNTYPE')
        transactions.push({ amount, date, description, type })
        match = stmtRegex.exec(text)
    }

    let grossIncome = 0
    let grossExpense = 0
    let netProfit = 0
    let periodStart: Date | undefined
    let periodEnd: Date | undefined

    for (const txn of transactions) {
        const amount = txn.amount ?? 0
        if (amount >= 0) {
            grossIncome += amount
        }
        if (amount < 0) {
            grossExpense += Math.abs(amount)
        }
        netProfit += amount
        if (txn.date) {
            if (!periodStart || txn.date < periodStart) {
                periodStart = txn.date
            }
            if (!periodEnd || txn.date > periodEnd) {
                periodEnd = txn.date
            }
        }
    }

    const ledgerBalanceBlock = text.match(/<LEDGERBAL>([\s\S]*?)<\/LEDGERBAL>/i)
    const closingBalanceValue = ledgerBalanceBlock
        ? parseNumber(extractTagValue(ledgerBalanceBlock[1], 'BALAMT'))
        : undefined

    const now = new Date()

    return {
        statement: {
            accountLabel: null,
            closingBalance: closingBalanceValue ?? null,
            currency,
            currencySymbol,
            fees: 0,
            grossExpense,
            grossIncome,
            netProfit,
            notes: '',
            openingBalance: null,
            periodEnd: periodEnd ?? now,
            periodStart: periodStart ?? now,
            sourceName: null,
            sourceType: 'import' as const,
            taxes: 0,
        },
        transactionCount: transactions.length,
    }
}

export function buildEarningsGrowthSeries(statements: Statement[]) {
    const sorted = [...statements].sort(
        (a, b) => new Date(a.periodEnd).getTime() - new Date(b.periodEnd).getTime()
    )
    let cumulative = 0
    return sorted.map(statement => {
        cumulative += statement.netProfit || 0
        return {
            net: statement.netProfit || 0,
            x: new Date(statement.periodEnd),
            y: cumulative,
        }
    })
}
