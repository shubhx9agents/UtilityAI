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
    BarChart3
} from 'lucide-react'
import { Workflow, WorkflowPlan, WorkflowStep, AgentType, CanvasNode, CanvasEdge } from '@/types'

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

    // Execution state
    const [isExecuting, setIsExecuting] = useState(false)
    const [executionResult, setExecutionResult] = useState<any>(null)
    const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({})

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
        const inputs = new Set<string>()
        for (const step of selectedWorkflow.workflow_plan.steps) {
            if (step.input_mapping?.from_user) {
                step.input_mapping.from_user.forEach(field => inputs.add(field))
            }
        }
        return Array.from(inputs)
    }

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
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Execute Workflow</DialogTitle>
                                                    <DialogDescription>
                                                        Provide inputs for the workflow
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    {getRequiredInputs().map(field => (
                                                        <div key={field} className="space-y-2">
                                                            <Label className="capitalize">{field.replace(/_/g, ' ')}</Label>
                                                            <textarea
                                                                className="w-full min-h-[80px] p-3 border rounded-md bg-background text-sm"
                                                                value={userInputs[field] || ''}
                                                                onChange={(e) => setUserInputs({
                                                                    ...userInputs,
                                                                    [field]: e.target.value
                                                                })}
                                                                placeholder={`Enter ${field}...`}
                                                            />
                                                        </div>
                                                    ))}
                                                    {getRequiredInputs().length === 0 && (
                                                        <div className="space-y-2">
                                                            <Label>General Input</Label>
                                                            <textarea
                                                                className="w-full min-h-[100px] p-3 border rounded-md bg-background text-sm"
                                                                value={userInputs.user_input || ''}
                                                                onChange={(e) => setUserInputs({
                                                                    ...userInputs,
                                                                    user_input: e.target.value
                                                                })}
                                                                placeholder="Enter your input for the workflow..."
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={executeWorkflow}>
                                                        <Play className="h-4 w-4 mr-1" />
                                                        Run Workflow
                                                    </Button>
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
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                    <div className="space-y-4 py-4">
                        {executionResult?.final_result?.summary && (
                            <div className="space-y-2">
                                <Label className="text-lg font-semibold">Summary</Label>
                                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                                    {executionResult.final_result.summary}
                                </div>
                            </div>
                        )}

                        {executionResult?.step_results && (
                            <div className="space-y-2">
                                <Label className="text-lg font-semibold">Step Results</Label>
                                <div className="space-y-3">
                                    {Object.entries(executionResult.step_results).map(([stepId, result]: [string, any]) => (
                                        <div key={stepId} className="border rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                {result.error ? (
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                )}
                                                <span className="font-medium">{stepId}</span>
                                                {result.agent_type && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({result.agent_type})
                                                    </span>
                                                )}
                                            </div>
                                            <ScrollArea className="h-[200px]">
                                                <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded">
                                                    {result.error || result.response || JSON.stringify(result, null, 2)}
                                                </pre>
                                            </ScrollArea>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {executionResult?.error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-500 rounded-lg">
                                <p className="text-red-600 dark:text-red-400">{executionResult.error}</p>
                            </div>
                        )}
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
