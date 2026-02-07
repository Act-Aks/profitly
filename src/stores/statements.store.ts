import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Statement } from '@/utils/database/schema'
import type { ExcludeFunctions } from '@/utils/generics'
import { createZustandMmkvStorage } from '@/utils/mmkvStorage'

interface StatementsState {
    statements: Statement[]

    // Actions
    addStatement: (statement: Statement) => void
    removeStatement: (statementId: string) => void
    resetStatements: () => void
    setStatements: (statements: Statement[]) => void
    updateStatement: (statementId: string, updates: Partial<Statement>) => void
}

const defaultState = {
    statements: [],
} satisfies ExcludeFunctions<StatementsState>

export const useStatementsStore = create<StatementsState>()(
    persist(
        setState => ({
            ...defaultState,
            addStatement: (statement: Statement) =>
                setState(state => ({
                    statements: [...state.statements, statement],
                })),
            removeStatement: (statementId: string) =>
                setState(state => ({
                    statements: state.statements.filter(s => s.id !== statementId),
                })),
            resetStatements: () => setState(defaultState),
            setStatements: (statements: Statement[]) => setState({ statements }),
            updateStatement: (statementId: string, updates: Partial<Statement>) =>
                setState(state => ({
                    statements: state.statements.map(s =>
                        s.id === statementId ? { ...s, ...updates } : s
                    ),
                })),
        }),
        {
            ...createZustandMmkvStorage('statements'),
            partialize: (state: StatementsState) => ({
                statements: state.statements,
            }),
        }
    )
)
