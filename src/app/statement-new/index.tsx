import { zodResolver } from '@hookform/resolvers/zod'
import * as Crypto from 'expo-crypto'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, FieldError, Input, Label, TextField } from 'heroui-native'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { z } from 'zod'
import { useSettingsStore } from '@/stores/settings.store'
import { useStatementsStore } from '@/stores/statements.store'
import { db } from '@/utils/database'
import { statementFiles, statements } from '@/utils/database/schema'
import type { StatementDraft, StatementFileDraft } from '@/utils/statements'

const numberString = z
    .string()
    .min(1, 'This field is required')
    .refine(value => !Number.isNaN(parseNumber(value)), 'Enter a valid number')

const optionalNumberString = z
    .string()
    .optional()
    .refine(
        value => value === undefined || value === '' || !Number.isNaN(parseNumber(value)),
        'Enter a valid number'
    )

const dateString = z
    .string()
    .min(1, 'This field is required')
    .refine(value => !Number.isNaN(new Date(value).getTime()), 'Enter a valid date')

const statementSchema = z
    .object({
        accountLabel: z.string().optional(),
        closingBalance: optionalNumberString,
        fees: optionalNumberString,
        grossExpense: numberString,
        grossIncome: numberString,
        notes: z.string().optional(),
        openingBalance: optionalNumberString,
        periodEnd: dateString,
        periodStart: dateString,
        sourceName: z.string().optional(),
        sourceType: z.enum(['bank', 'broker', 'manual', 'import']),
        taxes: optionalNumberString,
    })
    .superRefine((value, ctx) => {
        if (value.sourceType !== 'manual' && !value.sourceName?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Source name is required',
                path: ['sourceName'],
            })
        }
    })

type StatementFormData = z.infer<typeof statementSchema>

const dateSchema = z.preprocess(value => {
    if (value instanceof Date) {
        return value
    }
    if (typeof value === 'string') {
        const parsed = new Date(value)
        return Number.isNaN(parsed.getTime()) ? undefined : parsed
    }
    return undefined
}, z.date())

const statementDraftSchema = z
    .object({
        accountLabel: z.string().nullable().optional(),
        closingBalance: z.number().nullable().optional(),
        currency: z.string().optional(),
        currencySymbol: z.string().optional(),
        fees: z.number().optional(),
        grossExpense: z.number().optional(),
        grossIncome: z.number().optional(),
        netProfit: z.number().optional(),
        notes: z.string().nullable().optional(),
        openingBalance: z.number().nullable().optional(),
        periodEnd: dateSchema.optional(),
        periodStart: dateSchema.optional(),
        sourceName: z.string().nullable().optional(),
        sourceType: z.enum(['bank', 'broker', 'manual', 'import']).optional(),
        taxes: z.number().optional(),
    })
    .partial()

const statementFileDraftSchema = z.object({
    fileName: z.string(),
    fileSize: z.number(),
    fileUri: z.string(),
    mimeType: z.string().nullable().optional(),
    parseMethod: z.enum(['csv', 'ofx', 'qfx', 'pdf', 'image', 'manual', 'unknown']),
    parseStatus: z.enum(['success', 'partial', 'failed']),
})

const toDateInput = (value?: Date | null) =>
    value ? new Date(value).toISOString().split('T')[0] : ''

const parseNumber = (value?: string) => {
    if (!value) {
        return 0
    }
    const cleaned = value.replace(/[,₹$€£¥]/g, '')
    const parsed = Number.parseFloat(cleaned)
    return Number.isNaN(parsed) ? 0 : parsed
}

const parseDateInput = (value?: string) => {
    if (!value) {
        return new Date()
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export default function StatementNewScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams<{ draft?: string; file?: string }>()
    const [isLoading, setIsLoading] = useState(false)

    const { currency, currencySymbol } = useSettingsStore()
    const { addStatement } = useStatementsStore()

    const draft = useMemo(() => {
        if (!params.draft) {
            return null
        }
        try {
            const parsed = JSON.parse(params.draft)
            const result = statementDraftSchema.safeParse(parsed)
            return result.success ? (result.data as StatementDraft) : null
        } catch {
            return null
        }
    }, [params.draft])

    const fileDraft = useMemo(() => {
        if (!params.file) {
            return null
        }
        try {
            const parsed = JSON.parse(params.file)
            const result = statementFileDraftSchema.safeParse(parsed)
            return result.success ? (result.data as StatementFileDraft) : null
        } catch {
            return null
        }
    }, [params.file])

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<StatementFormData>({
        defaultValues: {
            accountLabel: draft?.accountLabel ?? '',
            closingBalance:
                draft?.closingBalance !== null && draft?.closingBalance !== undefined
                    ? String(draft.closingBalance)
                    : '',
            fees: draft ? String(draft.fees ?? 0) : '0',
            grossExpense: draft ? String(draft.grossExpense ?? 0) : '0',
            grossIncome: draft ? String(draft.grossIncome ?? 0) : '0',
            notes: draft?.notes ?? '',
            openingBalance:
                draft?.openingBalance !== null && draft?.openingBalance !== undefined
                    ? String(draft.openingBalance)
                    : '',
            periodEnd: toDateInput(draft?.periodEnd),
            periodStart: toDateInput(draft?.periodStart),
            sourceName: draft?.sourceName ?? '',
            sourceType: draft?.sourceType ?? 'manual',
            taxes: draft ? String(draft.taxes ?? 0) : '0',
        },
        resolver: zodResolver(statementSchema),
    })

    const sourceType = watch('sourceType')
    const grossIncome = parseNumber(watch('grossIncome'))
    const grossExpense = parseNumber(watch('grossExpense'))
    const fees = parseNumber(watch('fees'))
    const taxes = parseNumber(watch('taxes'))
    const netProfit = grossIncome - grossExpense - fees - taxes

    const onSubmit = async (data: StatementFormData) => {
        try {
            setIsLoading(true)

            const statementId = Crypto.randomUUID()
            const newStatement = {
                accountLabel: data.accountLabel || null,
                closingBalance: data.closingBalance ? parseNumber(data.closingBalance) : null,
                createdAt: new Date(),
                currency: draft?.currency ?? currency,
                currencySymbol: draft?.currencySymbol ?? currencySymbol,
                fees,
                grossExpense,
                grossIncome,
                id: statementId,
                netProfit,
                notes: data.notes || '',
                openingBalance: data.openingBalance ? parseNumber(data.openingBalance) : null,
                periodEnd: parseDateInput(data.periodEnd),
                periodStart: parseDateInput(data.periodStart),
                sourceName: data.sourceName || null,
                sourceType: data.sourceType,
                taxes,
                updatedAt: new Date(),
            }

            await db.insert(statements).values(newStatement)

            if (fileDraft) {
                await db.insert(statementFiles).values({
                    createdAt: new Date(),
                    fileName: fileDraft.fileName,
                    fileSize: fileDraft.fileSize,
                    fileUri: fileDraft.fileUri,
                    id: Crypto.randomUUID(),
                    mimeType: fileDraft.mimeType ?? null,
                    parseMethod: fileDraft.parseMethod,
                    parseStatus: fileDraft.parseStatus,
                    statementId,
                })
            }

            addStatement(newStatement)
            router.back()
        } catch (error) {
            console.error('Error saving statement:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ScrollView
            className='flex-1 bg-slate-950'
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            <View className='px-4 py-6' style={{ paddingTop: insets.top }}>
                <View className='mb-8 flex-row items-center justify-between'>
                    <View>
                        <Text className='font-bold text-3xl text-white'>Statement Summary</Text>
                        <Text className='text-gray-400 text-sm'>
                            Review and save your P&amp;L summary
                        </Text>
                    </View>
                    <TouchableOpacity
                        className='h-10 w-10 items-center justify-center'
                        onPress={() => router.back()}
                    >
                        <Text className='font-bold text-2xl text-gray-400'>✕</Text>
                    </TouchableOpacity>
                </View>

                {fileDraft && draft?.sourceName && (
                    <View className='mb-4 rounded-lg border border-blue-800 bg-blue-900/20 p-4'>
                        <Text className='font-semibold text-white'>Template Detected</Text>
                        <Text className='text-blue-200 text-sm'>
                            {draft.sourceName} • {draft.sourceType.toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Source */}
                <View className='mb-4'>
                    <Text className='mb-2 font-medium text-white'>Source Type</Text>
                    <Controller
                        control={control}
                        name='sourceType'
                        render={({ field: { onChange, value } }) => (
                            <View className='flex-row gap-2'>
                                {(['bank', 'broker', 'manual', 'import'] as const).map(type => (
                                    <TouchableOpacity
                                        className={`flex-1 rounded-lg border-2 py-3 ${
                                            value === type
                                                ? 'border-blue-500 bg-blue-900/30'
                                                : 'border-gray-700 bg-gray-900'
                                        }`}
                                        key={type}
                                        onPress={() => onChange(type)}
                                    >
                                        <Text
                                            className={`text-center font-semibold ${
                                                value === type ? 'text-blue-400' : 'text-gray-400'
                                            }`}
                                        >
                                            {type.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    />
                </View>

                <View className='mb-4'>
                    <TextField
                        isInvalid={Boolean(errors.sourceName)}
                        isRequired={sourceType !== 'manual'}
                    >
                        <Label>Source Name</Label>
                        <Controller
                            control={control}
                            name='sourceName'
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    onChangeText={onChange}
                                    placeholder='e.g., HDFC Bank, Groww'
                                    value={value}
                                />
                            )}
                        />
                        {errors.sourceName?.message && (
                            <FieldError>{errors.sourceName.message}</FieldError>
                        )}
                    </TextField>
                </View>

                <View className='mb-4'>
                    <TextField>
                        <Label>Account Label</Label>
                        <Controller
                            control={control}
                            name='accountLabel'
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    onChangeText={onChange}
                                    placeholder='Savings, Trading, etc.'
                                    value={value}
                                />
                            )}
                        />
                    </TextField>
                </View>

                {/* Dates */}
                <View className='mb-4 flex-row gap-3'>
                    <View className='flex-1'>
                        <TextField isInvalid={Boolean(errors.periodStart)} isRequired>
                            <Label>Period Start</Label>
                            <Controller
                                control={control}
                                name='periodStart'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        onChangeText={onChange}
                                        placeholder='YYYY-MM-DD'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.periodStart?.message && (
                                <FieldError>{errors.periodStart.message}</FieldError>
                            )}
                        </TextField>
                    </View>
                    <View className='flex-1'>
                        <TextField isInvalid={Boolean(errors.periodEnd)} isRequired>
                            <Label>Period End</Label>
                            <Controller
                                control={control}
                                name='periodEnd'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        onChangeText={onChange}
                                        placeholder='YYYY-MM-DD'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.periodEnd?.message && (
                                <FieldError>{errors.periodEnd.message}</FieldError>
                            )}
                        </TextField>
                    </View>
                </View>

                {/* Totals */}
                <View className='mb-4 rounded-lg border border-gray-700 bg-gray-900 p-4'>
                    <Text className='mb-4 font-medium text-white'>Totals</Text>

                    <View className='mb-3'>
                        <TextField isInvalid={Boolean(errors.grossIncome)} isRequired>
                            <Label>Gross Income</Label>
                            <Controller
                                control={control}
                                name='grossIncome'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        keyboardType='decimal-pad'
                                        onChangeText={onChange}
                                        placeholder='0.00'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.grossIncome?.message && (
                                <FieldError>{errors.grossIncome.message}</FieldError>
                            )}
                        </TextField>
                    </View>

                    <View className='mb-3'>
                        <TextField isInvalid={Boolean(errors.grossExpense)} isRequired>
                            <Label>Gross Expense</Label>
                            <Controller
                                control={control}
                                name='grossExpense'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        keyboardType='decimal-pad'
                                        onChangeText={onChange}
                                        placeholder='0.00'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.grossExpense?.message && (
                                <FieldError>{errors.grossExpense.message}</FieldError>
                            )}
                        </TextField>
                    </View>

                    <View className='mb-3'>
                        <TextField isInvalid={Boolean(errors.fees)}>
                            <Label>Fees</Label>
                            <Controller
                                control={control}
                                name='fees'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        keyboardType='decimal-pad'
                                        onChangeText={onChange}
                                        placeholder='0.00'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.fees?.message && <FieldError>{errors.fees.message}</FieldError>}
                        </TextField>
                    </View>

                    <View className='mb-3'>
                        <TextField isInvalid={Boolean(errors.taxes)}>
                            <Label>Taxes</Label>
                            <Controller
                                control={control}
                                name='taxes'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        keyboardType='decimal-pad'
                                        onChangeText={onChange}
                                        placeholder='0.00'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.taxes?.message && (
                                <FieldError>{errors.taxes.message}</FieldError>
                            )}
                        </TextField>
                    </View>

                    <View className='rounded-lg border border-gray-700 bg-gray-800 p-3'>
                        <Text className='text-gray-400 text-xs'>Net Profit</Text>
                        <Text
                            className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                            {currencySymbol}
                            {netProfit.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Balances */}
                <View className='mb-4 rounded-lg border border-gray-700 bg-gray-900 p-4'>
                    <Text className='mb-3 font-medium text-white'>Balances (Optional)</Text>
                    <View className='mb-3'>
                        <TextField isInvalid={Boolean(errors.openingBalance)}>
                            <Label>Opening Balance</Label>
                            <Controller
                                control={control}
                                name='openingBalance'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        keyboardType='decimal-pad'
                                        onChangeText={onChange}
                                        placeholder='0.00'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.openingBalance?.message && (
                                <FieldError>{errors.openingBalance.message}</FieldError>
                            )}
                        </TextField>
                    </View>
                    <View>
                        <TextField isInvalid={Boolean(errors.closingBalance)}>
                            <Label>Closing Balance</Label>
                            <Controller
                                control={control}
                                name='closingBalance'
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        keyboardType='decimal-pad'
                                        onChangeText={onChange}
                                        placeholder='0.00'
                                        value={value}
                                    />
                                )}
                            />
                            {errors.closingBalance?.message && (
                                <FieldError>{errors.closingBalance.message}</FieldError>
                            )}
                        </TextField>
                    </View>
                </View>

                {/* Notes */}
                <View className='mb-6'>
                    <TextField>
                        <Label>Notes</Label>
                        <Controller
                            control={control}
                            name='notes'
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    className='min-h-[96px] py-3'
                                    multiline
                                    numberOfLines={4}
                                    onChangeText={onChange}
                                    placeholder='Add notes about this statement...'
                                    value={value}
                                />
                            )}
                        />
                    </TextField>
                </View>

                {/* Buttons */}
                <View className='gap-3'>
                    <Button isDisabled={isLoading} onPress={handleSubmit(onSubmit)}>
                        {isLoading ? (
                            <ActivityIndicator color='white' />
                        ) : (
                            <Button.Label>Save Summary</Button.Label>
                        )}
                    </Button>
                    <Button isDisabled={isLoading} onPress={() => router.back()} variant='outline'>
                        <Button.Label>Cancel</Button.Label>
                    </Button>
                </View>
            </View>
        </ScrollView>
    )
}
