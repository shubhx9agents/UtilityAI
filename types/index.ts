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

// API Response Types
export interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
}
