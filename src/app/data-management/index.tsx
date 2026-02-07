import { eq } from 'drizzle-orm'
import * as FileSystem from 'expo-file-system'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettingsStore } from '@/stores/settings.store'
import { useStatementsStore } from '@/stores/statements.store'
import { db } from '@/utils/database'
import { statementFiles, statements } from '@/utils/database/schema'

export default function DataManagementScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [isLoading, setIsLoading] = useState(false)
    const [exportMessage, setExportMessage] = useState('')

    const { resetStatements } = useStatementsStore()
    const { resetSettings } = useSettingsStore()

    const handleClearAllData = async () => {
        try {
            setIsLoading(true)
            setExportMessage('Clearing all data...')

            const allStatements = await db.select().from(statements)
            for (const statement of allStatements) {
                await db.delete(statements).where(eq(statements.id, statement.id))
            }

            const allFiles = await db.select().from(statementFiles)
            for (const file of allFiles) {
                try {
                    await FileSystem.deleteAsync(file.fileUri, { idempotent: true })
                } catch {
                    // Best-effort cleanup
                }
                await db.delete(statementFiles).where(eq(statementFiles.id, file.id))
            }

            // Reset stores
            resetStatements()
            resetSettings()

            setExportMessage('✓ All data cleared')
            setTimeout(() => {
                router.replace('/(tabs)')
            }, 1000)
        } catch (error) {
            console.error('Error clearing data:', error)
            setExportMessage('Error clearing data')
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
                {/* Header */}
                <View className='mb-8 flex-row items-center justify-between'>
                    <View>
                        <Text className='font-bold text-3xl text-white'>Data Management</Text>
                        <Text className='text-gray-400 text-sm'>Manage your statement data</Text>
                    </View>
                    <TouchableOpacity
                        className='h-10 w-10 items-center justify-center'
                        onPress={() => router.back()}
                    >
                        <Text className='font-bold text-2xl text-gray-400'>✕</Text>
                    </TouchableOpacity>
                </View>

                <View className='mb-6'>
                    <Text className='mb-3 font-semibold text-white'>Export Data</Text>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className='flex-row items-center rounded-lg border border-blue-800 bg-blue-900/20 p-4 disabled:opacity-50'
                        disabled={isLoading}
                        onPress={async () => {
                            try {
                                setIsLoading(true)
                                setExportMessage('Exporting statement summaries...')

                                const allStatements = await db.select().from(statements)
                                const headers = [
                                    'ID',
                                    'Source Type',
                                    'Source Name',
                                    'Period Start',
                                    'Period End',
                                    'Gross Income',
                                    'Gross Expense',
                                    'Fees',
                                    'Taxes',
                                    'Net Profit',
                                    'Currency',
                                ]
                                const rows = allStatements.map(statement => [
                                    statement.id,
                                    statement.sourceType,
                                    statement.sourceName || '',
                                    statement.periodStart
                                        ? new Date(statement.periodStart).toISOString()
                                        : '',
                                    statement.periodEnd
                                        ? new Date(statement.periodEnd).toISOString()
                                        : '',
                                    statement.grossIncome,
                                    statement.grossExpense,
                                    statement.fees,
                                    statement.taxes,
                                    statement.netProfit,
                                    statement.currency,
                                ])

                                const csvContent = [
                                    headers.join(','),
                                    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
                                ].join('\n')

                                const fileName = `profitly-statements-${new Date().toISOString().split('T')[0]}.csv`
                                const filePath = `${FileSystem.documentDirectory}${fileName}`

                                await FileSystem.writeAsStringAsync(filePath, csvContent, {
                                    encoding: FileSystem.EncodingType.UTF8,
                                })

                                setExportMessage(
                                    `✓ Exported ${allStatements.length} statements to ${fileName}`
                                )
                            } catch (error) {
                                console.error('Error exporting statements:', error)
                                setExportMessage('Error exporting statements')
                            } finally {
                                setIsLoading(false)
                            }
                        }}
                    >
                        <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-blue-600'>
                            <Text className='text-lg'>🧾</Text>
                        </View>
                        <View className='flex-1'>
                            <Text className='font-semibold text-white'>
                                Export Statement Summaries
                            </Text>
                            <Text className='text-gray-400 text-xs'>
                                Download your P&amp;L summaries
                            </Text>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator color='#3b82f6' size='small' />
                        ) : (
                            <Text className='text-gray-400'>›</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Export Message */}
                {exportMessage && (
                    <View className='mb-6 rounded-lg border border-blue-800 bg-blue-900/20 p-4'>
                        <Text className='text-center text-blue-400 text-sm'>{exportMessage}</Text>
                    </View>
                )}

                {/* Data Statistics */}
                <View className='mb-6'>
                    <Text className='mb-3 font-semibold text-white'>Statistics</Text>
                    <View className='gap-3'>
                        <View className='rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                            <Text className='text-gray-400 text-sm'>Local Database Size</Text>
                            <Text className='font-semibold text-lg text-white'>
                                Profitly stores statement summaries locally
                            </Text>
                        </View>
                        <View className='rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                            <Text className='text-gray-400 text-sm'>Data Storage</Text>
                            <Text className='font-semibold text-lg text-white'>
                                SQLite + MMKV Storage
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Danger Zone */}
                <View>
                    <Text className='mb-3 font-semibold text-red-400'>Danger Zone</Text>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className='flex-row items-center rounded-lg border border-red-800 bg-red-900/20 p-4 disabled:opacity-50'
                        disabled={isLoading}
                        onPress={handleClearAllData}
                    >
                        <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-red-600'>
                            <Text className='text-lg'>🗑️</Text>
                        </View>
                        <View className='flex-1'>
                            <Text className='font-semibold text-red-400'>Clear All Data</Text>
                            <Text className='text-gray-400 text-xs'>
                                Delete all statements and settings
                            </Text>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator color='#ef4444' size='small' />
                        ) : (
                            <Text className='text-gray-400'>›</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View className='mt-8 rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                    <Text className='mb-2 font-semibold text-white'>💡 About Your Data</Text>
                    <Text className='text-gray-400 text-sm'>
                        • All data is stored locally on your device{'\n'}• No data is sent to
                        external servers{'\n'}• Your privacy is our priority{'\n'}• Export anytime
                        for backup
                    </Text>
                </View>
            </View>
        </ScrollView>
    )
}
