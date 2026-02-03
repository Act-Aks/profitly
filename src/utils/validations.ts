import { z } from 'zod'

export const transactionSchema = z.object({
    amount: z
        .number({ error: 'Amount is required' })
        .positive('Amount must be positive')
        .max(999_999_999, 'Amount is too large'),
    attachmentUri: z.string().optional(),
    categoryId: z.string().min(1, 'Please select a category'),
    date: z.date({ error: 'Date is required' }),
    description: z.string().min(1, 'Description is required').max(200, 'Description is too long'),
    type: z.enum(['income', 'expense'], { error: 'Please select transaction type' }),
})

export const categorySchema = z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    icon: z.string().min(1, 'Please select an icon'),
    name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
    type: z.enum(['income', 'expense']),
})

export const importSettingsSchema = z.object({
    amountColumn: z.string(),
    dateColumn: z.string(),
    dateFormat: z.string(),
    descriptionColumn: z.string(),
    skipHeader: z.boolean(),
})

export type TransactionFormData = z.infer<typeof transactionSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type ImportSettingsData = z.infer<typeof importSettingsSchema>
