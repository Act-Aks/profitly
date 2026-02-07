/** biome-ignore-all lint/performance/noNamespaceImport: Ignore */
import * as Crypto from 'expo-crypto'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EarningsGrowthChart } from '@/components/organisms/EarningsGrowthChart/EarningsGrowthChart'
import { useSettingsStore } from '@/stores/settings.store'
import { useStatementsStore } from '@/stores/statements.store'
import { db } from '@/utils/database'
import { statementFiles, statements } from '@/utils/database/schema'
import {
    buildEarningsGrowthSeries,
    buildStatementFromOfx,
    type StatementDraft,
    type StatementFileDraft,
} from '@/utils/statements'
import { getStatementTemplates } from '@/utils/statementTemplates'

type StatementFileMap = Record<string, typeof statementFiles.$inferSelect | undefined>

const detectParseMethod = (fileName?: string | null, mimeType?: string | null) => {
    const extension = fileName?.split('.').pop()?.toLowerCase()
    if (mimeType?.includes('csv') || extension === 'csv') {
        return 'csv' as const
    }
    if (extension === 'ofx' || extension === 'qfx' || mimeType?.includes('ofx')) {
        return extension === 'qfx' ? ('qfx' as const) : ('ofx' as const)
    }
    if (mimeType?.includes('pdf') || extension === 'pdf') {
        return 'pdf' as const
    }
    if (
        mimeType?.startsWith('image/') ||
        ['jpg', 'jpeg', 'png', 'heic'].includes(extension ?? '')
    ) {
        return 'image' as const
    }
    return 'unknown' as const
}

export default function ImportScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [isLoading, setIsLoading] = useState(false)
    const [filesByStatement, setFilesByStatement] = useState<StatementFileMap>({})

    const { currency, currencySymbol } = useSettingsStore()
    const { statements: storedStatements, setStatements } = useStatementsStore()

    const loadStatements = useCallback(async () => {
        const allStatements = await db.select().from(statements)
        setStatements(allStatements)

        const allFiles = await db.select().from(statementFiles)
        const fileMap: StatementFileMap = {}
        for (const file of allFiles) {
            const current = fileMap[file.statementId]
            const fileCreatedAt = new Date(file.createdAt).getTime()
            const currentCreatedAt = current ? new Date(current.createdAt).getTime() : -1
            if (!current || fileCreatedAt > currentCreatedAt) {
                fileMap[file.statementId] = file
            }
        }
        setFilesByStatement(fileMap)
    }, [setStatements])

    useFocusEffect(
        useCallback(() => {
            loadStatements()
        }, [loadStatements])
    )

    const totals = useMemo(() => {
        return storedStatements.reduce(
            (acc, statement) => {
                acc.net += statement.netProfit || 0
                acc.income += statement.grossIncome || 0
                acc.expense += statement.grossExpense || 0
                return acc
            },
            { expense: 0, income: 0, net: 0 }
        )
    }, [storedStatements])

    const growthSeries = useMemo(
        () => buildEarningsGrowthSeries(storedStatements),
        [storedStatements]
    )

    const handlePickDocument = useCallback(async () => {
        try {
            setIsLoading(true)
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                type: '*/*',
            })

            if (result.canceled) {
                return
            }

            const asset = result.assets[0]
            if (!asset.uri) {
                throw new Error('No file URI')
            }

            const destinationDir = `${FileSystem.documentDirectory}statements`
            await FileSystem.makeDirectoryAsync(destinationDir, { intermediates: true })
            const destinationPath = `${destinationDir}/${Crypto.randomUUID()}-${asset.name || 'statement'}`
            await FileSystem.copyAsync({ from: asset.uri, to: destinationPath })

            const parseMethod = detectParseMethod(asset.name, asset.mimeType)

            let draft: StatementDraft | null = null
            let parseStatus: StatementFileDraft['parseStatus'] = 'partial'

            if (parseMethod === 'csv') {
                const fileDraft: StatementFileDraft = {
                    fileName: asset.name || 'statement',
                    fileSize: asset.size ?? 0,
                    fileUri: destinationPath,
                    mimeType: asset.mimeType ?? null,
                    parseMethod,
                    parseStatus,
                }

                router.push({
                    params: {
                        file: JSON.stringify(fileDraft),
                    },
                    pathname: '/statement-template',
                })
                return
            }
            if (parseMethod === 'ofx' || parseMethod === 'qfx') {
                const fileContent = await FileSystem.readAsStringAsync(destinationPath, {
                    encoding: FileSystem.EncodingType.UTF8,
                })
                const result = buildStatementFromOfx(fileContent, currency, currencySymbol)
                draft = {
                    ...result.statement,
                    sourceName: result.statement.sourceName ?? 'Bank Statement',
                    sourceType: 'bank',
                }
                parseStatus = result.transactionCount > 0 ? 'success' : 'partial'
            }

            const fileDraft: StatementFileDraft = {
                fileName: asset.name || 'statement',
                fileSize: asset.size ?? 0,
                fileUri: destinationPath,
                mimeType: asset.mimeType ?? null,
                parseMethod,
                parseStatus,
            }

            const fallbackDraft: StatementDraft = {
                accountLabel: null,
                closingBalance: null,
                currency,
                currencySymbol,
                fees: 0,
                grossExpense: 0,
                grossIncome: 0,
                netProfit: 0,
                notes: '',
                openingBalance: null,
                periodEnd: new Date(),
                periodStart: new Date(),
                sourceName: null,
                sourceType: 'import',
                taxes: 0,
            }

            router.push({
                params: {
                    draft: JSON.stringify(draft ?? fallbackDraft),
                    file: JSON.stringify(fileDraft),
                },
                pathname: '/statement-new',
            })
        } catch (error) {
            console.error('Error importing file:', error)
        } finally {
            setIsLoading(false)
        }
    }, [currency, currencySymbol, router])

    return (
        <View className='flex-1 bg-slate-950'>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className='px-4 py-6' style={{ paddingTop: insets.top }}>
                    {/* Header */}
                    <View className='mb-8 flex-row items-center justify-between'>
                        <View>
                            <Text className='font-bold text-3xl text-white'>Statements</Text>
                            <Text className='text-gray-400 text-sm'>
                                Local summaries from bank and broker P&L
                            </Text>
                        </View>
                        <TouchableOpacity
                            className='h-12 w-12 items-center justify-center rounded-lg bg-blue-600'
                            onPress={() => router.push('/statement-new')}
                        >
                            <Text className='font-bold text-white text-xl'>+</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary */}
                    <View className='mb-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-6'>
                        <Text className='mb-2 text-gray-400 text-sm'>Net Earnings</Text>
                        <Text
                            className={`mb-4 font-bold text-4xl ${totals.net >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                            {currencySymbol}
                            {totals.net.toFixed(2)}
                        </Text>
                        <View className='flex-row justify-between'>
                            <View>
                                <Text className='text-gray-400 text-xs'>Income</Text>
                                <Text className='font-semibold text-green-400'>
                                    {currencySymbol}
                                    {totals.income.toFixed(2)}
                                </Text>
                            </View>
                            <View>
                                <Text className='text-gray-400 text-xs'>Expenses</Text>
                                <Text className='font-semibold text-red-400'>
                                    {currencySymbol}
                                    {totals.expense.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Chart */}
                    {growthSeries.length > 0 ? (
                        <EarningsGrowthChart currencySymbol={currencySymbol} data={growthSeries} />
                    ) : (
                        <View className='mb-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-6'>
                            <Text className='mb-2 font-semibold text-white'>Earnings Growth</Text>
                            <Text className='text-gray-400 text-sm'>
                                Import a statement to unlock the chart.
                            </Text>
                        </View>
                    )}

                    {/* Import Card */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className='mb-6 rounded-2xl border-2 border-blue-500 border-dashed bg-blue-900/20 p-6'
                        disabled={isLoading}
                        onPress={handlePickDocument}
                    >
                        {isLoading ? (
                            <View className='items-center'>
                                <ActivityIndicator color='#3b82f6' size='large' />
                                <Text className='mt-3 text-gray-400'>Processing...</Text>
                            </View>
                        ) : (
                            <View className='items-center'>
                                <Text className='mb-2 text-3xl'>📄</Text>
                                <Text className='mb-1 font-semibold text-white'>
                                    Import Statement
                                </Text>
                                <Text className='text-center text-gray-400 text-sm'>
                                    CSV, OFX/QFX, PDF, or images are supported
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Templates */}
                    <View className='mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-3 font-semibold text-white'>Supported Templates</Text>
                        <View className='flex-row flex-wrap gap-2'>
                            {getStatementTemplates().map(template => (
                                <View
                                    className='rounded-full border border-gray-700 bg-gray-800 px-3 py-1'
                                    key={template.id}
                                >
                                    <Text className='text-gray-300 text-xs'>{template.name}</Text>
                                </View>
                            ))}
                        </View>
                        <Text className='mt-3 text-gray-400 text-xs'>
                            Other banks: we auto-detect common debit/credit/balance columns.
                        </Text>
                    </View>

                    {/* Statement List */}
                    <View>
                        <Text className='mb-4 font-semibold text-white'>Recent Statements</Text>
                        {storedStatements.length === 0 ? (
                            <View className='rounded-2xl border border-gray-800 bg-gray-900/50 p-6'>
                                <Text className='text-center text-gray-400'>
                                    No statements yet. Import one or add manually.
                                </Text>
                            </View>
                        ) : (
                            <View className='gap-3'>
                                {[...storedStatements]
                                    .sort(
                                        (a, b) =>
                                            new Date(b.periodEnd).getTime() -
                                            new Date(a.periodEnd).getTime()
                                    )
                                    .slice(0, 10)
                                    .map(statement => {
                                        const file = filesByStatement[statement.id]
                                        const isProfit = (statement.netProfit || 0) >= 0
                                        return (
                                            <TouchableOpacity
                                                className='rounded-lg border border-gray-800 bg-gray-900/50 p-4 active:opacity-70'
                                                key={statement.id}
                                                onPress={() =>
                                                    router.push({
                                                        params: { id: statement.id },
                                                        pathname: '/statement-detail/[id]',
                                                    })
                                                }
                                            >
                                                <View className='flex-row items-center justify-between'>
                                                    <View className='flex-1'>
                                                        <Text className='font-semibold text-lg text-white'>
                                                            {statement.sourceName ||
                                                                statement.sourceType.toUpperCase()}
                                                        </Text>
                                                        <Text className='text-gray-400 text-xs'>
                                                            {new Date(
                                                                statement.periodStart
                                                            ).toLocaleDateString('en-US')}{' '}
                                                            -{' '}
                                                            {new Date(
                                                                statement.periodEnd
                                                            ).toLocaleDateString('en-US')}
                                                        </Text>
                                                        {file && (
                                                            <Text className='mt-1 text-gray-500 text-xs'>
                                                                {file.fileName}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View className='items-end'>
                                                        <Text
                                                            className={`font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}
                                                        >
                                                            {isProfit ? '+' : '-'}
                                                            {statement.currencySymbol}
                                                            {Math.abs(
                                                                statement.netProfit || 0
                                                            ).toFixed(2)}
                                                        </Text>
                                                        <Text className='text-gray-500 text-xs'>
                                                            {statement.currency}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    })}
                            </View>
                        )}
                    </View>

                    {/* Tips */}
                    <View className='mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-2 font-semibold text-white'>💡 Tips</Text>
                        <Text className='text-gray-400 text-sm'>
                            • Use the template picker for best CSV accuracy{'\n'}• CSV and OFX/QFX
                            files are auto-parsed{'\n'}• PDF/image files are attached for manual
                            review{'\n'}• All data stays on your device
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}
