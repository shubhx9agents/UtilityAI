'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Layers,
    Plus,
    Play,
    Pause,
    Trash2,
    Save,
    Wand2,
    ArrowRight,
    ArrowDown,
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    GitBranch,
    Sparkles,
    Bot,
    Settings,
    Eye,
    History,
    Timer,
    BarChart3,
    FileText,
    Copy,
    Download,
    MessageSquare
} from 'lucide-react'
import { Workflow, WorkflowPlan, WorkflowStep, AgentType, CanvasNode, CanvasEdge } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface OrchestratorAgent {
    id: string
    name: string
    capabilities: string[]
}

type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export default function CanvasPage() {
    // Workflows state
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Available agents
    const [agents, setAgents] = useState<OrchestratorAgent[]>([])

    // Canvas state
    const [nodes, setNodes] = useState<CanvasNode[]>([])
    const [edges, setEdges] = useState<CanvasEdge[]>([])

    // Dialog states
    const [showNewWorkflowDialog, setShowNewWorkflowDialog] = useState(false)
    const [showOrchestratorDialog, setShowOrchestratorDialog] = useState(false)
    const [showExecuteDialog, setShowExecuteDialog] = useState(false)
    const [showResultsDialog, setShowResultsDialog] = useState(false)

    // Form states
    const [newWorkflowName, setNewWorkflowName] = useState('')
    const [orchestratorInstruction, setOrchestratorInstruction] = useState('')
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [workflowMode, setWorkflowMode] = useState<'sequential' | 'parallel'>('sequential')
    const [userInputs, setUserInputs] = useState<Record<string, string>>({})
    const [inputStepIndex, setInputStepIndex] = useState(0)

    // Execution state
    const [isExecuting, setIsExecuting] = useState(false)
    const [executionResult, setExecutionResult] = useState<any>(null)
    const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({})
    const [selectedResultStepId, setSelectedResultStepId] = useState<string | null>(null)

    // Progress tracking state
    const [executionProgress, setExecutionProgress] = useState(0)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null)
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('')
    const [elapsedTime, setElapsedTime] = useState<string>('00:00')

    // Execution history state
    const [executionHistory, setExecutionHistory] = useState<any[]>([])
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)
    const [selectedExecution, setSelectedExecution] = useState<any>(null)

    // Fetch workflows and agents on mount
    useEffect(() => {
        fetchWorkflows()
        fetchAgents()
    }, [])

    // Timer effect for elapsed time
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isExecuting && executionStartTime) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - executionStartTime.getTime()) / 1000)
                const mins = Math.floor(elapsed / 60)
                const secs = elapsed % 60
                setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isExecuting, executionStartTime])

    useEffect(() => {
        if (!showResultsDialog) return
        // Default to summary if available, otherwise first step
        if (executionResult?.final_result?.summary) {
            setSelectedResultStepId('__summary__')
        } else {
            const stepIds = executionResult?.step_results ? Object.keys(executionResult.step_results) : []
            if (stepIds.length > 0) {
                setSelectedResultStepId(stepIds[0])
            } else {
                setSelectedResultStepId(null)
            }
        }
    }, [showResultsDialog, executionResult?.step_results])

    const parseCSV = (csvText: string): string[][] => {
        const lines = csvText.split('\n').filter(line => line.trim())
        return lines.map(line => {
            const matches = line.match(/(?:"([^"]*)"|([^,]+))/g)
            return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : []
        })
    }

    const copyToClipboard = (content: string) => {
        navigator.clipboard.writeText(content)
        toast.success('Copied to clipboard')
    }

    const downloadAsFile = (content: string, stepId: string, type: 'md' | 'csv' | 'jpeg', agentType?: string) => {
        const element = document.createElement('a')
        if (type === 'jpeg') {
            // Count image steps to determine image number
            let imageNumber = 1
            if (executionResult?.step_results) {
                const stepIds = Object.keys(executionResult.step_results)
                const imageSteps = stepIds.filter(id => {
                    const result = executionResult.step_results[id]
                    return result?.agent_type === 'image_generation' || result?.agent_type === 'linkedin_headshot'
                })
                const currentIndex = imageSteps.indexOf(stepId)
                if (currentIndex !== -1) {
                    imageNumber = currentIndex + 1
                }
            }
            const workflowName = selectedWorkflow?.name || 'Workflow'
            const sanitizedName = workflowName.replace(/[^a-zA-Z0-9]/g, '_')
            const filename = `${sanitizedName}_Image_${imageNumber}`

            // Download image with custom name
            fetch(content)
                .then(res => res.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob)
                    element.href = url
                    element.download = `${filename}.jpg`
                    document.body.appendChild(element)
                    element.click()
                    document.body.removeChild(element)
                    URL.revokeObjectURL(url)
                    toast.success('Image downloaded')
                })
                .catch(() => {
                    // Fallback to proxy method
                    const downloadUrl = `/api/download?url=${encodeURIComponent(content)}`
                    window.location.href = downloadUrl
                    toast.success('Download started')
                })
            return
        }
        const blobType = type === 'md' ? 'text/markdown' : 'text/csv'
        const file = new Blob([content], { type: blobType })
        element.href = URL.createObjectURL(file)
        element.download = `${stepId}.${type}`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        toast.success(`Downloaded as ${type.toUpperCase()}`)
    }

    const downloadAsPDF = (content: string, stepId: string) => {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
            // Convert markdown to HTML with proper table handling
            let htmlContent = content

            // Convert markdown tables to HTML tables
            // Pattern matches: |header|...\n|---|...\n|row|...
            const tableRegex = new RegExp('\\|(.+)\\|\\n\\|[\\-\\:\\s\\|]+\\|\\n((?:\\|.+\\|\\n?)+)', 'g')
            htmlContent = htmlContent.replace(tableRegex, (match, header, rows) => {
                const headerCells = header.split('|').filter((cell: string) => cell.trim()).map((cell: string) => `<th>${cell.trim()}</th>`).join('')
                const bodyRows = rows.trim().split('\n').map((row: string) => {
                    const cells = row.split('|').filter((cell: string) => cell.trim()).map((cell: string) => `<td>${cell.trim()}</td>`).join('')
                    return `<tr>${cells}</tr>`
                }).join('')
                return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
            })

            // Convert other markdown elements
            htmlContent = htmlContent
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')

            htmlContent = '<p>' + htmlContent + '</p>'

            newWindow.document.write('<html><head><title>' + stepId + '</title>')
            newWindow.document.write(`<style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
                h1 { font-size: 28px; margin-top: 32px; margin-bottom: 16px; font-weight: 700; }
                h2 { font-size: 24px; margin-top: 28px; margin-bottom: 14px; font-weight: 600; }
                h3 { font-size: 20px; margin-top: 24px; margin-bottom: 12px; font-weight: 600; }
                p { margin-bottom: 12px; line-height: 1.7; }
                ul, ol { margin-left: 24px; margin-bottom: 16px; line-height: 1.7; }
                li { margin-bottom: 6px; }
                code { background: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
                pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #e5e7eb; }
                th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; }
                td { border: 1px solid #e5e7eb; padding: 10px; }
                tr:nth-child(even) { background: #f9fafb; }
                strong { font-weight: 600; }
                em { font-style: italic; }
            </style>`)
            newWindow.document.write('</head><body>')
            newWindow.document.write('<div>' + htmlContent + '</div>')
            newWindow.document.write('</body></html>')
            newWindow.document.close()
            newWindow.setTimeout(() => {
                newWindow.print()
                newWindow.close()
            }, 500)
        }
    }

    const fetchWorkflows = async () => {
        try {
            const res = await fetch('/api/canvas/workflows')
            const data = await res.json()
            if (data.workflows) {
                setWorkflows(data.workflows)
            }
        } catch (error) {
            console.error('Failed to fetch workflows:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/canvas/orchestrate')
            const data = await res.json()
            if (data.agents) {
                setAgents(data.agents)
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error)
        }
    }

    const createWorkflow = async () => {
        if (!newWorkflowName.trim()) return

        try {
            const res = await fetch('/api/canvas/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkflowName })
            })
            const data = await res.json()
            if (data.workflow) {
                setWorkflows([data.workflow, ...workflows])
                setSelectedWorkflow(data.workflow)
                setNewWorkflowName('')
                setShowNewWorkflowDialog(false)
            }
        } catch (error) {
            console.error('Failed to create workflow:', error)
        }
    }

    const selectWorkflow = async (workflow: Workflow) => {
        setSelectedWorkflow(workflow)

        // Convert workflow plan to canvas nodes/edges
        if (workflow.workflow_plan?.steps?.length > 0) {
            try {
                const res = await fetch(`/api/canvas/workflows/${workflow.id}`)
                const data = await res.json()
                if (data.canvas) {
                    setNodes(data.canvas.nodes)
                    setEdges(data.canvas.edges)
                }
            } catch (error) {
                console.error('Failed to load canvas:', error)
            }
        } else {
            setNodes([])
            setEdges([])
        }
    }

    const generateWorkflowPlan = async () => {
        if (!orchestratorInstruction.trim() && selectedAgents.length === 0) return

        try {
            setIsLoading(true)
            const res = await fetch('/api/canvas/orchestrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instruction: orchestratorInstruction,
                    selected_agents: selectedAgents,
                    mode: workflowMode
                })
            })
            const data = await res.json()

            if (data.workflow_plan) {
                // If we have a selected workflow, update it
                if (selectedWorkflow) {
                    await updateWorkflowPlan(data.workflow_plan)
                } else {
                    // Create new workflow with the plan
                    const createRes = await fetch('/api/canvas/workflows', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: data.workflow_plan.workflow_name,
                            workflow_plan: data.workflow_plan
                        })
                    })
                    const createData = await createRes.json()
                    if (createData.workflow) {
                        setWorkflows([createData.workflow, ...workflows])
                        selectWorkflow(createData.workflow)
                    }
                }

                setShowOrchestratorDialog(false)
                setOrchestratorInstruction('')
                setSelectedAgents([])
            }
        } catch (error) {
            console.error('Failed to generate workflow:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const updateWorkflowPlan = async (plan: WorkflowPlan) => {
        if (!selectedWorkflow) return

        try {
            const res = await fetch(`/api/canvas/workflows/${selectedWorkflow.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workflow_plan: plan })
            })
            const data = await res.json()
            if (data.workflow) {
                setSelectedWorkflow(data.workflow)
                setWorkflows(workflows.map(w =>
                    w.id === data.workflow.id ? data.workflow : w
                ))
                selectWorkflow(data.workflow)
            }
        } catch (error) {
            console.error('Failed to update workflow:', error)
        }
    }

    const deleteWorkflow = async (workflowId: string) => {
        try {
            await fetch(`/api/canvas/workflows/${workflowId}`, { method: 'DELETE' })
            setWorkflows(workflows.filter(w => w.id !== workflowId))
            if (selectedWorkflow?.id === workflowId) {
                setSelectedWorkflow(null)
                setNodes([])
                setEdges([])
            }
        } catch (error) {
            console.error('Failed to delete workflow:', error)
        }
    }

    const executeWorkflow = async () => {
        if (!selectedWorkflow) return

        try {
            setIsExecuting(true)
            setShowExecuteDialog(false)
            setExecutionProgress(0)
            setCurrentStepIndex(0)
            setExecutionStartTime(new Date())
            setElapsedTime('00:00')

            const totalSteps = selectedWorkflow.workflow_plan.steps.length
            const avgTimePerStep = 15 // seconds estimate per step

            // Initialize step statuses
            const initialStatuses: Record<string, StepStatus> = {}
            selectedWorkflow.workflow_plan.steps.forEach(step => {
                initialStatuses[step.step_id] = 'pending'
            })
            setStepStatuses(initialStatuses)

            // Estimate time remaining
            setEstimatedTimeRemaining(`~${Math.ceil(totalSteps * avgTimePerStep / 60)} min`)

            // Simulate progress updates (since we can't stream from current API)
            const progressInterval = setInterval(() => {
                setExecutionProgress(prev => {
                    const newProgress = Math.min(prev + (100 / totalSteps / avgTimePerStep), 95)
                    return newProgress
                })
            }, 1000)

            const res = await fetch(`/api/canvas/workflows/${selectedWorkflow.id}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_inputs: userInputs })
            })
            const data = await res.json()

            clearInterval(progressInterval)
            setExecutionProgress(100)
            setExecutionResult(data)

            // Update step statuses from result
            if (data.step_results) {
                const finalStatuses: Record<string, StepStatus> = {}
                for (const [stepId, result] of Object.entries(data.step_results)) {
                    finalStatuses[stepId] = (result as any).error ? 'failed' : 'completed'
                }
                setStepStatuses(finalStatuses)
            }

            // Fetch updated execution history
            await fetchExecutionHistory()

            setShowResultsDialog(true)
        } catch (error) {
            console.error('Failed to execute workflow:', error)
        } finally {
            setIsExecuting(false)
            setExecutionProgress(0)
            setEstimatedTimeRemaining('')
        }
    }

    // Fetch execution history for a workflow
    const fetchExecutionHistory = async () => {
        if (!selectedWorkflow) return

        try {
            const res = await fetch(`/api/canvas/workflows/${selectedWorkflow.id}/execute`)
            const data = await res.json()
            if (data.executions) {
                setExecutionHistory(data.executions)
            }
        } catch (error) {
            console.error('Failed to fetch execution history:', error)
        }
    }

    // View a specific execution from history
    const viewExecution = async (executionId: string) => {
        try {
            const res = await fetch(`/api/canvas/executions/${executionId}`)
            const data = await res.json()
            if (data.execution) {
                setSelectedExecution(data.execution)
                setExecutionResult({
                    execution_id: data.execution.id,
                    status: data.execution.status,
                    final_result: data.execution.final_result,
                    step_results: data.execution.steps?.reduce((acc: any, step: any) => {
                        acc[step.step_id] = {
                            agent_type: step.agent_type,
                            response: step.output_data?.response,
                            error: step.error_message
                        }
                        return acc
                    }, {})
                })
                setShowResultsDialog(true)
            }
        } catch (error) {
            console.error('Failed to fetch execution:', error)
        }
    }

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Calculate execution duration
    const getExecutionDuration = (startedAt: string, completedAt: string | null) => {
        if (!completedAt) return 'Running...'
        const start = new Date(startedAt).getTime()
        const end = new Date(completedAt).getTime()
        const duration = Math.floor((end - start) / 1000)
        const mins = Math.floor(duration / 60)
        const secs = duration % 60
        return `${mins}m ${secs}s`
    }

    const toggleAgentSelection = (agentId: string) => {
        setSelectedAgents(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        )
    }

    const getStatusIcon = (status: StepStatus) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'running':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'skipped':
                return <Clock className="h-4 w-4 text-yellow-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-400" />
        }
    }

    const getStatusColor = (status: StepStatus) => {
        switch (status) {
            case 'completed':
                return 'border-green-500 bg-green-50 dark:bg-green-950/30'
            case 'running':
                return 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            case 'failed':
                return 'border-red-500 bg-red-50 dark:bg-red-950/30'
            case 'skipped':
                return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
            default:
                return 'border-gray-300 dark:border-gray-600'
        }
    }

    // Get required user inputs from workflow
    const getRequiredInputs = (): string[] => {
        if (!selectedWorkflow?.workflow_plan?.steps) return []
        const seen = new Set<string>()
        const inputs: string[] = []
        for (const step of selectedWorkflow.workflow_plan.steps) {
            if (step.input_mapping?.from_user) {
                step.input_mapping.from_user.forEach(field => {
                    const normalized = field.replace(/\s+/g, ' ').trim()
                    const key = normalized.toLowerCase()
                    if (!key || seen.has(key)) return
                    seen.add(key)
                    inputs.push(normalized)
                })
            }
        }
        return inputs
    }

    useEffect(() => {
        if (showExecuteDialog) {
            setInputStepIndex(0)
        }
    }, [showExecuteDialog, selectedWorkflow?.id])

    if (isLoading && workflows.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Canvas Orchestrator</h1>
                    <p className="text-muted-foreground mt-2">
                        Design multi-agent workflows and orchestrate AI agents
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={showOrchestratorDialog} onOpenChange={setShowOrchestratorDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Wand2 className="h-4 w-4 mr-2" />
                                AI Orchestrator
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-500" />
                                    AI Orchestrator
                                </DialogTitle>
                                <DialogDescription>
                                    Describe how you want agents to work together, or select agents manually
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Natural Language Instruction</Label>
                                    <textarea
                                        className="w-full min-h-[100px] p-3 border rounded-md bg-background text-sm"
                                        placeholder="e.g., 'Run Deep Research first, then use the insights to write an Email Sequence, and finally create Social Media posts based on the emails'"
                                        value={orchestratorInstruction}
                                        onChange={(e) => setOrchestratorInstruction(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Or Select Agents Manually</Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                                        {agents.map(agent => (
                                            <div
                                                key={agent.id}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedAgents.includes(agent.id)
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                                    : 'hover:border-gray-400'
                                                    }`}
                                                onClick={() => toggleAgentSelection(agent.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-4 w-4 text-purple-500" />
                                                    <span className="font-medium text-sm">{agent.name}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                    {agent.capabilities.slice(0, 2).join(', ')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedAgents.length > 0 && !orchestratorInstruction && (
                                    <div className="space-y-2">
                                        <Label>Workflow Mode</Label>
                                        <Select value={workflowMode} onValueChange={(v: any) => setWorkflowMode(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sequential">Sequential (one after another)</SelectItem>
                                                <SelectItem value="parallel">Parallel (run together)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowOrchestratorDialog(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={generateWorkflowPlan}
                                    disabled={isLoading || (!orchestratorInstruction.trim() && selectedAgents.length === 0)}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Wand2 className="h-4 w-4 mr-2" />
                                    )}
                                    Generate Workflow
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showNewWorkflowDialog} onOpenChange={setShowNewWorkflowDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Workflow
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Workflow</DialogTitle>
                                <DialogDescription>
                                    Create an empty workflow to design manually
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label>Workflow Name</Label>
                                <Input
                                    className="mt-2"
                                    placeholder="My Workflow"
                                    value={newWorkflowName}
                                    onChange={(e) => setNewWorkflowName(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowNewWorkflowDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={createWorkflow} disabled={!newWorkflowName.trim()}>
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Workflows Sidebar */}
                <div className="col-span-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Workflows</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-2">
                                    {workflows.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No workflows yet. Create one to get started!
                                        </p>
                                    ) : (
                                        workflows.map(workflow => (
                                            <div
                                                key={workflow.id}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedWorkflow?.id === workflow.id
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                                    : 'hover:border-gray-400'
                                                    }`}
                                                onClick={() => selectWorkflow(workflow)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <GitBranch className="h-4 w-4 text-purple-500" />
                                                        <span className="font-medium text-sm">{workflow.name}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteWorkflow(workflow.id)
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-500" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {workflow.workflow_plan?.steps?.length || 0} steps
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Canvas Area */}
                <div className="col-span-9">
                    <Card className="min-h-[600px]">
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {selectedWorkflow?.name || 'Select a Workflow'}
                                    </CardTitle>
                                    {selectedWorkflow?.description && (
                                        <CardDescription>{selectedWorkflow.description}</CardDescription>
                                    )}
                                </div>
                                {selectedWorkflow && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowOrchestratorDialog(true)}
                                        >
                                            <Settings className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                fetchExecutionHistory()
                                                setShowHistoryDialog(true)
                                            }}
                                        >
                                            <History className="h-4 w-4 mr-1" />
                                            History
                                        </Button>
                                        <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    disabled={!selectedWorkflow?.workflow_plan?.steps?.length || isExecuting}
                                                >
                                                    {isExecuting ? (
                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <Play className="h-4 w-4 mr-1" />
                                                    )}
                                                    Execute
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] overflow-hidden">
                                                <DialogHeader>
                                                    <DialogTitle>Execute Workflow</DialogTitle>
                                                    <DialogDescription>
                                                        Provide inputs for the workflow
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 overflow-y-auto max-h-[55vh] pr-1">
                                                    {(() => {
                                                        const requiredInputs = getRequiredInputs()
                                                        if (requiredInputs.length === 0) {
                                                            return (
                                                                <div className="space-y-2">
                                                                    <Label>General Input</Label>
                                                                    <textarea
                                                                        className="w-full min-h-[140px] p-3 border rounded-md bg-background text-sm resize-none"
                                                                        value={userInputs.user_input || ''}
                                                                        onChange={(e) => setUserInputs({
                                                                            ...userInputs,
                                                                            user_input: e.target.value
                                                                        })}
                                                                        placeholder="Enter your input for the workflow..."
                                                                    />
                                                                </div>
                                                            )
                                                        }

                                                        const activeField = requiredInputs[inputStepIndex]
                                                        return (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                    <span>Question {inputStepIndex + 1} of {requiredInputs.length}</span>
                                                                    <span>{Math.round(((inputStepIndex + 1) / requiredInputs.length) * 100)}% complete</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="capitalize break-words">{activeField.replace(/_/g, ' ')}</Label>
                                                                    <textarea
                                                                        className="w-full min-h-[180px] p-3 border rounded-md bg-background text-sm resize-none"
                                                                        value={userInputs[activeField] || ''}
                                                                        onChange={(e) => setUserInputs({
                                                                            ...userInputs,
                                                                            [activeField]: e.target.value
                                                                        })}
                                                                        placeholder={`Enter ${activeField}...`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                                <DialogFooter>
                                                    {getRequiredInputs().length > 0 && (
                                                        <div className="flex w-full items-center justify-between">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setInputStepIndex(prev => Math.max(prev - 1, 0))}
                                                                disabled={inputStepIndex === 0}
                                                            >
                                                                Back
                                                            </Button>
                                                            <div className="flex gap-2">
                                                                <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
                                                                    Cancel
                                                                </Button>
                                                                {inputStepIndex < getRequiredInputs().length - 1 ? (
                                                                    <Button onClick={() => setInputStepIndex(prev => Math.min(prev + 1, getRequiredInputs().length - 1))}>
                                                                        Next
                                                                        <ArrowRight className="h-4 w-4 ml-1" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button onClick={executeWorkflow}>
                                                                        <Play className="h-4 w-4 mr-1" />
                                                                        Run Workflow
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {getRequiredInputs().length === 0 && (
                                                        <>
                                                            <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button onClick={executeWorkflow}>
                                                                <Play className="h-4 w-4 mr-1" />
                                                                Run Workflow
                                                            </Button>
                                                        </>
                                                    )}
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!selectedWorkflow ? (
                                <div className="flex flex-col items-center justify-center h-[450px] text-center">
                                    <Layers className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium">No Workflow Selected</h3>
                                    <p className="text-muted-foreground mt-2 max-w-md">
                                        Select a workflow from the sidebar or create a new one using the AI Orchestrator
                                    </p>
                                </div>
                            ) : nodes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[450px] text-center">
                                    <Wand2 className="h-16 w-16 text-purple-400 mb-4" />
                                    <h3 className="text-lg font-medium">Empty Workflow</h3>
                                    <p className="text-muted-foreground mt-2 max-w-md">
                                        Use the AI Orchestrator to generate steps for this workflow
                                    </p>
                                    <Button className="mt-4" onClick={() => setShowOrchestratorDialog(true)}>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Design with AI
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Visual Workflow */}
                                    <div className="flex flex-col items-center gap-4">
                                        {selectedWorkflow.workflow_plan.steps.map((step, index) => (
                                            <div key={step.step_id} className="flex flex-col items-center">
                                                <div
                                                    className={`p-4 border-2 rounded-lg min-w-[300px] transition-all ${getStatusColor(stepStatuses[step.step_id] || 'pending')
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Bot className="h-5 w-5 text-purple-500" />
                                                            <span className="font-medium">
                                                                {agents.find(a => a.id === step.agent_id)?.name || step.agent_id}
                                                            </span>
                                                        </div>
                                                        {getStatusIcon(stepStatuses[step.step_id] || 'pending')}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {step.description}
                                                    </p>
                                                    {step.depends_on && step.depends_on.length > 0 && (
                                                        <p className="text-xs text-purple-600 mt-2">
                                                            Depends on: {step.depends_on.join(', ')}
                                                        </p>
                                                    )}
                                                </div>

                                                {index < selectedWorkflow.workflow_plan.steps.length - 1 && (
                                                    <ArrowDown className="h-6 w-6 text-muted-foreground my-2" />
                                                )}
                                            </div>
                                        ))}

                                        {/* Final Output Node */}
                                        {selectedWorkflow.workflow_plan.final_response_strategy && (
                                            <>
                                                <ArrowDown className="h-6 w-6 text-muted-foreground my-2" />
                                                <div className="p-4 border-2 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-lg min-w-[300px]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                        <span className="font-medium">Final Output</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Strategy: {selectedWorkflow.workflow_plan.final_response_strategy.type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {selectedWorkflow.workflow_plan.final_response_strategy.instructions}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Results Dialog */}
            <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {executionResult?.status === 'completed' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            Workflow Results
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        {executionResult?.error && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-500 rounded-lg mb-3">
                                <p className="text-sm text-red-600 dark:text-red-400">{executionResult.error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[75vh]">
                            <div className="border rounded-lg p-3 flex flex-col lg:col-span-1">
                                <Label className="text-sm font-semibold mb-2">Steps</Label>
                                <ScrollArea className="flex-1">
                                    <div className="space-y-1.5 pr-2">
                                        {executionResult?.final_result?.summary && (
                                            <button
                                                type="button"
                                                className={`w-full text-left p-2.5 rounded-md border transition-colors ${selectedResultStepId === '__summary__'
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                                    : 'hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                                                    }`}
                                                onClick={() => setSelectedResultStepId('__summary__')}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    <span className="text-xs font-medium truncate">Summary</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground truncate block">Workflow Summary</span>
                                            </button>
                                        )}
                                        {executionResult?.step_results && Object.entries(executionResult.step_results).map(([stepId, result]: [string, any]) => (
                                            <button
                                                key={stepId}
                                                type="button"
                                                className={`w-full text-left p-2.5 rounded-md border transition-colors ${selectedResultStepId === stepId
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                                    : 'hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                                                    }`}
                                                onClick={() => setSelectedResultStepId(stepId)}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {result.error ? (
                                                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    )}
                                                    <span className="text-xs font-medium truncate">{stepId}</span>
                                                </div>
                                                {result.agent_type && (
                                                    <span className="text-[10px] text-muted-foreground truncate block">{result.agent_type}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="border rounded-lg p-4 flex flex-col lg:col-span-4 overflow-hidden">
                                {(() => {
                                    const result = selectedResultStepId === '__summary__' ? executionResult?.final_result : executionResult?.step_results?.[selectedResultStepId as string]
                                    const content = result?.error || result?.response || result?.summary || (result ? (typeof result === 'string' ? result : JSON.stringify(result, null, 2)) : 'Select a step to view its output.')
                                    const agentType = result?.agent_type
                                    const isSummary = selectedResultStepId === '__summary__'
                                    const isImage = (agentType === 'image_generation' || agentType === 'linkedin_headshot') && (typeof content === 'string' && content.startsWith('http'))
                                    const isAdCopy = agentType === 'ad_copy'
                                    const isSpecializedText = isSummary || agentType === 'deep_research' || agentType === 'email_sequence' || agentType === 'sales_script'

                                    return (
                                        <>
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="text-base font-semibold">{selectedResultStepId || 'Step Output'}</Label>
                                                {result && !result.error && (
                                                    <div className="flex gap-2">
                                                        {isImage ? (
                                                            <Button variant="outline" size="sm" onClick={() => downloadAsFile(content, selectedResultStepId as string, 'jpeg')}>
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </Button>
                                                        ) : isAdCopy ? (
                                                            <Button variant="outline" size="sm" onClick={() => downloadAsFile(content, selectedResultStepId as string, 'csv')} className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                                                                <Download className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                                                                .CSV
                                                            </Button>
                                                        ) : isSpecializedText ? (
                                                            <>
                                                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(content)}>
                                                                    <Copy className="h-4 w-4 mr-2" />
                                                                    Copy
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => downloadAsFile(content, selectedResultStepId as string, 'md')}>
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    .MD
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => downloadAsPDF(content, selectedResultStepId as string)}>
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    PDF
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(content)}>
                                                                    <Copy className="h-4 w-4 mr-2" />
                                                                    Copy
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => downloadAsFile(content, selectedResultStepId as string, 'md')}>
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    .MD
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => downloadAsFile(content, selectedResultStepId as string, 'csv')} className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                                                                    <Download className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                                                                    .CSV
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => downloadAsPDF(content, selectedResultStepId as string)}>
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    PDF
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-h-0 bg-muted rounded-lg p-4">
                                                <ScrollArea className="h-full">
                                                    {isImage ? (
                                                        <div className="flex justify-center items-center h-full">
                                                            <img src={content} alt="Generated Asset" className="max-w-full max-h-full rounded-lg shadow-lg object-contain" />
                                                        </div>
                                                    ) : isAdCopy ? (
                                                        <div className="overflow-x-auto">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        {parseCSV(content)[0]?.map((header, i) => (
                                                                            <TableHead key={i} className="font-bold">{header}</TableHead>
                                                                        ))}
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {parseCSV(content).slice(1).map((row, i) => (
                                                                        <TableRow key={i}>
                                                                            {row.map((cell, j) => (
                                                                                <TableCell key={j}>{cell}</TableCell>
                                                                            ))}
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    ) : (
                                                        <div className="markdown-container prose dark:prose-invert max-w-none prose-base pr-3">
                                                            {isSummary && (
                                                                <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-xl shadow-sm">
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <div className="p-2 bg-purple-500 rounded-lg shadow-md flex items-center justify-center">
                                                                            <Sparkles className="h-5 w-5 text-white" />
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">Workflow Summary</h3>
                                                                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Strategic Insights & Findings</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-px w-full bg-purple-200 dark:bg-purple-800 my-4" />
                                                                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                                                                        The following summary encapsulates the key outcomes from the orchestrated AI agents in this workflow.
                                                                    </p>
                                                                </div>
                                                            )}
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowResultsDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Execution History Dialog */}
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-purple-500" />
                            Execution History
                        </DialogTitle>
                        <DialogDescription>
                            View previous workflow executions
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {executionHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No execution history yet</p>
                                <p className="text-sm">Run the workflow to see results here</p>
                            </div>
                        ) : (
                            executionHistory.map((execution: any) => (
                                <div
                                    key={execution.id}
                                    className="border rounded-lg p-4 hover:border-purple-400 cursor-pointer transition-colors"
                                    onClick={() => {
                                        viewExecution(execution.id)
                                        setShowHistoryDialog(false)
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {execution.status === 'completed' ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : execution.status === 'failed' ? (
                                                <XCircle className="h-5 w-5 text-red-500" />
                                            ) : (
                                                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                            )}
                                            <div>
                                                <p className="font-medium">
                                                    {formatDate(execution.started_at)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Status: {execution.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Timer className="h-3 w-3" />
                                                {getExecutionDuration(execution.started_at, execution.completed_at)}
                                            </div>
                                        </div>
                                    </div>
                                    {execution.final_result?.summary && (
                                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                            {execution.final_result.summary.substring(0, 150)}...
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Execution Progress Overlay */}
            {isExecuting && (
                <div className="fixed bottom-6 right-6 z-50 w-80">
                    <Card className="border-purple-500 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
                                <span className="font-medium">Executing Workflow...</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{Math.round(executionProgress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                        style={{ width: `${executionProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <div className="flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        Elapsed: {elapsedTime}
                                    </div>
                                    {estimatedTimeRemaining && (
                                        <div>Est. remaining: {estimatedTimeRemaining}</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
