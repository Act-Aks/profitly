import { eq } from 'drizzle-orm'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { db } from '@/utils/database'
import { statementFiles, statements } from '@/utils/database/schema'

export default function StatementDetailScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { id } = useLocalSearchParams<{ id: string }>()

    const [isLoading, setIsLoading] = useState(true)
    const [statement, setStatement] = useState<typeof statements.$inferSelect | null>(null)
    const [file, setFile] = useState<typeof statementFiles.$inferSelect | null>(null)

    useEffect(() => {
        const load = async () => {
            if (!id) {
                return
            }
            try {
                setIsLoading(true)
                const result = await db.select().from(statements).where(eq(statements.id, id))
                const statementResult = result[0]
                setStatement(statementResult ?? null)
                if (statementResult) {
                    const files = await db
                        .select()
                        .from(statementFiles)
                        .where(eq(statementFiles.statementId, statementResult.id))
                    if (files.length > 0) {
                        setFile(
                            files.sort(
                                (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime()
                            )[0]
                        )
                    }
                }
            } catch (error) {
                console.error('Error loading statement:', error)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [id])

    if (isLoading) {
        return (
            <View className='flex-1 items-center justify-center bg-slate-950'>
                <ActivityIndicator color='#3b82f6' size='large' />
            </View>
        )
    }

    if (!statement) {
        return (
            <View className='flex-1 items-center justify-center bg-slate-950'>
                <Text className='text-gray-400'>Statement not found.</Text>
            </View>
        )
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
                        <Text className='font-bold text-3xl text-white'>Statement</Text>
                        <Text className='text-gray-400 text-sm'>
                            {statement.sourceName || statement.sourceType.toUpperCase()}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className='h-10 w-10 items-center justify-center'
                        onPress={() => router.back()}
                    >
                        <Text className='font-bold text-2xl text-gray-400'>✕</Text>
                    </TouchableOpacity>
                </View>

                <View className='mb-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-6'>
                    <Text className='mb-2 text-gray-400 text-sm'>Net Profit</Text>
                    <Text
                        className={`mb-2 font-bold text-4xl ${
                            statement.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                    >
                        {statement.currencySymbol}
                        {statement.netProfit.toFixed(2)}
                    </Text>
                    <Text className='text-gray-400 text-xs'>
                        {new Date(statement.periodStart).toLocaleDateString('en-US')} -{' '}
                        {new Date(statement.periodEnd).toLocaleDateString('en-US')}
                    </Text>
                </View>

                <View className='mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                    <Text className='mb-3 font-semibold text-white'>Breakdown</Text>
                    <View className='flex-row justify-between'>
                        <Text className='text-gray-400'>Income</Text>
                        <Text className='text-green-400'>
                            {statement.currencySymbol}
                            {statement.grossIncome.toFixed(2)}
                        </Text>
                    </View>
                    <View className='mt-2 flex-row justify-between'>
                        <Text className='text-gray-400'>Expenses</Text>
                        <Text className='text-red-400'>
                            {statement.currencySymbol}
                            {statement.grossExpense.toFixed(2)}
                        </Text>
                    </View>
                    <View className='mt-2 flex-row justify-between'>
                        <Text className='text-gray-400'>Fees</Text>
                        <Text className='text-gray-200'>
                            {statement.currencySymbol}
                            {statement.fees.toFixed(2)}
                        </Text>
                    </View>
                    <View className='mt-2 flex-row justify-between'>
                        <Text className='text-gray-400'>Taxes</Text>
                        <Text className='text-gray-200'>
                            {statement.currencySymbol}
                            {statement.taxes.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {(statement.openingBalance !== null || statement.closingBalance !== null) && (
                    <View className='mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-3 font-semibold text-white'>Balances</Text>
                        {statement.openingBalance !== null && (
                            <View className='flex-row justify-between'>
                                <Text className='text-gray-400'>Opening</Text>
                                <Text className='text-gray-200'>
                                    {statement.currencySymbol}
                                    {statement.openingBalance.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        {statement.closingBalance !== null && (
                            <View className='mt-2 flex-row justify-between'>
                                <Text className='text-gray-400'>Closing</Text>
                                <Text className='text-gray-200'>
                                    {statement.currencySymbol}
                                    {statement.closingBalance.toFixed(2)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {statement.notes ? (
                    <View className='mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-2 font-semibold text-white'>Notes</Text>
                        <Text className='text-gray-400 text-sm'>{statement.notes}</Text>
                    </View>
                ) : null}

                {file && (
                    <TouchableOpacity
                        className='flex-row items-center rounded-lg border border-gray-800 bg-gray-900/50 p-4 active:opacity-70'
                        onPress={() => Linking.openURL(file.fileUri)}
                    >
                        <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-blue-600'>
                            <Text className='text-lg'>📎</Text>
                        </View>
                        <View className='flex-1'>
                            <Text className='font-semibold text-white'>Open Attachment</Text>
                            <Text className='text-gray-400 text-xs'>{file.fileName}</Text>
                        </View>
                        <Text className='text-gray-400'>›</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    )
}
