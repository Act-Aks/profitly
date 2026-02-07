import type { CsvMapping } from '@/utils/statements'
import { normalizeHeader } from '@/utils/statements'

export interface StatementTemplate {
    id: string
    name: string
    sourceName: string
    sourceType: 'bank' | 'broker'
    aliases: Partial<Record<keyof CsvMapping, string[]>>
}

const templates: StatementTemplate[] = [
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['closing_balance', 'balance', 'running_balance'],
            credit: ['deposit_amt', 'deposit_amount', 'credit', 'credit_amount'],
            date: ['date', 'value_dt', 'value_date'],
            debit: ['withdrawal_amt', 'withdrawal_amount', 'debit', 'debit_amount'],
            description: ['narration', 'description', 'particulars', 'details'],
        },
        id: 'hdfc',
        name: 'HDFC Bank',
        sourceName: 'HDFC Bank',
        sourceType: 'bank',
    },
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['balance', 'closing_balance', 'running_balance'],
            credit: ['deposit', 'deposits', 'credit', 'credit_amount'],
            date: ['transaction_date', 'date'],
            debit: ['withdrawal', 'withdrawals', 'debit', 'debit_amount'],
            description: ['transaction_remarks', 'remarks', 'description', 'narration'],
        },
        id: 'icici',
        name: 'ICICI Bank',
        sourceName: 'ICICI Bank',
        sourceType: 'bank',
    },
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['balance', 'closing_balance', 'running_balance'],
            credit: ['credit', 'deposit', 'cr', 'credit_amount'],
            date: ['txn_date', 'transaction_date', 'date'],
            debit: ['debit', 'withdrawal', 'dr', 'debit_amount'],
            description: ['description', 'narration', 'particulars', 'details'],
        },
        id: 'sbi',
        name: 'SBI Bank',
        sourceName: 'SBI Bank',
        sourceType: 'bank',
    },
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['balance', 'closing_balance', 'running_balance'],
            credit: ['credit', 'deposit', 'cr', 'credit_amount'],
            date: ['tran_date', 'transaction_date', 'date'],
            debit: ['debit', 'withdrawal', 'dr', 'debit_amount'],
            description: ['transaction_remarks', 'remarks', 'description', 'narration'],
        },
        id: 'axis',
        name: 'Axis Bank',
        sourceName: 'Axis Bank',
        sourceType: 'bank',
    },
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['balance', 'closing_balance', 'running_balance'],
            credit: ['deposit', 'credit', 'cr', 'credit_amount'],
            date: ['transaction_date', 'date'],
            debit: ['withdrawal', 'debit', 'dr', 'debit_amount'],
            description: ['narration', 'description', 'remarks', 'particulars'],
        },
        id: 'kotak',
        name: 'Kotak Bank',
        sourceName: 'Kotak Bank',
        sourceType: 'bank',
    },
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['balance', 'closing_balance', 'running_balance'],
            credit: ['credit', 'deposit', 'cr', 'credit_amount'],
            date: ['transaction_date', 'date'],
            debit: ['debit', 'withdrawal', 'dr', 'debit_amount'],
            description: ['description', 'narration', 'transaction_description', 'remarks'],
        },
        id: 'yes',
        name: 'Yes Bank',
        sourceName: 'Yes Bank',
        sourceType: 'bank',
    },
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['balance', 'closing_balance', 'running_balance'],
            credit: ['credit', 'deposit', 'cr', 'credit_amount'],
            date: ['transaction_date', 'date'],
            debit: ['debit', 'withdrawal', 'dr', 'debit_amount'],
            description: ['description', 'narration', 'remarks', 'particulars'],
        },
        id: 'canara',
        name: 'Canara Bank',
        sourceName: 'Canara Bank',
        sourceType: 'bank',
    },
    {
        aliases: {
            amount: ['amount', 'transaction_amount', 'txn_amount'],
            balance: ['balance', 'closing_balance', 'running_balance'],
            credit: ['credit', 'deposit', 'cr', 'credit_amount'],
            date: ['date', 'transaction_date', 'trade_date', 'value_date'],
            debit: ['debit', 'withdrawal', 'dr', 'debit_amount'],
            description: ['narration', 'description', 'remarks', 'details', 'particulars'],
        },
        id: 'groww',
        name: 'Groww',
        sourceName: 'Groww',
        sourceType: 'broker',
    },
]

const findHeader = (headers: string[], aliases: string[]) => {
    const normalized = headers.map(normalizeHeader)
    const index = normalized.findIndex(header => aliases.includes(header))
    return index >= 0 ? headers[index] : null
}

export function detectStatementTemplate(headers: string[]) {
    let bestTemplate: StatementTemplate | null = null
    let bestScore = -1
    let bestMapping: CsvMapping | null = null

    for (const template of templates) {
        const { mapping, matched } = buildTemplateMapping(headers, template)
        if (!hasMinimumColumns(mapping)) {
            continue
        }

        if (matched > bestScore) {
            bestScore = matched
            bestTemplate = template
            bestMapping = mapping
        }
    }

    if (!(bestTemplate && bestMapping)) {
        return null
    }

    return { mapping: bestMapping, template: bestTemplate }
}

export function buildTemplateMapping(headers: string[], template: StatementTemplate) {
    const mapping: CsvMapping = {}
    let matched = 0
    let total = 0

    for (const [key, aliases] of Object.entries(template.aliases)) {
        if (!aliases || aliases.length === 0) {
            continue
        }
        total += 1
        const header = findHeader(headers, aliases)
        if (header) {
            mapping[key as keyof CsvMapping] = header
            matched += 1
        }
    }

    return { mapping, matched, total }
}

export function hasMinimumColumns(mapping: CsvMapping) {
    const hasDate = Boolean(mapping.date)
    const hasAmount = Boolean(mapping.amount)
    const hasCreditDebit = Boolean(mapping.credit || mapping.debit)
    return hasDate && (hasAmount || hasCreditDebit)
}

export function getStatementTemplates() {
    return templates
}
