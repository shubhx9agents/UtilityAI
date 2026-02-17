'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
    Trash2,
    Save,
    Wand2,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Loader2,
    GitBranch,
    Sparkles,
    Bot,
    Settings,
    History,
    Timer,
    BarChart3,
    FileText,
    Copy,
    Download,
    MessageSquare,
    Upload,
    Maximize2,
    Minimize2,
    X
} from 'lucide-react'
import { Workflow, WorkflowPlan, WorkflowStep, AgentType, CanvasNode, CanvasEdge } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import ReactFlow, {
    addEdge,
    Background,
    Connection,
    Controls,
    Edge,
    Handle,
    MarkerType,
    MiniMap,
    Node,
    NodeProps,
    Panel,
    Position,
    ReactFlowInstance,
    useEdgesState,
    useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

const DEFAULT_IMAGE_MODEL = 'nano-banana-pro-preview'
const IMAGE_MODEL_OPTIONS = [
    { value: 'nano-banana-pro-preview', label: 'Nano Banana Pro (Gemini)' },
    { value: 'seedream-4-0-250828', label: 'Seedream 4 (BytePlus)' },
]
const PRIMARY_USER_INPUT_FIELD = 'user_input'
const PRIMARY_USER_INPUT_LABEL = 'Current business/product context'

interface OrchestratorAgent {
    id: string
    name: string
    capabilities: string[]
}

interface OnboardingData {
    business_name?: string
    industry?: string
    description?: string
    audience_desc?: string
    primary_goal?: string
    [key: string]: any
}

type ConfigInputSpec = { field: string, label: string, type: 'text' | 'image', group?: string }

const ensurePrimaryConfigInput = (inputs: ConfigInputSpec[]): ConfigInputSpec[] => {
    const seen = new Set<string>()
    const normalized: ConfigInputSpec[] = []
    const ordered: ConfigInputSpec[] = [
        { field: PRIMARY_USER_INPUT_FIELD, label: PRIMARY_USER_INPUT_LABEL, type: 'text', group: 'Current Run' },
        ...inputs,
    ]

    for (const input of ordered) {
        const field = (input.field || '').trim().toLowerCase()
        if (!field || seen.has(field)) continue
        seen.add(field)
        normalized.push({
            field,
            label: input.label || field,
            type: input.type === 'image' ? 'image' : 'text',
            group: input.group
        })
    }

    return normalized
}

type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

type FlowNodeKind = 'agent' | 'input' | 'output'

type FlowNodeData = {
    label: string
    nodeType: FlowNodeKind
    agentType?: AgentType
    description?: string
    inputs?: string[]
    outputs?: string[]
    status?: StepStatus
}

const AGENT_NODE_LIBRARY: Record<string, { inputs: string[]; outputs: string[] }> = {
    deep_research: {
        inputs: ['user_input', 'audience', 'goals'],
        outputs: ['research_summary', 'insights'],
    },
    ad_copy: {
        inputs: ['user_input', 'platforms', 'tone'],
        outputs: ['ad_copy_csv'],
    },
    image_generation: {
        inputs: ['base_image', 'prompt', 'reference_image', 'image_model'],
        outputs: ['image_url'],
    },
    linkedin_headshot: {
        inputs: ['user_image', 'image_model'],
        outputs: ['headshot_url'],
    },
}

const getStatusClassName = (status: StepStatus) => {
    switch (status) {
        case 'completed':
            return 'border-green-500/50 bg-green-500/10'
        case 'running':
            return 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
        case 'failed':
            return 'border-red-500/50 bg-red-500/10'
        case 'skipped':
            return 'border-zinc-500/50 bg-zinc-500/10'
        default:
            return 'border-[#262626] bg-[#0d0d0d]'
    }
}

const AgentNode = ({ data }: NodeProps<FlowNodeData>) => {
    const status = data.status || 'pending'
    return (
        <div className={`min-w-[230px] rounded-xl border-2 p-3 shadow-sm transition-all ${getStatusClassName(status)}`}>
            <Handle type="target" position={Position.Left} className="!bg-amber-500" />
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                        <Bot className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white">{data.label}</div>
                        {data.agentType && (
                            <div className="text-[11px] text-white/40">{data.agentType}</div>
                        )}
                    </div>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
                    {status}
                </span>
            </div>
            <p className="mt-2 text-xs text-white/50 line-clamp-1">
                {data.description || 'Single-step action in the workflow.'}
            </p>
            <Handle type="source" position={Position.Right} className="!bg-amber-500" />
        </div>
    )
}

const InputNode = ({ data }: NodeProps<FlowNodeData>) => (
    <div className="rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700">
        <Handle type="source" position={Position.Right} className="!bg-amber-500" />
        {data.label || 'Input'}
    </div>
)

const OutputNode = ({ data }: NodeProps<FlowNodeData>) => (
    <div className="rounded-xl border-2 border-green-500/60 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-700">
        <Handle type="target" position={Position.Left} className="!bg-green-500" />
        {data.label || 'Output'}
    </div>
)

export default function CanvasPage() {
    // Workflows state
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Available agents
    const [agents, setAgents] = useState<OrchestratorAgent[]>([])
    const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
    const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)

    // Canvas state
    const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState<FlowNodeData>([])
    const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState([])
    const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null)
    const [isCanvasDirty, setIsCanvasDirty] = useState(false)
    const [isSavingCanvas, setIsSavingCanvas] = useState(false)
    const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false)
    const nextNodeIndexRef = useRef(1)

    // Dialog states
    const [showNewWorkflowDialog, setShowNewWorkflowDialog] = useState(false)
    const [showOrchestratorDialog, setShowOrchestratorDialog] = useState(false)
    const [showExecuteDialog, setShowExecuteDialog] = useState(false)
    const [showAddNodeDialog, setShowAddNodeDialog] = useState(false)
    const [showNodeEditorDialog, setShowNodeEditorDialog] = useState(false)

    // Form states
    const [newWorkflowName, setNewWorkflowName] = useState('')
    const [orchestratorInstruction, setOrchestratorInstruction] = useState('')
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [workflowMode, setWorkflowMode] = useState<'sequential' | 'parallel'>('sequential')
    const [userInputs, setUserInputs] = useState<Record<string, string>>({})
    const [inputStepIndex, setInputStepIndex] = useState(0)
    const [newNodeAgentId, setNewNodeAgentId] = useState<AgentType | ''>('')
    const [newNodeDescription, setNewNodeDescription] = useState('')
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [nodeEditorValues, setNodeEditorValues] = useState({
        description: '',
        inputs: '',
        outputs: '',
    })

    // Execution state
    const [isExecuting, setIsExecuting] = useState(false)
    const [showResultsDialog, setShowResultsDialog] = useState(false)
    const [executionMode, setExecutionMode] = useState<'hybrid' | 'manual' | null>(null)
    const [configInputs, setConfigInputs] = useState<ConfigInputSpec[]>([])
    const [isConfiguring, setIsConfiguring] = useState(false)
    const [executionResult, setExecutionResult] = useState<any>(null)
    const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({})
    const [selectedResultStepId, setSelectedResultStepId] = useState<string | null>(null)

    // Progress tracking state
    const [executionProgress, setExecutionProgress] = useState(0)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null)
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('')
    const [elapsedTime, setElapsedTime] = useState<string>('00:00')
    const [isExecutionOverlayHidden, setIsExecutionOverlayHidden] = useState(false)

    // Execution history state
    const [executionHistory, setExecutionHistory] = useState<any[]>([])
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)
    const [selectedExecution, setSelectedExecution] = useState<any>(null)

    // Fetch workflows and agents on mount
    useEffect(() => {
        fetchWorkflows()
        fetchAgents()
        fetchOnboardingData()
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

    const fetchOnboardingData = async () => {
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('onboarding_progress')
                .select('step_outputs')
                .eq('user_id', user.id)
                .maybeSingle()

            if (data?.step_outputs) {
                setOnboardingData(data.step_outputs)
            } else {
                // No data found, show banner
                setShowOnboardingBanner(true)
            }
        } catch (error) {
            console.error('Failed to fetch onboarding:', error)
        }
    }

    const nodeTypes = useMemo(() => ({
        agent: AgentNode,
        input: InputNode,
        output: OutputNode,
    }), [])

    const getAgentIo = useCallback((agentId?: AgentType) => {
        if (!agentId) {
            return { inputs: ['user_input'], outputs: ['output'] }
        }
        return AGENT_NODE_LIBRARY[agentId] || { inputs: ['user_input'], outputs: ['output'] }
    }, [])

    const mapCanvasNodeToFlowNode = useCallback((node: CanvasNode): Node<FlowNodeData> => {
        const agentType = node.data.agent_type as AgentType | undefined
        const io = getAgentIo(agentType)
        const inputs = node.data.inputs?.length ? node.data.inputs : io.inputs
        const outputs = node.data.outputs?.length ? node.data.outputs : io.outputs
        const nodeType: FlowNodeKind = node.type === 'merge' ? 'output' : node.type
        return {
            id: node.id,
            type: nodeType,
            position: node.position,
            data: {
                label: node.data.label,
                nodeType,
                agentType,
                description: node.data.description,
                inputs,
                outputs,
                status: (node.data.status as StepStatus) || 'pending',
            }
        }
    }, [getAgentIo])

    const mapCanvasEdgeToFlowEdge = useCallback((edge: CanvasEdge): Edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
    }), [])

    const normalizeFlowEdges = useCallback((edges: Edge[]) => {
        // Only prevent exact duplicate edges (same source AND target)
        // Allow multiple outgoing edges from same source (one-to-many connections)
        const seen = new Set<string>()
        const normalized: Edge[] = []

        for (const edge of edges) {
            const key = `${edge.source}->${edge.target}`
            if (seen.has(key)) {
                continue // Skip duplicate edges
            }
            seen.add(key)
            normalized.push(edge)
        }

        return normalized
    }, [])

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
                    setFlowNodes(data.canvas.nodes.map(mapCanvasNodeToFlowNode))
                    const mappedEdges = data.canvas.edges.map(mapCanvasEdgeToFlowEdge)
                    setFlowEdges(normalizeFlowEdges(mappedEdges))
                    setIsCanvasDirty(false)
                    nextNodeIndexRef.current = data.canvas.nodes.length + 1
                }
            } catch (error) {
                console.error('Failed to load canvas:', error)
            }
        } else {
            setFlowNodes([])
            setFlowEdges([])
            setIsCanvasDirty(false)
        }
    }

    const generateWorkflowPlan = async () => {
        if (!orchestratorInstruction.trim() && selectedAgents.length === 0) return

        try {
            setIsLoading(true)

            // Construct instruction with onboarding context if available
            let finalInstruction = orchestratorInstruction.trim()

            if (onboardingData && finalInstruction) {
                const contextStr = `\n\nContext about my business:\nName: ${onboardingData.business_name}\nIndustry: ${onboardingData.industry}\nAudience: ${onboardingData.audience_desc}\nGoals: ${onboardingData.primary_goal}`

                // Only append if not already mentioned (simple check)
                if (!finalInstruction.toLowerCase().includes('business')) {
                    finalInstruction += contextStr
                }
            }

            const res = await fetch('/api/canvas/orchestrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instruction: finalInstruction,
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

                // IMPORTANT: Pre-fill the user input with the instruction used to generate the plan
                // This ensures the agents immediately have context without re-typing
                if (orchestratorInstruction.trim()) {
                    setUserInputs(prev => ({
                        ...prev,
                        user_input: orchestratorInstruction.trim()
                    }))
                    toast.success('Workflow generated! Instruction saved for execution.')
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

    const updateWorkflowPlan = async (plan: WorkflowPlan, options?: { reloadCanvas?: boolean }) => {
        if (!selectedWorkflow) return

        try {
            const res = await fetch(`/api/canvas/workflows/${selectedWorkflow.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workflow_plan: plan })
            })
            const data = await res.json()
            if (data.workflow) {
                const updatedWorkflow = data.workflow as Workflow
                setSelectedWorkflow(updatedWorkflow)
                setWorkflows(workflows.map(w =>
                    w.id === updatedWorkflow.id ? updatedWorkflow : w
                ))
                if (options?.reloadCanvas !== false) {
                    selectWorkflow(updatedWorkflow)
                }
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
                setFlowNodes([])
                setFlowEdges([])
                setIsCanvasDirty(false)
            }
        } catch (error) {
            console.error('Failed to delete workflow:', error)
        }
    }

    const handleNodesChange = useCallback((changes: any[]) => {
        onFlowNodesChange(changes)
        const hasMeaningfulChange = changes.some(change => change.type !== 'select')
        if (hasMeaningfulChange) {
            setIsCanvasDirty(true)
        }
    }, [onFlowNodesChange])

    const handleEdgesChange = useCallback((changes: any[]) => {
        onFlowEdgesChange(changes)
        const hasMeaningfulChange = changes.some(change => change.type !== 'select')
        if (hasMeaningfulChange) {
            setIsCanvasDirty(true)
        }
    }, [onFlowEdgesChange])

    const handleConnect = useCallback((connection: Connection) => {
        setFlowEdges(edges => {
            // Only prevent duplicate connections (same source AND target)
            // Allow multiple outgoing edges from same source
            const pruned = edges.filter(edge => !(
                edge.source === connection.source && edge.target === connection.target
            ))
            const nextEdges = addEdge({
                ...connection,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
            }, pruned)
            return normalizeFlowEdges(nextEdges)
        })
        setIsCanvasDirty(true)
    }, [setFlowEdges, normalizeFlowEdges])

    const openNodeEditor = useCallback((nodeId: string) => {
        const node = flowNodes.find(item => item.id === nodeId)
        if (!node || node.data.nodeType !== 'agent') return
        setSelectedNodeId(nodeId)
        setNodeEditorValues({
            description: node.data.description || '',
            inputs: (node.data.inputs || []).join(', '),
            outputs: (node.data.outputs || []).join(', '),
        })
        setShowNodeEditorDialog(true)
    }, [flowNodes])

    const applyNodeEditorChanges = () => {
        if (!selectedNodeId) return
        setFlowNodes(nodes => nodes.map(node => {
            if (node.id !== selectedNodeId) return node
            const inputs = nodeEditorValues.inputs
                .split(',')
                .map(value => value.trim())
                .filter(Boolean)
            const outputs = nodeEditorValues.outputs
                .split(',')
                .map(value => value.trim())
                .filter(Boolean)

            return {
                ...node,
                data: {
                    ...node.data,
                    description: nodeEditorValues.description.trim(),
                    inputs,
                    outputs,
                }
            }
        }))
        setIsCanvasDirty(true)
        setShowNodeEditorDialog(false)
    }

    const handleAddNode = () => {
        if (!newNodeAgentId) {
            toast.error('Select an agent to add')
            return
        }
        const agentName = agents.find(agent => agent.id === newNodeAgentId)?.name || newNodeAgentId
        const io = getAgentIo(newNodeAgentId)
        const index = nextNodeIndexRef.current
        const position = {
            x: (index % 3) * 280,
            y: Math.floor(index / 3) * 200,
        }
        nextNodeIndexRef.current += 1

        const id = `step_${Date.now()}_${newNodeAgentId}`
        setFlowNodes(nodes => nodes.concat({
            id,
            type: 'agent',
            position,
            data: {
                label: agentName,
                nodeType: 'agent',
                agentType: newNodeAgentId,
                description: newNodeDescription.trim() || `Run ${agentName} agent`,
                inputs: io.inputs,
                outputs: io.outputs,
                status: 'pending',
            },
        }))
        setIsCanvasDirty(true)
        setShowAddNodeDialog(false)
        setNewNodeAgentId('')
        setNewNodeDescription('')
    }

    const buildWorkflowPlanFromCanvas = useCallback((): WorkflowPlan | null => {
        if (!selectedWorkflow) return null
        const agentNodes = flowNodes.filter(node => node.data.nodeType === 'agent')
        if (agentNodes.length === 0) return null

        const agentNodeIds = new Set(agentNodes.map(node => node.id))
        const steps: WorkflowStep[] = agentNodes.map(node => {
            // Find ALL incoming edges (support for multiple dependencies)
            const incomingEdges = flowEdges.filter(edge => (
                edge.target === node.id && agentNodeIds.has(edge.source)
            ))
            const incoming = incomingEdges.map(edge => edge.source)

            // Build fromSteps mapping for all incoming edges
            const fromSteps: Record<string, string[]> = {}
            incomingEdges.forEach(edge => {
                fromSteps[edge.source] = ['output']
            })

            let inputs = (node.data.inputs && node.data.inputs.length > 0)
                ? [...node.data.inputs]
                : ['user_input']

            // Force image_model for image agents if not present to ensure user is always asked
            const isImageAgent = node.data.agentType === 'image_generation' || node.data.agentType === 'linkedin_headshot'
            if (isImageAgent && !inputs.some(i => i.toLowerCase().includes('image_model'))) {
                inputs.push('image_model')
            }
            const userInputSpecs = inputs.map((field) => {
                const isImageModel = field.toLowerCase().includes('image_model') || field.toLowerCase() === 'image model'
                const type: 'text' | 'image' = field.toLowerCase().includes('image') && !isImageModel ? 'image' : 'text'

                let processedField = field
                let label = field.replace(/_/g, ' ')

                if (isImageModel) {
                    processedField = `${node.id}_image_model`
                    label = `Model for ${node.data.label}`
                }

                return {
                    field: processedField,
                    label,
                    type,
                }
            })

            return {
                step_id: node.id,
                agent_id: node.data.agentType || 'deep_research',
                description: node.data.description || `Run ${node.data.label}`,
                depends_on: incoming,
                input_mapping: {
                    from_user: userInputSpecs.map(s => s.field),
                    from_steps: incoming.length > 0 ? fromSteps : {},
                    user_input_specs: userInputSpecs,
                },
                outputs: node.data.outputs && node.data.outputs.length > 0
                    ? node.data.outputs
                    : ['output'],
                position: node.position,
            }
        })

        const leafSteps = agentNodes
            .filter(node => !flowEdges.some(edge => edge.source === node.id && agentNodeIds.has(edge.target)))
            .map(node => node.id)
        const leafStepId = leafSteps.length > 0
            ? leafSteps[leafSteps.length - 1]
            : null

        return {
            workflow_name: selectedWorkflow.name,
            steps,
            final_response_strategy: {
                type: 'merge_and_summarize',
                from_steps: leafStepId ? [leafStepId] : [],
                instructions: 'Combine all outputs',
            }
        }
    }, [flowEdges, flowNodes, selectedWorkflow])

    const syncWorkflowPlanFromCanvas = useCallback(async () => {
        if (!selectedWorkflow) return false
        if (!isCanvasDirty) return true

        const plan = buildWorkflowPlanFromCanvas()
        if (!plan) {
            toast.error('Add at least one agent node before saving')
            return false
        }

        try {
            setIsSavingCanvas(true)
            await updateWorkflowPlan(plan, { reloadCanvas: false })
            setIsCanvasDirty(false)
            toast.success('Canvas saved')
            return true
        } catch (error) {
            console.error('Failed to save canvas:', error)
            toast.error('Failed to save canvas')
            return false
        } finally {
            setIsSavingCanvas(false)
        }
    }, [buildWorkflowPlanFromCanvas, isCanvasDirty, selectedWorkflow, updateWorkflowPlan])

    const openExecuteDialog = async () => {
        if (!selectedWorkflow) return
        const synced = await syncWorkflowPlanFromCanvas()
        if (synced) {
            setExecutionMode(null)
            setConfigInputs([])
            setShowExecuteDialog(true)
        }
    }

    const selectExecutionMode = async (mode: 'hybrid' | 'manual') => {
        setExecutionMode(mode)
        setIsConfiguring(true)
        try {
            const planForExecution = buildWorkflowPlanFromCanvas() || selectedWorkflow?.workflow_plan
            const agentIds = planForExecution?.steps?.map((s: any) => s.agent_id) || []

            const res = await fetch('/api/canvas/workflows/input-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, agentIds })
            })
            const data = await res.json()

            if (mode === 'manual') {
                setConfigInputs(ensurePrimaryConfigInput(data.inputs || []))
            } else {
                // Hybrid: merge injected data into userInputs and set new questions
                console.log('[Canvas Debug] Hybrid mode response:', JSON.stringify(data, null, 2))
                if (data.injected_data) {
                    console.log('[Canvas Debug] Injected data:', data.injected_data)
                    // Existing run inputs always win over profile-injected defaults.
                    setUserInputs(prev => ({ ...data.injected_data, ...prev }))
                    toast.success('Onboarding data injected!')
                }
                setConfigInputs(ensurePrimaryConfigInput(data.new_questions || []))
            }
            setInputStepIndex(0)
        } catch (error) {
            console.error('Failed to configure inputs:', error)
            toast.error('AI Configuration failed. Falling back to default.')
            setExecutionMode('manual')
            setConfigInputs(ensurePrimaryConfigInput(getRequiredInputs()))
        } finally {
            setIsConfiguring(false)
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

            const planForExecution = buildWorkflowPlanFromCanvas() || selectedWorkflow.workflow_plan
            const totalSteps = planForExecution.steps.length
            const avgTimePerStep = 15 // seconds estimate per step

            // Initialize step statuses
            const initialStatuses: Record<string, StepStatus> = {}
            planForExecution.steps.forEach(step => {
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
                    user_inputs: data.execution.user_inputs,
                    final_result: data.execution.final_result ? {
                        ...data.execution.final_result,
                        // If the only result is an image, or it's an image-only workflow, tag it
                        agent_type: data.execution.steps?.find((s: any) => s.agent_type === 'image_generation' || s.agent_type === 'linkedin_headshot')?.agent_type
                    } : null,
                    step_results: data.execution.steps?.reduce((acc: any, step: any) => {
                        acc[step.step_id] = {
                            agent_type: step.agent_type,
                            response: step.output_data?.response,
                            error: step.error_message,
                            input: step.input_data
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

    useEffect(() => {
        setFlowNodes(nodes => nodes.map(node => {
            if (node.data.nodeType !== 'agent') return node
            const status = stepStatuses[node.id] || (isExecuting ? 'running' : 'pending')
            return {
                ...node,
                data: {
                    ...node.data,
                    status,
                },
            }
        }))
    }, [isExecuting, stepStatuses, setFlowNodes])

    useEffect(() => {
        setFlowEdges(edges => edges.map(edge => {
            const sourceStatus = stepStatuses[edge.source] || (isExecuting ? 'running' : 'pending')
            let stroke = '#e5e7eb'
            if (sourceStatus === 'completed') stroke = '#22c55e'
            if (sourceStatus === 'failed') stroke = '#ef4444'
            if (sourceStatus === 'running') stroke = '#3b82f6'

            return {
                ...edge,
                animated: sourceStatus === 'running',
                style: { stroke, strokeWidth: 2 },
            }
        }))
    }, [isExecuting, stepStatuses, setFlowEdges])

    useEffect(() => {
        if (isExecuting) {
            setIsExecutionOverlayHidden(false)
        }
    }, [isExecuting])

    useEffect(() => {
        if (!flowInstance) return
        requestAnimationFrame(() => {
            flowInstance.fitView({ padding: 0.2 })
        })
    }, [flowInstance, isCanvasFullscreen, flowNodes.length])

    // Get required user inputs from workflow
    const getRequiredInputs = (): Array<{ field: string, label: string, type: 'text' | 'image', group?: string }> => {
        if (!selectedWorkflow?.workflow_plan?.steps) return []

        const seen = new Set<string>()
        const inputs: Array<{ field: string, label: string, type: 'text' | 'image', group?: string }> = []

        for (const step of selectedWorkflow.workflow_plan.steps) {
            if (step.input_mapping?.user_input_specs) {
                step.input_mapping.user_input_specs.forEach(spec => {
                    if (!seen.has(spec.field)) {
                        seen.add(spec.field)
                        inputs.push(spec)
                    }
                })
            } else if (step.input_mapping?.from_user) {
                step.input_mapping.from_user.forEach(field => {
                    const key = field.toLowerCase().trim()
                    if (!key || seen.has(key)) return
                    seen.add(key)
                    inputs.push({
                        field: field.replace(/\s+/g, '_').toLowerCase(),
                        label: field,
                        type: 'text'
                    })
                })
            }
        }
        return inputs
    }

    const handleImageUpload = (field: string, file: File) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            setUserInputs(prev => ({
                ...prev,
                [field]: reader.result as string
            }))
        }
        reader.readAsDataURL(file)
    }

    const renderCanvasFlow = (containerClassName: string) => (
        <div className={containerClassName}>
            <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                onInit={setFlowInstance}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onNodeDoubleClick={(_, node) => openNodeEditor(node.id)}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={1.5}
                snapToGrid
                snapGrid={[20, 20]}
                deleteKeyCode={['Backspace', 'Delete']}
            >
                <Panel position="top-left" className="m-3 rounded-lg border border-warm-border bg-background/90 px-3 py-2 text-xs shadow-sm">
                    <div className="font-semibold text-foreground">Canvas Controls</div>
                    <div className="text-[11px] text-muted-foreground">Drag nodes, connect handles, double-click to edit.</div>
                </Panel>
                <Background gap={18} size={1} color="#e5e7eb" />
                <MiniMap
                    pannable
                    zoomable
                    nodeColor={(node) => {
                        if (node.data?.nodeType === 'output') return '#22c55e'
                        if (node.data?.nodeType === 'input') return '#f59e0b'
                        return '#f97316'
                    }}
                />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    )

    useEffect(() => {
        if (showExecuteDialog) {
            setInputStepIndex(0)

            // Auto-fill inputs from onboarding data if available
            if (onboardingData && selectedWorkflow?.workflow_plan) {
                const required = getRequiredInputs()
                const newInputs = { ...userInputs }
                let hasUpdates = false

                // normalize string helper
                const norm = (s: string) => s.toLowerCase().trim()

                // Detailed mapping of Agent Questions to Onboarding Data Fields
                const mapping: Record<string, string | undefined> = {
                    // Deep Research & General
                    'niche': onboardingData.industry,
                    'industry/niche': onboardingData.industry,
                    'industry': onboardingData.industry,
                    'target audience': onboardingData.audience_desc,
                    'audience': onboardingData.audience_desc,
                    'primary problem i solve': onboardingData.pain_points,
                    'secondary problems': onboardingData.pain_points,
                    'pain points': onboardingData.pain_points,
                    'my experience': onboardingData.description, // Fallback
                    'business description': onboardingData.description,
                    'description': onboardingData.description,
                    'my core philosophy or approach': onboardingData.mission,
                    'mission statement': onboardingData.mission,
                    'primary promise': onboardingData.usp,
                    'unique value proposition': onboardingData.usp,
                    'usp': onboardingData.usp,
                    'business name': onboardingData.business_name,
                    'company name': onboardingData.business_name,
                    'product/service name': onboardingData.business_name,

                    // Ad Copy & Marketing
                    'main features/benefits': onboardingData.usp,
                    'ad tone (e.g. funny, professional, urgent)': onboardingData.tone_voice,
                    'ad tone': onboardingData.tone_voice,
                    'tone of voice': onboardingData.tone_voice,
                    'brand style': onboardingData.tone_voice,
                    'specific platforms (e.g. facebook, instagram, linkedin, google)': onboardingData.marketing_channels?.join(', '),
                    'platforms': onboardingData.marketing_channels?.join(', '),
                    'marketing channels': onboardingData.marketing_channels?.join(', '),

                    // Landing Page & Growth
                    'page goal': onboardingData.primary_goal,
                    'conversion goals': onboardingData.primary_goal,
                    'primary business goal': onboardingData.primary_goal,
                }

                required.forEach(req => {
                    const key = req.field
                    const lowerKey = norm(key)

                    // 1. Try manual mapping first
                    if (!newInputs[key] && mapping[lowerKey]) {
                        newInputs[key] = mapping[lowerKey]
                        hasUpdates = true
                    }
                    // 2. Try direct key match if no mapping found
                    else if (!newInputs[key] && onboardingData[key]) {
                        newInputs[key] = onboardingData[key]
                        hasUpdates = true
                    }
                })

                if (hasUpdates) {
                    setUserInputs(newInputs)
                    toast.success('Autofilled using your profile data!')
                }
            }

            const required = getRequiredInputs()
            const imageModelFields = required.filter(req => req.field.includes('image_model') || req.label.toLowerCase().includes('image model'))

            if (imageModelFields.length > 0) {
                setUserInputs(prev => {
                    const newInputs = { ...prev }
                    let hasImageModelUpdates = false

                    imageModelFields.forEach(req => {
                        if (!newInputs[req.field]) {
                            newInputs[req.field] = DEFAULT_IMAGE_MODEL
                            hasImageModelUpdates = true
                        }
                    })

                    return hasImageModelUpdates ? newInputs : prev
                })
            }
        }
    }, [showExecuteDialog, selectedWorkflow?.id, onboardingData])

    if (isLoading && workflows.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Canvas Orchestrator</h1>
                    <p className="text-muted-foreground mt-2">
                        Design multi-agent workflows and orchestrate AI agents
                    </p>
                </div>
                {showOnboardingBanner && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Complete your profile for better AI results</p>
                            <p className="text-xs text-muted-foreground">Agents work better with business context.</p>
                        </div>
                        <Button size="sm" variant="outline" className="ml-auto" asChild>
                            <a href="/onboarding">Complete Profile</a>
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowOnboardingBanner(false)}
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                                    <Sparkles className="h-5 w-5 text-amber-500" />
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
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'hover:border-warm-border'
                                                    }`}
                                                onClick={() => toggleAgentSelection(agent.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-4 w-4 text-amber-500" />
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

            <Dialog open={showAddNodeDialog} onOpenChange={setShowAddNodeDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Agent Node</DialogTitle>
                        <DialogDescription>
                            Choose an agent and drop it onto the workflow canvas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Agent</Label>
                            <Select value={newNodeAgentId} onValueChange={(value) => setNewNodeAgentId(value as AgentType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.map(agent => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <textarea
                                className="w-full min-h-[90px] p-3 border rounded-md bg-background text-sm"
                                placeholder="What should this agent do?"
                                value={newNodeDescription}
                                onChange={(e) => setNewNodeDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddNodeDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddNode}>
                            Add Node
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showNodeEditorDialog} onOpenChange={setShowNodeEditorDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Configure Node</DialogTitle>
                        <DialogDescription>
                            Customize inputs, outputs, and the node description.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <textarea
                                className="w-full min-h-[90px] p-3 border rounded-md bg-background text-sm"
                                placeholder="Describe the node's responsibility"
                                value={nodeEditorValues.description}
                                onChange={(e) => setNodeEditorValues({
                                    ...nodeEditorValues,
                                    description: e.target.value,
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Inputs (comma separated)</Label>
                            <Input
                                placeholder="user_input, audience, goals"
                                value={nodeEditorValues.inputs}
                                onChange={(e) => setNodeEditorValues({
                                    ...nodeEditorValues,
                                    inputs: e.target.value,
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Outputs (comma separated)</Label>
                            <Input
                                placeholder="output, csv, image_url"
                                value={nodeEditorValues.outputs}
                                onChange={(e) => setNodeEditorValues({
                                    ...nodeEditorValues,
                                    outputs: e.target.value,
                                })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNodeEditorDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={applyNodeEditorChanges}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Workflows Sidebar */}
                <div className="lg:col-span-4">
                    <Card className="border-warm-border bg-warm-surface">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-foreground">Workflows</CardTitle>
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
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'hover:border-warm-border'
                                                    }`}
                                                onClick={() => selectWorkflow(workflow)}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <GitBranch className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                        <span className="font-medium text-sm truncate">{workflow.name}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 flex-shrink-0"
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
                <div className="lg:col-span-8">
                    <Card className="min-h-[600px] border-warm-border bg-warm-surface">
                        <CardHeader className="pb-3 border-b border-warm-border">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                                <div>
                                    <CardTitle className="text-lg">
                                        {selectedWorkflow?.name || 'Select a Workflow'}
                                    </CardTitle>
                                    {selectedWorkflow?.description && (
                                        <CardDescription>{selectedWorkflow.description}</CardDescription>
                                    )}
                                </div>
                                {selectedWorkflow && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAddNodeDialog(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Node
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={syncWorkflowPlanFromCanvas}
                                            disabled={!isCanvasDirty || isSavingCanvas}
                                        >
                                            {isSavingCanvas ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-1" />
                                            )}
                                            Save
                                        </Button>
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsCanvasFullscreen(true)}
                                        >
                                            <Maximize2 className="h-4 w-4 mr-1" />
                                            Full Screen
                                        </Button>
                                        <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
                                            <Button
                                                size="sm"
                                                onClick={openExecuteDialog}
                                                disabled={(!selectedWorkflow?.workflow_plan?.steps?.length && flowNodes.length === 0) || isExecuting}
                                            >
                                                {isExecuting ? (
                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <Play className="h-4 w-4 mr-1" />
                                                )}
                                                Execute
                                            </Button>
                                            <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] overflow-hidden">
                                                <DialogHeader>
                                                    <DialogTitle>Execute Workflow</DialogTitle>
                                                    <DialogDescription>
                                                        Provide inputs for the workflow
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 overflow-y-auto max-h-[55vh] pr-1">
                                                    {!executionMode ? (
                                                        <div className="grid grid-cols-1 gap-4 py-4">
                                                            <Card
                                                                className="cursor-pointer hover:border-amber-500 transition-all border-dashed"
                                                                onClick={() => selectExecutionMode('hybrid')}
                                                            >
                                                                <CardHeader className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-amber-500/10 p-2 rounded-full text-amber-500">
                                                                            <Sparkles className="h-5 w-5" />
                                                                        </div>
                                                                        <div>
                                                                            <CardTitle className="text-base">Hybrid Mode (Recommended)</CardTitle>
                                                                            <CardDescription className="text-xs">Use my onboarding data & ask smart follow-ups</CardDescription>
                                                                        </div>
                                                                    </div>
                                                                </CardHeader>
                                                            </Card>
                                                            <Card
                                                                className="cursor-pointer hover:border-amber-500 transition-all border-dashed"
                                                                onClick={() => selectExecutionMode('manual')}
                                                            >
                                                                <CardHeader className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-blue-500/10 p-2 rounded-full text-blue-500">
                                                                            <Bot className="h-5 w-5" />
                                                                        </div>
                                                                        <div>
                                                                            <CardTitle className="text-base">Full Manual Mode</CardTitle>
                                                                            <CardDescription className="text-xs">Manual input for all agents (unlimited questions)</CardDescription>
                                                                        </div>
                                                                    </div>
                                                                </CardHeader>
                                                            </Card>
                                                        </div>
                                                    ) : isConfiguring ? (
                                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                                            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                                                            <p className="text-sm text-muted-foreground">AI is designing your input workflow...</p>
                                                        </div>
                                                    ) : (
                                                        (() => {
                                                            const requiredInputs = configInputs.length > 0 ? configInputs : getRequiredInputs()
                                                            if (requiredInputs.length === 0) {
                                                                return (
                                                                    <div className="space-y-4">
                                                                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-center gap-3">
                                                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                                            <p className="text-sm font-medium">All inputs auto-filled from your profile!</p>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground">You can proceed directly to execution or go back to manual mode.</p>
                                                                    </div>
                                                                )
                                                            }

                                                            const activeInput = requiredInputs[inputStepIndex]
                                                            const isImageModel = activeInput.field.includes('image_model') || activeInput.label.toLowerCase().includes('image model')
                                                            return (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                        <span className="font-medium bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full capitalize">
                                                                            {executionMode} Mode
                                                                        </span>
                                                                        <span>Question {inputStepIndex + 1} of {requiredInputs.length}</span>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {activeInput.group && (
                                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{activeInput.group}</span>
                                                                        )}
                                                                        <Label className="text-sm font-semibold">{activeInput.label}</Label>

                                                                        {activeInput.type === 'image' ? (
                                                                            <div className="space-y-3">
                                                                                <div
                                                                                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-amber-500/50 transition-colors cursor-pointer bg-muted/30"
                                                                                    onClick={() => document.getElementById(`upload-${activeInput.field}`)?.click()}
                                                                                >
                                                                                    <input
                                                                                        type="file"
                                                                                        id={`upload-${activeInput.field}`}
                                                                                        className="hidden"
                                                                                        accept="image/*"
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files?.[0]
                                                                                            if (file) handleImageUpload(activeInput.field, file)
                                                                                        }}
                                                                                    />
                                                                                    {userInputs[activeInput.field] ? (
                                                                                        <div className="relative group">
                                                                                            <img
                                                                                                src={userInputs[activeInput.field]}
                                                                                                alt="Preview"
                                                                                                className="max-h-[200px] rounded-md shadow-sm"
                                                                                            />
                                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md transition-opacity">
                                                                                                <span className="text-white text-xs font-medium">Change Image</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                                                                            <div className="text-center">
                                                                                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                                                                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP (max 5MB)</p>
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ) : isImageModel ? (
                                                                            <Select
                                                                                value={userInputs[activeInput.field] || DEFAULT_IMAGE_MODEL}
                                                                                onValueChange={(value) => setUserInputs({
                                                                                    ...userInputs,
                                                                                    [activeInput.field]: value
                                                                                })}
                                                                            >
                                                                                <SelectTrigger>
                                                                                    <SelectValue placeholder="Select a model" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {IMAGE_MODEL_OPTIONS.map(option => (
                                                                                        <SelectItem key={option.value} value={option.value}>
                                                                                            {option.label}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        ) : (
                                                                            <textarea
                                                                                className="w-full min-h-[180px] p-3 border rounded-md bg-background text-sm resize-none focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                                                                                value={userInputs[activeInput.field] || ''}
                                                                                onChange={(e) => setUserInputs({
                                                                                    ...userInputs,
                                                                                    [activeInput.field]: e.target.value
                                                                                })}
                                                                                placeholder={`Enter ${activeInput.label.toLowerCase()}...`}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })()
                                                    )}
                                                </div>
                                                <DialogFooter>
                                                    {executionMode && !isConfiguring && (
                                                        <div className="flex w-full items-center justify-between">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    if (inputStepIndex === 0) setExecutionMode(null)
                                                                    else setInputStepIndex(prev => Math.max(prev - 1, 0))
                                                                }}
                                                            >
                                                                {inputStepIndex === 0 ? 'Mode Select' : 'Back'}
                                                            </Button>
                                                            <div className="flex gap-2">
                                                                <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
                                                                    Cancel
                                                                </Button>
                                                                {(configInputs.length > 0 ? configInputs : getRequiredInputs()).length > 0 && inputStepIndex < (configInputs.length > 0 ? configInputs : getRequiredInputs()).length - 1 ? (
                                                                    <Button onClick={() => setInputStepIndex(prev => prev + 1)}>
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
                                                    {!executionMode && !isConfiguring && (
                                                        <Button variant="ghost" onClick={() => setShowExecuteDialog(false)}>
                                                            Cancel
                                                        </Button>
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
                            ) : flowNodes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[450px] text-center">
                                    <Wand2 className="h-16 w-16 text-amber-500 mb-4" />
                                    <h3 className="text-lg font-medium">Empty Workflow</h3>
                                    <p className="text-muted-foreground mt-2 max-w-md">
                                        Add nodes manually or use the AI Orchestrator to generate a starter workflow.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button onClick={() => setShowAddNodeDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Node
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowOrchestratorDialog(true)}>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Design with AI
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                renderCanvasFlow(
                                    'h-[520px] w-full rounded-xl border border-warm-border bg-gradient-to-br from-amber-50/40 via-white to-amber-100/40 dark:from-amber-950/20 dark:via-background dark:to-amber-900/30'
                                )
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {isCanvasFullscreen && (
                <div className="fixed inset-0 z-50 bg-background">
                    <div className="flex h-full flex-col">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-border bg-warm-surface px-4 py-3">
                            <div className="text-sm font-semibold text-foreground">
                                Full Screen Canvas
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedWorkflow && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAddNodeDialog(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Node
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={syncWorkflowPlanFromCanvas}
                                            disabled={!isCanvasDirty || isSavingCanvas}
                                        >
                                            {isSavingCanvas ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-1" />
                                            )}
                                            Save
                                        </Button>
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
                                        <Button
                                            size="sm"
                                            onClick={openExecuteDialog}
                                            disabled={(!selectedWorkflow?.workflow_plan?.steps?.length && flowNodes.length === 0) || isExecuting}
                                        >
                                            {isExecuting ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Play className="h-4 w-4 mr-1" />
                                            )}
                                            Execute
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCanvasFullscreen(false)}
                                >
                                    <Minimize2 className="h-4 w-4 mr-1" />
                                    Exit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setIsCanvasFullscreen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1">
                            {renderCanvasFlow('h-full w-full bg-gradient-to-br from-amber-50/40 via-white to-amber-100/40 dark:from-amber-950/20 dark:via-background dark:to-amber-900/30')}
                        </div>
                    </div>
                </div>
            )}

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
                                        {executionResult?.user_inputs && (
                                            <button
                                                type="button"
                                                className={`w-full text-left p-2.5 rounded-md border transition-colors mb-2 ${selectedResultStepId === '__inputs__'
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'hover:border-warm-border hover:bg-warm-muted'
                                                    }`}
                                                onClick={() => setSelectedResultStepId('__inputs__')}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Settings className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                    <span className="text-xs font-medium truncate">Run Inputs</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground truncate block">Initial Parameters</span>
                                            </button>
                                        )}
                                        {executionResult?.final_result?.summary && (
                                            <button
                                                type="button"
                                                className={`w-full text-left p-2.5 rounded-md border transition-colors ${selectedResultStepId === '__summary__'
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'hover:border-warm-border hover:bg-warm-muted'
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
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'hover:border-warm-border hover:bg-warm-muted'
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
                                    const isInputs = selectedResultStepId === '__inputs__'
                                    const result = isInputs ? executionResult?.user_inputs : (selectedResultStepId === '__summary__' ? executionResult?.final_result : executionResult?.step_results?.[selectedResultStepId as string])
                                    const content = isInputs ? (typeof result === 'object' ? JSON.stringify(result, null, 2) : result) : (result?.error || result?.response || result?.summary || (result ? (typeof result === 'string' ? result : JSON.stringify(result, null, 2)) : 'Select a step to view its output.'))
                                    const agentType = result?.agent_type
                                    const isSummary = selectedResultStepId === '__summary__'
                                    const isImage = (agentType === 'image_generation' || agentType === 'linkedin_headshot' || isSummary) &&
                                        (typeof content === 'string' && (content.startsWith('http') || content.startsWith('data:image/')))
                                    const isAdCopy = agentType === 'ad_copy'
                                    const isSpecializedText = isSummary || agentType === 'deep_research' || isInputs

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
                                                    ) : isInputs ? (
                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {Object.entries(result || {}).map(([key, value]: [string, any]) => (
                                                                    <div key={key} className="border-b pb-4 last:border-0">
                                                                        <Label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">{key.replace(/_/g, ' ')}</Label>
                                                                        {typeof value === 'string' && value.startsWith('data:image/') ? (
                                                                            <img src={value} alt={key} className="max-w-xs rounded-lg border shadow-sm mt-2" />
                                                                        ) : (
                                                                            <p className="text-sm whitespace-pre-wrap">{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
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
                                                                <div className="mb-6 p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-sm">
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <div className="p-2 bg-amber-500 rounded-lg flex items-center justify-center">
                                                                            <Sparkles className="h-5 w-5 text-zinc-900" />
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="text-xl font-bold text-foreground">Workflow Summary</h3>
                                                                            <p className="text-sm text-muted-foreground font-medium">Strategic Insights & Findings</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-px w-full bg-amber-500/30 my-4" />
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
                            <History className="h-5 w-5 text-amber-500" />
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
                                    className="border rounded-lg p-4 hover:border-amber-500/50 cursor-pointer transition-colors"
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
            {isExecuting && !isExecutionOverlayHidden && (
                <div className="fixed bottom-6 right-0 left-0 px-6 sm:left-auto sm:px-0 sm:right-6 z-50 w-full sm:w-80">
                    <Card className="border-amber-500/50 border-warm-border bg-warm-surface shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                                    <span className="font-medium">Executing Workflow...</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setIsExecutionOverlayHidden(true)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{Math.round(executionProgress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 transition-all duration-300"
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
            {isExecuting && isExecutionOverlayHidden && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExecutionOverlayHidden(false)}
                    >
                        Show progress
                    </Button>
                </div>
            )}
        </div>
    )
}
