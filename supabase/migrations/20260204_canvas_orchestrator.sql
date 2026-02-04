-- Canvas Orchestrator Tables
-- Workflows define multi-agent orchestration plans

-- Workflows table - stores the orchestration plans
CREATE TABLE public.workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL DEFAULT 'Untitled Workflow',
    description text,
    workflow_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- workflow_plan structure:
    -- {
    --   "workflow_name": "string",
    --   "steps": [...],
    --   "final_response_strategy": {...}
    -- }
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflows_pkey PRIMARY KEY (id),
    CONSTRAINT workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Workflow steps table - individual steps in a workflow
CREATE TABLE public.workflow_steps (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL,
    step_id text NOT NULL,
    agent_type text NOT NULL,
    description text,
    depends_on text[] DEFAULT ARRAY[]::text[],
    input_mapping jsonb DEFAULT '{}'::jsonb,
    -- input_mapping structure:
    -- {
    --   "from_user": ["field1", "field2"],
    --   "from_steps": { "step_id_1": ["field_from_output"] },
    --   "from_history": { "history_id": "...", "session_strategy": "use_latest" }
    -- }
    step_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflow_steps_pkey PRIMARY KEY (id),
    CONSTRAINT workflow_steps_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE,
    CONSTRAINT workflow_steps_unique_step_id UNIQUE (workflow_id, step_id)
);

-- Workflow executions table - tracks each run of a workflow
CREATE TABLE public.workflow_executions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    user_inputs jsonb DEFAULT '{}'::jsonb,
    final_result jsonb,
    error_message text,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT workflow_executions_pkey PRIMARY KEY (id),
    CONSTRAINT workflow_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE,
    CONSTRAINT workflow_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step executions table - tracks each step's execution within a workflow run
CREATE TABLE public.step_executions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    execution_id uuid NOT NULL,
    step_id text NOT NULL,
    agent_type text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    input_data jsonb DEFAULT '{}'::jsonb,
    output_data jsonb,
    error_message text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT step_executions_pkey PRIMARY KEY (id),
    CONSTRAINT step_executions_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
    CONSTRAINT step_executions_unique_step UNIQUE (execution_id, step_id)
);

-- Agent history summaries - cached summaries for orchestrator context
CREATE TABLE public.agent_history_summaries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    agent_type text NOT NULL,
    session_id uuid NOT NULL,
    summary text NOT NULL,
    key_facts text[] DEFAULT ARRAY[]::text[],
    output_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT agent_history_summaries_pkey PRIMARY KEY (id),
    CONSTRAINT agent_history_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT agent_history_summaries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.agent_sessions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_step_executions_execution_id ON public.step_executions(execution_id);
CREATE INDEX idx_agent_history_summaries_user_agent ON public.agent_history_summaries(user_id, agent_type);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_history_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Users can view own workflows" ON public.workflows
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows" ON public.workflows
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows" ON public.workflows
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workflow_steps (via workflow ownership)
CREATE POLICY "Users can view steps of own workflows" ON public.workflow_steps
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.workflows WHERE id = workflow_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create steps for own workflows" ON public.workflow_steps
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.workflows WHERE id = workflow_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can update steps of own workflows" ON public.workflow_steps
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.workflows WHERE id = workflow_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete steps of own workflows" ON public.workflow_steps
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.workflows WHERE id = workflow_id AND user_id = auth.uid())
    );

-- RLS Policies for workflow_executions
CREATE POLICY "Users can view own executions" ON public.workflow_executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own executions" ON public.workflow_executions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own executions" ON public.workflow_executions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for step_executions (via execution ownership)
CREATE POLICY "Users can view own step executions" ON public.step_executions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.workflow_executions WHERE id = execution_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create own step executions" ON public.step_executions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.workflow_executions WHERE id = execution_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can update own step executions" ON public.step_executions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.workflow_executions WHERE id = execution_id AND user_id = auth.uid())
    );

-- RLS Policies for agent_history_summaries
CREATE POLICY "Users can view own history summaries" ON public.agent_history_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own history summaries" ON public.agent_history_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history summaries" ON public.agent_history_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workflows updated_at
CREATE TRIGGER trigger_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_updated_at();
