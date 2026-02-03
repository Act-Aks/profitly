import { Card } from 'heroui-native'
import { Dimensions, Text, useColorScheme, View } from 'react-native'
import {
    Bar as VictoryAxis,
    Axis as VictoryBar,
    Axis as VictoryChart,
    Axis as VictoryGroup,
    Axis as VictoryLegend,
} from 'victory-native'

interface ProfitLossChartProps {
    data: {
        month: string
        income: number
        expense: number
        profit: number
    }[]
}

export function ProfitLossChart({ data }: ProfitLossChartProps) {
    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const { width } = Dimensions.get('window')

    const chartWidth = width - 64

    const incomeData = data.map(d => ({ x: d.month, y: d.income }))
    const expenseData = data.map(d => ({ x: d.month, y: d.expense }))

    const axisStyle = {
        axis: { stroke: isDark ? '#475569' : '#e2e8f0' },
        grid: {
            stroke: isDark ? '#334155' : '#f1f5f9',
            strokeDasharray: '4, 4',
        },
        tickLabels: {
            fill: isDark ? '#94a3b8' : '#64748b',
            fontFamily: 'Inter',
            fontSize: 10,
        },
    }

    return (
        <Card className='mb-4' variant='default'>
            <Text className='mb-4 font-semibold text-dark-900 text-lg dark:text-dark-50'>
                Income vs Expenses
            </Text>

            <View style={{ alignItems: 'center' }}>
                <VictoryChart
                    domainPadding={{ x: 20 }}
                    height={220}
                    padding={{ bottom: 50, left: 60, right: 20, top: 40 }}
                    width={chartWidth}
                >
                    <VictoryLegend
                        data={[
                            { name: 'Income', symbol: { fill: '#22c55e' } },
                            { name: 'Expense', symbol: { fill: '#ef4444' } },
                        ]}
                        gutter={20}
                        orientation='horizontal'
                        style={{
                            labels: { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
                        }}
                        x={chartWidth / 2 - 80}
                        y={0}
                    />

                    <VictoryAxis style={axisStyle} />
                    <VictoryAxis
                        dependentAxis
                        style={axisStyle}
                        tickFormat={t => `$${t / 1000}k`}
                    />

                    <VictoryGroup offset={12}>
                        <VictoryBar
                            animate={{
                                duration: 500,
                                onLoad: { duration: 500 },
                            }}
                            cornerRadius={{ top: 4 }}
                            data={incomeData}
                            style={{
                                data: {
                                    fill: '#22c55e',
                                    width: 10,
                                },
                            }}
                        />
                        <VictoryBar
                            animate={{
                                duration: 500,
                                onLoad: { duration: 500 },
                            }}
                            cornerRadius={{ top: 4 }}
                            data={expenseData}
                            style={{
                                data: {
                                    fill: '#ef4444',
                                    width: 10,
                                },
                            }}
                        />
                    </VictoryGroup>
                </VictoryChart>
            </View>
        </Card>
    )
}
