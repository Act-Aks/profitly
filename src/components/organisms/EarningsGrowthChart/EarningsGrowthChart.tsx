import {
    Canvas,
    Group,
    Circle as SkCircle,
    Skia,
    Line as SkLine,
    Path as SkPath,
} from '@shopify/react-native-skia'
import { format } from 'date-fns'
import { Card } from 'heroui-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Animated,
    Dimensions,
    type GestureResponderEvent,
    Text,
    type TextStyle,
    useColorScheme,
    View,
    type ViewStyle,
} from 'react-native'
import { CartesianChart } from 'victory-native'

interface EarningsPoint {
    x: Date | string | number
    y: number
    net?: number
}

interface EarningsGrowthChartProps {
    currencySymbol: string
    data: EarningsPoint[]
    title?: string
    // toggle enhancements
    showGrid?: boolean
    showMarkers?: boolean
    animatedTooltip?: boolean
    // if true, tooltip stays visible after interaction until toggled off programmatically
    persistentTooltip?: boolean
    // height override
    height?: number
}

type Scale = (value: number | string) => number

interface ChartBounds {
    left: number
    right: number
    top: number
    bottom: number
}

interface SeriesPoint {
    x: number
    xValue: string | number
    y: number
    yValue: number | string | null
}

interface CartesianRenderArgs {
    points: { value: SeriesPoint[] } | undefined
    xScale: Scale
    yScale: Scale
    chartBounds: ChartBounds
    xTicks: (number | string)[]
    yTicks: (number | string)[]
}

/**
 * EarningsGrowthChart (Cartesian + Skia enhancements)
 *
 * - Draws area/line using CartesianChart child render function (Victory Native)
 * - Renders grid lines & markers using Skia primitives inside the render function (fast)
 * - Provides a React Native overlay for touch handling and an animated tooltip
 * - Supports persistent tooltip (crosshair) mode
 *
 * Notes:
 * - This implementation assumes `victory-native`'s `CartesianChart` exposes `points`, `xScale`, `yScale`, `chartBounds`, `xTicks`, `yTicks` in the render function (per docs).
 * - Skia primitives are used for grid lines and markers so they render inside the clipped chart drawing area.
 * - Tooltip is rendered as an animated RN View on top for easier text layout (Skia Text/Fonts can be used instead if needed).
 */
export function EarningsGrowthChart({
    currencySymbol,
    data,
    title,
    showGrid = true,
    showMarkers = true,
    animatedTooltip = true,
    persistentTooltip = false,
    height = 220,
}: EarningsGrowthChartProps) {
    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const { width } = Dimensions.get('window')

    const chartWidth = width - 64
    const lineColor = isDark ? '#38bdf8' : '#2563eb'
    const areaColor = isDark ? 'rgba(56,189,248,0.14)' : 'rgba(37,99,235,0.08)'
    const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.06)'
    const axisLabelColor = isDark ? '#94a3b8' : '#64748b'
    const bgColor = isDark ? '#071023' : '#fff'
    const titleStyle: TextStyle = {
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    }
    const cardStyle: ViewStyle = { backgroundColor: bgColor }

    // Normalize data into { date, value } for CartesianChart
    const chartData = useMemo(() => {
        return data.map(d => {
            // normalize x to a number (timestamp) when possible; CartesianChart accepts number or string
            let x: number | string | Date = d.x
            if (d.x instanceof Date) {
                x = d.x.getTime()
            } else if (typeof d.x === 'string' && !Number.isNaN(Number(d.x))) {
                x = Number(d.x)
            }
            return { date: x, value: d.y }
        })
    }, [data])

    // Refs to receive scales/bounds from render function
    const xScaleRef = useRef<Scale | null>(null)
    const yScaleRef = useRef<Scale | null>(null)
    const chartBoundsRef = useRef<ChartBounds | null>(null)
    // store points array provided by render function (canvas coords)
    const pointsRef = useRef<SeriesPoint[] | null>(null)

    // Active index state for tooltip/crosshair
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    // Animated values for tooltip appearance
    const tooltipOpacity = useRef(new Animated.Value(0)).current
    const tooltipTranslateY = useRef(new Animated.Value(6)).current

    // Helper to build Skia paths for area and line
    function buildPaths(
        seriesPoints: SeriesPoint[],
        bounds: ChartBounds
    ): {
        linePath: ReturnType<typeof Skia.Path.Make>
        areaPath: ReturnType<typeof Skia.Path.Make>
    } {
        const linePath = Skia.Path.Make()
        const areaPath = Skia.Path.Make()
        if (seriesPoints.length === 0) {
            return { areaPath, linePath }
        }

        const first = seriesPoints[0]
        if (!first) {
            return { areaPath, linePath }
        }

        const firstX = bounds.left + first.x
        const firstY = bounds.top + first.y
        linePath.moveTo(firstX, firstY)

        const drawingHeight = bounds.bottom - bounds.top
        const areaBaselineY = bounds.top + drawingHeight
        areaPath.moveTo(firstX, areaBaselineY)
        areaPath.lineTo(firstX, firstY)

        for (let i = 1; i < seriesPoints.length; i++) {
            const p = seriesPoints[i]
            if (!p) {
                continue
            }
            const x = bounds.left + p.x
            const y = bounds.top + p.y
            linePath.lineTo(x, y)
            areaPath.lineTo(x, y)
        }

        const last = seriesPoints.at(-1)
        if (last) {
            const lastX = bounds.left + last.x
            areaPath.lineTo(lastX, areaBaselineY)
        }
        areaPath.close()

        return { areaPath, linePath }
    }

    useEffect(() => {
        if (!animatedTooltip) {
            tooltipOpacity.setValue(activeIndex !== null ? 1 : 0)
            tooltipTranslateY.setValue(activeIndex !== null ? 0 : 6)
            return
        }
        if (activeIndex !== null) {
            Animated.parallel([
                Animated.timing(tooltipOpacity, {
                    duration: 180,
                    toValue: 1,
                    useNativeDriver: true,
                }),
                Animated.spring(tooltipTranslateY, {
                    bounciness: 6,
                    speed: 12,
                    toValue: 0,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            Animated.parallel([
                Animated.timing(tooltipOpacity, {
                    duration: 160,
                    toValue: 0,
                    useNativeDriver: true,
                }),
                Animated.timing(tooltipTranslateY, {
                    duration: 160,
                    toValue: 6,
                    useNativeDriver: true,
                }),
            ]).start()
        }
    }, [activeIndex, animatedTooltip, tooltipOpacity, tooltipTranslateY])

    // Helper: find nearest point index from an x canvas coordinate (simple pixel-nearest)
    function findNearestIndexFromCanvasX(canvasX: number): number | null {
        const bounds = chartBoundsRef.current
        const pts = pointsRef.current
        if (!(bounds && pts) || pts.length === 0) {
            return null
        }

        const drawingX = canvasX - bounds.left

        // Pixel nearest using canvas coordinates from points (fast and robust)
        let bestIndex: number | null = null
        let bestDist = Number.POSITIVE_INFINITY
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i]
            if (!p) {
                continue
            }
            const px = p.x
            const dist = Math.abs(px - drawingX)
            if (dist < bestDist) {
                bestDist = dist
                bestIndex = i
            }
        }
        return bestIndex
    }

    // touch handler for overlay view
    function handleTouchEvent(e: GestureResponderEvent) {
        const touchX = e.nativeEvent.locationX
        const idx = findNearestIndexFromCanvasX(touchX)
        setActiveIndex(idx)
        if (!persistentTooltip && idx !== null) {
            // hide after short delay when not persistent
            setTimeout(() => {
                setActiveIndex(null)
            }, 1800)
        }
    }

    // Render tooltip as RN Animated View positioned using scales & chart bounds
    function renderTooltip() {
        if (activeIndex == null) {
            return null
        }
        const bounds = chartBoundsRef.current
        const pts = pointsRef.current
        if (!(bounds && pts && pts[activeIndex])) {
            return null
        }
        const p = pts[activeIndex]
        if (!p) {
            return null
        }
        // p.x/p.y are coordinates relative to drawing area
        const left = bounds.left + p.x
        const top = bounds.top + p.y

        const tooltipWidth = 140
        const tooltipHeight = 58
        const containerLeft = Math.max(
            8,
            Math.min(chartWidth - tooltipWidth - 8, left - tooltipWidth / 2)
        )
        const containerTop = Math.max(6, top - tooltipHeight - 8)

        const dataPoint = chartData[activeIndex]
        if (!dataPoint) {
            return null
        }
        const value = dataPoint.value
        const date = dataPoint.date

        return (
            <Animated.View
                pointerEvents='none'
                style={{
                    backgroundColor: isDark ? 'rgba(2,6,23,0.95)' : 'rgba(255,255,255,0.98)',
                    borderRadius: 8,
                    elevation: 6,
                    height: tooltipHeight,
                    left: containerLeft,
                    opacity: tooltipOpacity,
                    padding: 8,
                    position: 'absolute',
                    shadowColor: '#000',
                    shadowOpacity: 0.12,
                    shadowRadius: 6,
                    top: containerTop,
                    transform: [{ translateY: tooltipTranslateY }],
                    width: tooltipWidth,
                }}
            >
                <Text
                    style={{ color: isDark ? '#fff' : '#071023', fontWeight: '700' }}
                >{`${currencySymbol}${Number(value).toFixed(2)}`}</Text>
                <Text style={{ color: axisLabelColor, fontSize: 12 }}>
                    {format(new Date(Number(date)), 'dd MMM yyyy')}
                </Text>
            </Animated.View>
        )
    }

    return (
        <Card className='mb-4' style={cardStyle} variant='default'>
            <Text style={titleStyle}>{title ?? 'Earnings Growth'}</Text>

            <View style={{ alignItems: 'center' }}>
                <View style={{ height, width: chartWidth }}>
                    <CartesianChart
                        data={chartData}
                        padding={{ bottom: 50, left: 60, right: 20, top: 12 }}
                        xAxis={{
                            formatXLabel: (label: number | string) => {
                                const asNum = Number(label)
                                const date = Number.isNaN(asNum)
                                    ? new Date(String(label))
                                    : new Date(asNum)
                                return Number.isNaN(date.getTime())
                                    ? String(label)
                                    : format(date, 'MMM yy')
                            },
                        }}
                        // @ts-expect-error - CartesianChart generic type is overly restrictive for our data shape
                        xKey='date'
                        yAxis={[
                            {
                                formatYLabel: (v: number) =>
                                    `${currencySymbol}${Math.round(Number(v) / 1000)}k`,
                            },
                        ]}
                        yKeys={['value']}
                    >
                        {(args: unknown) => {
                            const typedArgs = args as CartesianRenderArgs
                            // persist refs so overlay & tooltip can use them
                            pointsRef.current = typedArgs.points?.value ?? []
                            xScaleRef.current = typedArgs.xScale
                            yScaleRef.current = typedArgs.yScale
                            chartBoundsRef.current = typedArgs.chartBounds

                            // points.value is array of { x, xValue, y, yValue } where x,y are canvas coords inside drawing area
                            const seriesPoints = typedArgs.points?.value ?? []

                            // Render Skia canvas for grid lines, area/line & markers
                            return (
                                <Canvas style={{ flex: 1 }}>
                                    <Group>
                                        {/* grid lines (vertical by xTicks and horizontal by yTicks) */}
                                        {showGrid &&
                                            Array.isArray(typedArgs.xTicks) &&
                                            typedArgs.xTicks.map((tick, _i) => {
                                                const canvasX = typedArgs.xScale(tick as number)
                                                return (
                                                    <SkLine
                                                        color={gridColor}
                                                        key={`v-grid-${String(tick)}`}
                                                        p1={{
                                                            x: typedArgs.chartBounds.left + canvasX,
                                                            y: typedArgs.chartBounds.top,
                                                        }}
                                                        p2={{
                                                            x: typedArgs.chartBounds.left + canvasX,
                                                            y: typedArgs.chartBounds.bottom,
                                                        }}
                                                        strokeWidth={1}
                                                    />
                                                )
                                            })}
                                        {showGrid &&
                                            Array.isArray(typedArgs.yTicks) &&
                                            typedArgs.yTicks.map((tick, _i) => {
                                                const canvasY = typedArgs.yScale(tick as number)
                                                return (
                                                    <SkLine
                                                        color={gridColor}
                                                        key={`h-grid-${String(tick)}`}
                                                        p1={{
                                                            x: typedArgs.chartBounds.left,
                                                            y: typedArgs.chartBounds.top + canvasY,
                                                        }}
                                                        p2={{
                                                            x: typedArgs.chartBounds.right,
                                                            y: typedArgs.chartBounds.top + canvasY,
                                                        }}
                                                        strokeWidth={1}
                                                    />
                                                )
                                            })}

                                        {/* Build Skia paths for area fill and line stroke using Skia.Path */}
                                        {(() => {
                                            const { linePath, areaPath } = buildPaths(
                                                seriesPoints,
                                                typedArgs.chartBounds
                                            )

                                            return (
                                                <>
                                                    {/* area fill using SkPath */}
                                                    {seriesPoints.length > 0 && (
                                                        <SkPath
                                                            color={areaColor}
                                                            path={areaPath}
                                                            style='fill'
                                                        />
                                                    )}

                                                    {/* line stroke using SkPath */}
                                                    {seriesPoints.length > 0 && (
                                                        <SkPath
                                                            color={lineColor}
                                                            path={linePath}
                                                            strokeWidth={2}
                                                            style='stroke'
                                                        />
                                                    )}
                                                </>
                                            )
                                        })()}

                                        {/* markers for all points (Skia circles) */}
                                        {/* markers for all points (drawn as two concentric circles to simulate stroke) */}
                                        {showMarkers &&
                                            seriesPoints.map((p, i) => {
                                                const cx = typedArgs.chartBounds.left + p.x
                                                const cy = typedArgs.chartBounds.top + p.y
                                                const isActive = i === activeIndex
                                                const finalRadius = isActive ? 5 : 3
                                                const finalFill = isActive ? lineColor : '#ffffff'
                                                const defaultStrokeColor = isDark
                                                    ? '#334155'
                                                    : '#e6eefc'
                                                const finalStroke = isActive
                                                    ? lineColor
                                                    : defaultStrokeColor
                                                // use a stable key derived from the data date when available
                                                const key = String(chartData[i]?.date ?? i)
                                                return (
                                                    <Group key={`marker-group-${key}`}>
                                                        {/* outer circle as stroke */}
                                                        <SkCircle
                                                            c={{ x: cx, y: cy }}
                                                            color={finalStroke}
                                                            r={finalRadius + 1}
                                                        />
                                                        {/* inner circle as fill */}
                                                        <SkCircle
                                                            c={{ x: cx, y: cy }}
                                                            color={finalFill}
                                                            r={finalRadius}
                                                        />
                                                    </Group>
                                                )
                                            })}
                                    </Group>
                                </Canvas>
                            )
                        }}
                    </CartesianChart>

                    {/* Interaction overlay captures touch events and renders animated RN tooltip & crosshair */}
                    <View
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={handleTouchEvent}
                        onResponderMove={handleTouchEvent}
                        onResponderRelease={() => {
                            if (!persistentTooltip) {
                                setActiveIndex(null)
                            }
                        }}
                        onStartShouldSetResponder={() => true}
                        style={{
                            height,
                            left: 0,
                            position: 'absolute',
                            top: 0,
                            width: chartWidth,
                        }}
                    >
                        {/* dotted vertical crosshair + tooltip overlay drawn with RN for easier text layout */}
                        {activeIndex !== null && (
                            <>
                                {/* vertical line (RN) positioned using chartBounds & points */}
                                {chartBoundsRef.current &&
                                    pointsRef.current &&
                                    pointsRef.current[activeIndex] && (
                                        <View
                                            pointerEvents='none'
                                            style={{
                                                backgroundColor: gridColor,
                                                height:
                                                    chartBoundsRef.current.bottom -
                                                    chartBoundsRef.current.top,
                                                left:
                                                    chartBoundsRef.current.left +
                                                    pointsRef.current[activeIndex].x -
                                                    0.5,
                                                position: 'absolute',
                                                top: chartBoundsRef.current.top,
                                                width: 1,
                                            }}
                                        />
                                    )}

                                {/* active dot is already drawn with Skia; tooltip rendered here */}
                                {renderTooltip()}
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Card>
    )
}
