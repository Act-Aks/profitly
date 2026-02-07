import * as FileSystem from 'expo-file-system'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { z } from 'zod'
import { useSettingsStore } from '@/stores/settings.store'
import {
    buildStatementFromCsv,
    inferCsvMapping,
    parseCsv,
    type StatementDraft,
    type StatementFileDraft,
} from '@/utils/statements'
import {
    buildTemplateMapping,
    detectStatementTemplate,
    getStatementTemplates,
    hasMinimumColumns,
} from '@/utils/statementTemplates'

interface TemplateChoice {
    id: string
    label: string
    mappingScore: string
    sourceName?: string
    sourceType?: 'bank' | 'broker'
}

const statementFileDraftSchema = z.object({
    fileName: z.string(),
    fileSize: z.number(),
    fileUri: z.string(),
    mimeType: z.string().nullable().optional(),
    parseMethod: z.enum(['csv', 'ofx', 'qfx', 'pdf', 'image', 'manual', 'unknown']),
    parseStatus: z.enum(['success', 'partial', 'failed']),
})

export default function StatementTemplateScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams<{
        file: string
        detectedTemplateId?: string
    }>()

    const { currency, currencySymbol } = useSettingsStore()
    const [isLoading, setIsLoading] = useState(true)
    const [headers, setHeaders] = useState<string[]>([])
    const [rows, setRows] = useState<string[][]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('auto')
    const [fileDraft, setFileDraft] = useState<StatementFileDraft | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true)
                if (!params.file) {
                    return
                }
                const parsed = statementFileDraftSchema.safeParse(JSON.parse(params.file))
                if (!parsed.success) {
                    return
                }
                const filePayload = parsed.data as StatementFileDraft
                setFileDraft(filePayload)
                const content = await FileSystem.readAsStringAsync(filePayload.fileUri, {
                    encoding: FileSystem.EncodingType.UTF8,
                })
                const parsedRows = parseCsv(content)
                if (parsedRows.length === 0) {
                    return
                }
                setHeaders(parsedRows[0])
                setRows(parsedRows.slice(1))
            } catch (error) {
                console.error('Error reading CSV:', error)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [params.file])

    const detected = useMemo(() => {
        if (headers.length === 0) {
            return null
        }
        return detectStatementTemplate(headers)
    }, [headers])

    useEffect(() => {
        if (params.detectedTemplateId) {
            setSelectedTemplateId(params.detectedTemplateId)
            return
        }
        if (detected?.template.id) {
            setSelectedTemplateId('auto')
        }
    }, [detected?.template.id, params.detectedTemplateId])

    const templateChoices = useMemo<TemplateChoice[]>(() => {
        if (headers.length === 0) {
            return []
        }
        const templates = getStatementTemplates()
        const choices = templates.map(template => {
            const { matched, total } = buildTemplateMapping(headers, template)
            const scoreLabel = `${matched}/${total} columns`
            return {
                id: template.id,
                label: template.name,
                mappingScore: scoreLabel,
                sourceName: template.sourceName,
                sourceType: template.sourceType,
            }
        })
        return choices.sort((a, b) => {
            const [aMatched] = a.mappingScore.split('/').map(Number)
            const [bMatched] = b.mappingScore.split('/').map(Number)
            return (bMatched ?? 0) - (aMatched ?? 0)
        })
    }, [headers])

    const autoLabel = detected?.template ? `Auto Detect (${detected.template.name})` : 'Auto Detect'

    const canContinue = headers.length > 0 && rows.length > 0 && Boolean(fileDraft)

    const handleContinue = () => {
        if (!fileDraft || headers.length === 0) {
            return
        }
        let mapping = inferCsvMapping(headers)
        let sourceName: string | null = null
        let sourceType: StatementDraft['sourceType'] = 'import'

        if (selectedTemplateId === 'auto' && detected) {
            mapping = detected.mapping
            sourceName = detected.template.sourceName
            sourceType = detected.template.sourceType
        } else {
            const template = getStatementTemplates().find(t => t.id === selectedTemplateId)
            if (template) {
                const built = buildTemplateMapping(headers, template)
                if (hasMinimumColumns(built.mapping)) {
                    mapping = built.mapping
                }
                sourceName = template.sourceName
                sourceType = template.sourceType
            }
        }

        const result = buildStatementFromCsv(headers, rows, mapping, currency, currencySymbol)
        const updatedFileDraft: StatementFileDraft = {
            ...fileDraft,
            parseStatus: rows.length > 0 ? 'success' : 'partial',
        }
        const draft: StatementDraft = {
            ...result.statement,
            sourceName: sourceName ?? result.statement.sourceName,
            sourceType,
        }

        router.push({
            params: {
                draft: JSON.stringify(draft),
                file: JSON.stringify(updatedFileDraft),
            },
            pathname: '/statement-new',
        })
    }

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
                <View className='mb-6 flex-row items-center justify-between'>
                    <View>
                        <Text className='font-bold text-3xl text-white'>Select Template</Text>
                        <Text className='text-gray-400 text-sm'>
                            Choose the closest bank/broker format
                        </Text>
                    </View>
                    <TouchableOpacity
                        className='h-10 w-10 items-center justify-center'
                        onPress={() => router.back()}
                    >
                        <Text className='font-bold text-2xl text-gray-400'>✕</Text>
                    </TouchableOpacity>
                </View>

                <View className='mb-4 rounded-xl border border-blue-800 bg-blue-900/20 p-4'>
                    <Text className='font-semibold text-white'>Auto Detect</Text>
                    <Text className='text-blue-200 text-sm'>
                        {detected?.template
                            ? `We matched ${detected.template.name} — review or pick another.`
                            : 'We could not confidently detect a template.'}
                    </Text>
                </View>

                <View className='mb-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4'>
                    <TouchableOpacity
                        className={`rounded-lg border-2 p-4 ${
                            selectedTemplateId === 'auto'
                                ? 'border-blue-500 bg-blue-900/30'
                                : 'border-gray-700 bg-gray-900'
                        }`}
                        onPress={() => setSelectedTemplateId('auto')}
                    >
                        <Text className='font-semibold text-white'>{autoLabel}</Text>
                        <Text className='text-gray-400 text-xs'>
                            Uses best-matched columns automatically
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className='gap-3'>
                    {templateChoices.map(choice => (
                        <TouchableOpacity
                            className={`rounded-lg border-2 p-4 ${
                                selectedTemplateId === choice.id
                                    ? 'border-emerald-500 bg-emerald-900/20'
                                    : 'border-gray-700 bg-gray-900'
                            }`}
                            key={choice.id}
                            onPress={() => setSelectedTemplateId(choice.id)}
                        >
                            <View className='flex-row items-center justify-between'>
                                <Text className='font-semibold text-white'>{choice.label}</Text>
                                <Text className='text-gray-400 text-xs'>{choice.mappingScore}</Text>
                            </View>
                            <Text className='mt-1 text-gray-500 text-xs'>
                                {choice.sourceType?.toUpperCase()} · {choice.sourceName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className='mt-6 gap-3'>
                    <TouchableOpacity
                        className='items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-4'
                        disabled={!canContinue}
                        onPress={handleContinue}
                        style={{ opacity: canContinue ? 1 : 0.6 }}
                    >
                        <Text className='font-bold text-lg text-white'>Continue</Text>
                    </TouchableOpacity>
                    {!canContinue && (
                        <Text className='text-center text-gray-500 text-xs'>
                            We could not parse any rows from this CSV.
                        </Text>
                    )}
                </View>
            </View>
        </ScrollView>
    )
}
