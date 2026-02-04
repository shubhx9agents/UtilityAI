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
    | 'sales_script'
    | 'landing_page'
    | 'email_sequence'
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
