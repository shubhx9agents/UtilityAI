// Database Types
export interface Profile {
    id: string
    email: string
    name: string
    role: 'user' | 'admin'
    account_type: 'basic' | 'premium' | 'enterprise'
    must_change_password: boolean
    api_keys?: Record<string, string>
    created_at: string
    last_login?: string
    updated_at: string
}

export interface OnboardingProgress {
    id: string
    user_id: string
    current_step: number
    completed_steps: number[]
    step_outputs: Record<string, any>
    updated_at: string
}

export interface Flow {
    id: string
    user_id: string
    name: string
    business_questions: Record<string, any>
    conversation_history: Array<{
        role: 'user' | 'assistant'
        content: string
        timestamp: string
    }>
    created_at: string
    updated_at: string
}

export interface Canvas {
    id: string
    user_id: string
    name: string
    canvas_data: Record<string, any>
    created_at: string
    updated_at: string
}

export interface Note {
    id: string
    user_id: string
    title: string
    content: Record<string, any>
    created_at: string
    updated_at: string
}

export interface LibraryItem {
    id: string
    user_id: string
    file_type: string
    file_name: string
    file_data: string
    metadata: Record<string, any>
    created_at: string
}

// Form Types
export interface LoginFormData {
    email: string
    password: string
}

export interface RegisterFormData {
    email: string
    name: string
    password: string
    confirmPassword: string
    account_type: 'basic' | 'premium' | 'enterprise'
}

export interface PasswordChangeFormData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

// AI Agent Types
export type AgentType =
    | 'business_snapshot'
    | 'ad_copy'
    | 'graphics'
    | 'landing_page'
    | 'social_media'
    | 'seo'
    | 'pricing'
    | 'growth'
    | 'deep_research'
    | 'image_generation'
    | 'linkedin_headshot'

export interface AgentConfig {
    system_message: string
    questions: string[]
}

export interface AgentRunRequest {
    agent_type: AgentType
    input: string
    context?: Record<string, any>
}

export interface AgentRunResponse {
    response: string
}

export interface AgentSession {
    id: string
    user_id: string
    agent_type: AgentType
    session_name: string | null
    form_data: Record<string, any>
    response: string | null
    refined_prompt: string | null
    chat_messages: Array<{ role: 'user' | 'assistant', content: string, timestamp?: string }>
    created_at: string
    updated_at: string
}

export interface CreateSessionRequest {
    agent_type: AgentType
    form_data: Record<string, any>
    response: string
    refined_prompt?: string
    chat_messages?: Array<{ role: 'user' | 'assistant', content: string }>
}

export interface UpdateSessionRequest {
    chat_messages?: Array<{ role: 'user' | 'assistant', content: string }>
    form_data?: Record<string, any>
    response?: string
}

// API Response Types
export interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
}

// Admin & Audit Types
export type UserRoleType = 'user' | 'admin'

export interface UserRole {
    id: string
    user_id: string
    role: UserRoleType
    created_at: string
    updated_at: string
}

export type AuditAction =
    | 'user.login'
    | 'user.logout'
    | 'user.signup'
    | 'user.password_reset'
    | 'session.created'
    | 'session.updated'
    | 'session.deleted'
    | 'session.restored'
    | 'role.updated'

export interface AuditLog {
    id: string
    user_id: string | null
    user_email: string | null
    action: AuditAction
    resource_type: string | null
    resource_id: string | null
    details: Record<string, any> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

export interface AuditLogFilters {
    user_id?: string
    action?: AuditAction
    resource_type?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
}

export interface AdminStats {
    total_users: number
    total_sessions: number
    recent_activity_24h: number
    most_active_users: Array<{
        user_email: string
        action_count: number
    }>
    most_used_agents: Array<{
        agent_type: string
        usage_count: number
    }>
}

export interface AdminUser {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
    role: UserRoleType
    session_count: number
}

// ==========================================
// Canvas Orchestrator Types
// ==========================================

// Workflow Step Input Mapping
export interface StepInputMapping {
    from_user?: string[]
    from_steps?: Record<string, string[]>
    from_history?: {
        history_id: string
        session_strategy: 'use_latest' | 'use_all' | 'use_specific'
        session_ids?: string[]
    }
}

// Workflow Step Definition
export interface WorkflowStep {
    step_id: string
    agent_id: string // maps to agent_type
    description: string
    depends_on: string[]
    input_mapping: StepInputMapping
}

// Final Response Strategy
export interface FinalResponseStrategy {
    type: 'merge_and_summarize' | 'concatenate' | 'select_best' | 'custom'
    from_steps: string[]
    instructions: string
}

// Workflow Plan (the JSON structure for orchestration)
export interface WorkflowPlan {
    workflow_name: string
    steps: WorkflowStep[]
    final_response_strategy: FinalResponseStrategy
}

// Database: Workflow
export interface Workflow {
    id: string
    user_id: string
    name: string
    description: string | null
    workflow_plan: WorkflowPlan
    status: 'draft' | 'active' | 'archived'
    created_at: string
    updated_at: string
}

// Database: Workflow Step (stored separately)
export interface WorkflowStepRecord {
    id: string
    workflow_id: string
    step_id: string
    agent_type: AgentType
    description: string | null
    depends_on: string[]
    input_mapping: StepInputMapping
    step_order: number
    created_at: string
}

// Execution Status Types
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type StepExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

// Database: Workflow Execution
export interface WorkflowExecution {
    id: string
    workflow_id: string
    user_id: string
    status: ExecutionStatus
    user_inputs: Record<string, any>
    final_result: Record<string, any> | null
    error_message: string | null
    started_at: string
    completed_at: string | null
}

// Database: Step Execution
export interface StepExecution {
    id: string
    execution_id: string
    step_id: string
    agent_type: AgentType
    status: StepExecutionStatus
    input_data: Record<string, any>
    output_data: Record<string, any> | null
    error_message: string | null
    started_at: string | null
    completed_at: string | null
}

// Agent History for Orchestrator
export interface AgentHistorySummary {
    id: string
    user_id: string
    agent_type: AgentType
    session_id: string
    summary: string
    key_facts: string[]
    output_fields: Record<string, any>
    created_at: string
}

// Agent History Context (passed to orchestrator)
export interface AgentHistoryContext {
    agent_id: string
    history_id: string
    last_sessions: Array<{
        session_id: string
        summary: string
        key_facts: string[]
        created_at: string
    }>
}

// Orchestrator Request
export interface OrchestratorRequest {
    user_instruction: string
    agents: Array<{
        id: string
        name: string
        capabilities: string[]
        current_state: 'idle' | 'busy'
        history_id?: string
    }>
    histories?: AgentHistoryContext[]
}

// Orchestrator Response (the generated plan)
export interface OrchestratorResponse {
    workflow_plan: WorkflowPlan
    validation_errors?: string[]
}

// Create Workflow Request
export interface CreateWorkflowRequest {
    name: string
    description?: string
    workflow_plan: WorkflowPlan
}

// Update Workflow Request
export interface UpdateWorkflowRequest {
    name?: string
    description?: string
    workflow_plan?: WorkflowPlan
    status?: 'draft' | 'active' | 'archived'
}

// Execute Workflow Request
export interface ExecuteWorkflowRequest {
    workflow_id: string
    user_inputs: Record<string, any>
}

// Canvas Node (for UI visualization)
export interface CanvasNode {
    id: string
    type: 'agent' | 'input' | 'output' | 'merge'
    position: { x: number; y: number }
    data: {
        label: string
        step_id?: string
        agent_type?: AgentType
        description?: string
        status?: StepExecutionStatus
        output?: any
    }
}

// Canvas Edge (for UI visualization)
export interface CanvasEdge {
    id: string
    source: string
    target: string
    label?: string
}

// Canvas State
export interface CanvasState {
    nodes: CanvasNode[]
    edges: CanvasEdge[]
    workflow_id?: string
    execution_id?: string
}
