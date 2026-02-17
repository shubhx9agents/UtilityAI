'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Save, Loader2, Trash2, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ParticleCard, BentoCardGrid, GlobalSpotlight } from '@/components/ui/MagicBento'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const steps = [
    { id: 1, title: 'Business Snapshot', description: 'Tell us about your company' },
    { id: 2, title: 'Key Values', description: 'Define your brand identity' },
    { id: 3, title: 'Target Audience', description: 'Who are your customers?' },
    { id: 4, title: 'Goals', description: 'What are you aiming for?' },
    { id: 5, title: 'Review', description: 'Confirm your details' },
]

export default function OnboardingPage() {
    const supabase = createClient()
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({})

    const toggleExpand = (field: string) => {
        setExpandedFields(prev => ({ ...prev, [field]: !prev[field] }))
    }

    // Form State
    const [formData, setFormData] = useState({
        business_name: '',
        website: '',
        industry: '',
        description: '',
        mission: '',
        usp: '',
        tone_voice: '',
        audience_desc: '',
        pain_points: '',
        secondary_problems: '',
        primary_goal: '',
        marketing_channels: [] as string[] // Simplified for now
    })

    // Fetch existing data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                setUserId(user.id)

                const { data, error } = await supabase
                    .from('onboarding_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (data && data.step_outputs) {
                    setFormData(prev => ({ ...prev, ...data.step_outputs }))
                    if (data.current_step) setCurrentStep(data.current_step)
                }
            } catch (error) {
                console.error('Error fetching onboarding:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleSave = async (isFinishing = false, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!userId) return

        setIsSaving(true)
        try {
            // Check if record exists
            const { data: existing } = await supabase
                .from('onboarding_progress')
                .select('id')
                .eq('user_id', userId)
                .single()

            let error
            if (existing) {
                const { error: updateError } = await supabase
                    .from('onboarding_progress')
                    .update({
                        step_outputs: formData,
                        current_step: isFinishing ? 5 : currentStep + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('onboarding_progress')
                    .insert({
                        user_id: userId,
                        step_outputs: formData,
                        current_step: isFinishing ? 5 : currentStep + 1
                    })
                error = insertError
            }

            if (error) throw error

            if (isFinishing) {
                toast.success('Onboarding completed!')
                router.push('/dashboard')
            } else {
                setCurrentStep(prev => Math.min(prev + 1, 5))
            }
        } catch (error) {
            console.error('Failed to save:', error)
            toast.error('Failed to save progress')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteProfile = async () => {
        if (!userId) return

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('onboarding_progress')
                .delete()
                .eq('user_id', userId)

            if (error) throw error

            // Reset local state
            setFormData({
                business_name: '',
                website: '',
                industry: '',
                description: '',
                mission: '',
                usp: '',
                tone_voice: '',
                audience_desc: '',
                pain_points: '',
                secondary_problems: '',
                primary_goal: '',
                marketing_channels: []
            })
            setCurrentStep(1)
            toast.success('Profile deleted successfully')
        } catch (error) {
            console.error('Failed to delete:', error)
            toast.error('Failed to delete profile')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center">
            {/* Main Container with Particle Effect */}
            <ParticleCard
                className="w-full border-[#262626] bg-[#030303] overflow-hidden shadow-2xl !aspect-auto !min-h-0 magic-bento-card--static-glow"
                particleCount={0}
                glowColor="245, 158, 11"
                enableTilt={false}
            >
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Sidebar: Progress & Context */}
                    <div className="w-full md:w-1/3 bg-white/5 p-8 border-b md:border-b-0 md:border-r border-[#262626] flex flex-col justify-between">
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-6">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h1 className="font-heading text-2xl font-bold text-white mb-2">Build Your Identity</h1>
                            <p className="text-white/40 text-sm mb-8">
                                Help us understand your business to generate highly personalized AI results.
                            </p>

                            <nav className="space-y-4">
                                {steps.map((step) => (
                                    <button
                                        key={step.id}
                                        onClick={() => setCurrentStep(step.id)}
                                        className={`flex items-center gap-3 transition-all duration-300 w-full text-left group ${currentStep === step.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                                            }`}
                                    >
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${currentStep === step.id
                                            ? 'bg-amber-500 text-black border-amber-500'
                                            : 'border-white/20 text-white group-hover:border-amber-500/50'
                                            }`}>
                                            {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${currentStep === step.id ? 'text-white' : 'text-white/60 group-hover:text-amber-500'
                                                }`}>{step.title}</p>
                                        </div>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 hidden md:block">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-2">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs text-amber-500/80 font-medium">Drafting Profile</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form Content */}
                    <div className="flex-1 p-8 sm:p-12 relative flex flex-col">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white">{steps[currentStep - 1].title}</h2>
                            <p className="text-white/50 text-sm">{steps[currentStep - 1].description}</p>
                        </div>

                        <div className="flex-1 min-h-[350px]">
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Business Name</Label>
                                        <Input
                                            className="bg-white/5 border-[#262626] text-white focus:border-amber-500/50 h-11"
                                            value={formData.business_name}
                                            onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                            placeholder="e.g. Acme Corp"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Industry</Label>
                                        <Select
                                            value={formData.industry}
                                            onValueChange={v => setFormData({ ...formData, industry: v })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-[#262626] text-white h-11">
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0d0d0d] border-[#262626] text-white">
                                                <SelectItem value="technology">Technology / SaaS</SelectItem>
                                                <SelectItem value="ecommerce">E-commerce</SelectItem>
                                                <SelectItem value="agency">Agency / Services</SelectItem>
                                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                                <SelectItem value="finance">Finance</SelectItem>
                                                <SelectItem value="education">Education</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Website (Optional)</Label>
                                        <Input
                                            className="bg-white/5 border-[#262626] text-white focus:border-amber-500/50 h-11"
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div className="space-y-4 sm:col-span-2">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Short Description</Label>
                                        <textarea
                                            className="flex w-full rounded-lg border border-[#262626] bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none min-h-[300px] transition-all"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Briefly explain what your business does..."
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Mission Statement</Label>
                                        <textarea
                                            className="flex w-full rounded-lg border border-[#262626] bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none min-h-[180px] transition-all"
                                            value={formData.mission}
                                            onChange={e => setFormData({ ...formData, mission: e.target.value })}
                                            placeholder="Why does your company exist? What's your core purpose?"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Unique Selling Proposition (USP)</Label>
                                        <textarea
                                            className="flex w-full rounded-lg border border-[#262626] bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none min-h-[180px] transition-all"
                                            value={formData.usp}
                                            onChange={e => setFormData({ ...formData, usp: e.target.value })}
                                            placeholder="What makes you stand out from the competition?"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Brand Voice</Label>
                                        <Select
                                            value={formData.tone_voice}
                                            onValueChange={v => setFormData({ ...formData, tone_voice: v })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-[#262626] text-white h-11">
                                                <SelectValue placeholder="Select tone" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0d0d0d] border-[#262626] text-white">
                                                <SelectItem value="professional">Professional & Corporate</SelectItem>
                                                <SelectItem value="friendly">Friendly & Casual</SelectItem>
                                                <SelectItem value="enthusiastic">Enthusiastic & High Energy</SelectItem>
                                                <SelectItem value="luxury">Luxury & Sophisticated</SelectItem>
                                                <SelectItem value="educational">Educational & Informative</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Ideal Customer Profile</Label>
                                        <textarea
                                            className="flex w-full rounded-lg border border-[#262626] bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none min-h-[180px] transition-all"
                                            value={formData.audience_desc}
                                            onChange={e => setFormData({ ...formData, audience_desc: e.target.value })}
                                            placeholder="Describe your target audience (Demographics, job titles, interests)..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Main Pain Points</Label>
                                        <textarea
                                            className="flex w-full rounded-lg border border-[#262626] bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none min-h-[150px] transition-all"
                                            value={formData.pain_points}
                                            onChange={e => setFormData({ ...formData, pain_points: e.target.value })}
                                            placeholder="What specific problems are you solving for them?"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Secondary Challenges (Optional)</Label>
                                        <textarea
                                            className="flex w-full rounded-lg border border-[#262626] bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none min-h-[80px] transition-all"
                                            value={formData.secondary_problems}
                                            onChange={e => setFormData({ ...formData, secondary_problems: e.target.value })}
                                            placeholder="Any other related issues your customers face?"
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Primary Business Goal</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { id: 'sales', label: 'Increase Sales', icon: Save },
                                                { id: 'leads', label: 'Generate Leads', icon: Sparkles },
                                                { id: 'awareness', label: 'Brand Awareness', icon: Sparkles },
                                                { id: 'retention', label: 'Customer Retention', icon: Sparkles },
                                                { id: 'efficiency', label: 'Operational Efficiency', icon: Sparkles }
                                            ].map((goal) => (
                                                <button
                                                    key={goal.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, primary_goal: goal.id })}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${formData.primary_goal === goal.id
                                                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                                        : 'bg-white/5 border-[#262626] text-white/60 hover:border-white/20'
                                                        }`}
                                                >
                                                    <goal.icon className="h-5 w-5" />
                                                    <span className="text-sm font-medium">{goal.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold">Business Name</p>
                                            <p className="text-2xl text-white font-bold tracking-tight">{formData.business_name || 'Not provided'}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold">Industry</p>
                                            <div className="text-lg text-white font-medium capitalize flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                {formData.industry || 'Not provided'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-6 border-l-2 border-amber-500/20 pl-6">
                                            <div
                                                className="cursor-pointer group space-y-2"
                                                onClick={() => toggleExpand('mission')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Mission Statement</p>
                                                    <span className="text-[9px] text-amber-500/40 uppercase font-bold group-hover:text-amber-500/80 transition-colors">
                                                        {expandedFields['mission'] ? 'Collapse' : 'Expand View'}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed text-white/80 transition-all duration-500 ${expandedFields['mission'] ? 'bg-white/5 p-4 rounded-lg' : 'line-clamp-2'}`}>
                                                    {formData.mission || 'No mission statement added.'}
                                                </p>
                                            </div>

                                            <div
                                                className="cursor-pointer group space-y-2"
                                                onClick={() => toggleExpand('usp')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Unique Value Proposition</p>
                                                    <span className="text-[9px] text-amber-500/40 uppercase font-bold group-hover:text-amber-500/80 transition-colors">
                                                        {expandedFields['usp'] ? 'Collapse' : 'Expand View'}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed text-white/80 transition-all duration-500 ${expandedFields['usp'] ? 'bg-white/5 p-4 rounded-lg' : 'line-clamp-2'}`}>
                                                    {formData.usp || 'No USP defined.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className="bg-amber-500/5 p-8 rounded-2xl border border-amber-500/10 cursor-pointer group active:scale-[0.99] transition-all"
                                            onClick={() => toggleExpand('audience')}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Rocket className="h-4 w-4 text-amber-500" />
                                                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">Target Audience Strategy</p>
                                                </div>
                                                <span className="text-[9px] text-amber-500/40 uppercase font-bold group-hover:text-amber-500/80 transition-colors">
                                                    {expandedFields['audience'] ? 'Show Less' : 'Full Analysis'}
                                                </span>
                                            </div>
                                            <p className={`text-sm leading-relaxed text-white/90 transition-all duration-500 ${expandedFields['audience'] ? '' : 'line-clamp-3'}`}>
                                                {formData.audience_desc || 'No audience details provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="mt-12 flex justify-between items-center pt-8 border-t border-white/10">
                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    disabled={currentStep === 1 || isSaving}
                                    className="text-white/40 hover:text-white hover:bg-white/5 px-0"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>

                                {currentStep === 5 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                type="button"
                                                disabled={isSaving}
                                                className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Reset
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-[#0d0d0d] border-[#262626] text-white">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Reset Onboarding?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-white/50">
                                                    This will permanently delete your onboarding profile. You will need to start over from step 1.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-white/5 border-[#262626] text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteProfile} className="bg-red-500 text-white hover:bg-red-600">
                                                    Reset Profile
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>

                            {currentStep < 5 ? (
                                <Button
                                    type="button"
                                    onClick={(e) => handleSave(false, e)}
                                    disabled={isSaving}
                                    className="bg-amber-500 text-black hover:bg-amber-400 font-bold px-8 h-12 rounded-xl shadow-lg shadow-amber-500/20"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <>
                                            Next Step
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={(e) => handleSave(true, e)}
                                    disabled={isSaving}
                                    className="bg-amber-500 text-black hover:bg-amber-400 font-bold px-12 h-12 rounded-xl shadow-lg shadow-amber-500/20"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Complete Profile
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </ParticleCard>
        </div>
    )
}
