import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EarningsGrowthChart } from '@/components/organisms/EarningsGrowthChart/EarningsGrowthChart'
import { useSettingsStore } from '@/stores/settings.store'
import { useStatementsStore } from '@/stores/statements.store'
import { db } from '@/utils/database'
import { statements } from '@/utils/database/schema'
import { buildEarningsGrowthSeries } from '@/utils/statements'

export default function DashboardScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [isLoading, setIsLoading] = useState(true)

    const { currencySymbol } = useSettingsStore()
    const { statements: storedStatements, setStatements } = useStatementsStore()

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)

            const allStatements = await db.select().from(statements)
            setStatements(allStatements)
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [setStatements])

    useEffect(() => {
        loadData()
    }, [loadData])

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

    const recentStatements = useMemo(
        () =>
            [...storedStatements]
                .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())
                .slice(0, 5),
        [storedStatements]
    )

    if (isLoading) {
        return (
            <View className='flex-1 items-center justify-center bg-slate-950'>
                <ActivityIndicator color='#3b82f6' size='large' />
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
                {/* Header */}
                <View className='mb-8 flex-row items-center justify-between'>
                    <View>
                        <Text className='font-bold text-3xl text-white'>Profitly</Text>
                        <Text className='text-gray-400 text-sm'>Track your P&L locally</Text>
                    </View>
                    <TouchableOpacity
                        className='h-12 w-12 items-center justify-center rounded-lg bg-blue-600'
                        onPress={() => router.navigate({ params: {}, pathname: '/statement-new' })}
                    >
                        <Text className='font-bold text-white text-xl'>+</Text>
                    </TouchableOpacity>
                </View>

                {/* P&L Summary Card */}
                <View className='mb-6 rounded-2xl border border-gray-800 bg-linear-to-br from-gray-900 to-gray-800 p-6'>
                    <Text className='mb-4 font-medium text-gray-400 text-sm'>Total Net</Text>
                    <Text
                        className={`mb-2 font-bold text-4xl ${totals.net >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                        {currencySymbol}
                        {totals.net.toFixed(2)}
                    </Text>
                    <View className='flex-row items-center gap-2'>
                        <View className='flex-1 rounded-full bg-gray-700' style={{ height: 4 }}>
                            <View
                                className={totals.net >= 0 ? 'bg-green-400' : 'bg-red-400'}
                                style={{
                                    height: 4,
                                    width: `${Math.min((Math.abs(totals.net) / 10_000) * 100, 100)}%`,
                                }}
                            />
                        </View>
                        <Text className={totals.net >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {totals.net >= 0 ? '+' : ''}
                            {((totals.net / 10_000) * 100).toFixed(1)}%
                        </Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className='mb-6 flex-row gap-4'>
                    <View className='flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-2 text-gray-400 text-xs'>Income</Text>
                        <Text className='font-bold text-2xl text-white'>
                            {currencySymbol}
                            {totals.income.toFixed(0)}
                        </Text>
                    </View>
                    <View className='flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                        <Text className='mb-2 text-gray-400 text-xs'>Expenses</Text>
                        <Text className='font-bold text-2xl text-white'>
                            {currencySymbol}
                            {totals.expense.toFixed(0)}
                        </Text>
                    </View>
                </View>

                {/* Earnings Growth */}
                {growthSeries.length > 0 ? (
                    <EarningsGrowthChart currencySymbol={currencySymbol} data={growthSeries} />
                ) : (
                    <View className='mb-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-6'>
                        <Text className='mb-2 font-semibold text-white'>Earnings Growth</Text>
                        <Text className='text-gray-400 text-sm'>
                            Add your first statement summary to see the growth chart.
                        </Text>
                    </View>
                )}

                {/* Recent Statements */}
                {recentStatements.length > 0 ? (
                    <View className='mb-8'>
                        <Text className='mb-4 font-semibold text-white'>Recent Statements</Text>
                        <View className='gap-3'>
                            {recentStatements.map(statement => {
                                const isProfit = (statement.netProfit || 0) > 0
                                const formattedDate = statement.periodEnd
                                    ? new Date(statement.periodEnd).toLocaleDateString('en-US', {
                                          day: 'numeric',
                                          month: 'short',
                                      })
                                    : 'N/A'

                                return (
                                    <TouchableOpacity
                                        className='rounded-lg border border-gray-800 bg-gray-900/50 p-4 active:opacity-70'
                                        key={statement.id}
                                        onPress={() =>
                                            router.navigate({
                                                params: { id: statement.id },
                                                pathname: '/statement-detail/[id]',
                                            })
                                        }
                                    >
                                        <View className='flex-row items-start justify-between'>
                                            <View className='flex-1'>
                                                <View className='mb-2 flex-row items-center gap-2'>
                                                    <Text className='font-semibold text-lg text-white'>
                                                        {statement.sourceName ||
                                                            statement.sourceType.toUpperCase()}
                                                    </Text>
                                                    <View
                                                        className={`rounded-full px-2 py-1 ${
                                                            isProfit
                                                                ? 'bg-green-900/50'
                                                                : 'bg-red-900/50'
                                                        }`}
                                                    >
                                                        <Text
                                                            className={`font-medium text-xs ${
                                                                isProfit
                                                                    ? 'text-green-400'
                                                                    : 'text-red-400'
                                                            }`}
                                                        >
                                                            {isProfit ? 'PROFIT' : 'LOSS'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text className='text-gray-400 text-xs'>
                                                    {formattedDate}
                                                </Text>
                                            </View>
                                            <View className='items-end'>
                                                <Text
                                                    className={`font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}
                                                >
                                                    {isProfit ? '+' : ''}
                                                    {statement.currencySymbol}
                                                    {(statement.netProfit || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>
                ) : (
                    <View className='mb-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-6'>
                        <Text className='text-center text-gray-400'>
                            No statements yet. Add your first summary!
                        </Text>
                    </View>
                )}

                {/* Quick Actions */}
                <View className='gap-3'>
                    <TouchableOpacity
                        className='flex-row items-center rounded-xl border border-gray-800 bg-gray-900/50 p-4 active:opacity-70'
                        onPress={() => router.navigate({ params: {}, pathname: '/statement-new' })}
                    >
                        <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-emerald-600'>
                            <Text className='text-lg'>📊</Text>
                        </View>
                        <View className='flex-1'>
                            <Text className='font-semibold text-white'>Add Summary</Text>
                            <Text className='text-gray-400 text-xs'>Log a manual statement</Text>
                        </View>
                        <Text className='text-gray-400'>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className='flex-row items-center rounded-xl border border-gray-800 bg-gray-900/50 p-4 active:opacity-70'
                        onPress={() =>
                            router.navigate({
                                params: {},
                                pathname: '/(tabs)/import',
                            })
                        }
                    >
                        <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-purple-600'>
                            <Text className='text-lg'>📁</Text>
                        </View>
                        <View className='flex-1'>
                            <Text className='font-semibold text-white'>Import Statements</Text>
                            <Text className='text-gray-400 text-xs'>Upload P&L documents</Text>
                        </View>
                        <Text className='text-gray-400'>›</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    )
}
