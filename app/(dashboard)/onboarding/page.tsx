'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Save, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Onboarding</h1>
                <p className="text-muted-foreground mt-2">
                    Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
                </p>
                {/* Progress Bar */}
                <div className="w-full max-w-md mx-auto h-2 bg-warm-muted mt-4 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            <Card className="max-w-2xl mx-auto border-warm-border bg-warm-surface shadow-sm">
                <CardHeader>
                    <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                    <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 min-h-[300px]">
                    {currentStep === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label>Business Name</Label>
                                <Input
                                    value={formData.business_name}
                                    onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Website (Optional)</Label>
                                <Input
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Industry</Label>
                                <Select
                                    value={formData.industry}
                                    onValueChange={v => setFormData({ ...formData, industry: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                            <div className="space-y-2">
                                <Label>Short Description</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What does your business do?"
                                />
                            </div>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <div className="space-y-2">
                                <Label>Mission Statement</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                                    value={formData.mission}
                                    onChange={e => setFormData({ ...formData, mission: e.target.value })}
                                    placeholder="Why does your company exist?"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unique Selling Proposition (USP)</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                                    value={formData.usp}
                                    onChange={e => setFormData({ ...formData, usp: e.target.value })}
                                    placeholder="What makes you different from competitors?"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tone of Voice</Label>
                                <Select
                                    value={formData.tone_voice}
                                    onValueChange={v => setFormData({ ...formData, tone_voice: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional & Corporate</SelectItem>
                                        <SelectItem value="friendly">Friendly & Casual</SelectItem>
                                        <SelectItem value="enthusiastic">Enthusiastic & High Energy</SelectItem>
                                        <SelectItem value="luxury">Luxury & Sophisticated</SelectItem>
                                        <SelectItem value="educational">Educational & Informative</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {currentStep === 3 && (
                        <>
                            <div className="space-y-2">
                                <Label>Ideal Customer Profile</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                                    value={formData.audience_desc}
                                    onChange={e => setFormData({ ...formData, audience_desc: e.target.value })}
                                    placeholder="Who is your ideal customer? (Demographics, job titles, interests)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Customer Pain Points</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                                    value={formData.pain_points}
                                    onChange={e => setFormData({ ...formData, pain_points: e.target.value })}
                                    placeholder="What problems are you solving for them?"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Secondary Problems (Optional)</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                                    value={formData.secondary_problems}
                                    onChange={e => setFormData({ ...formData, secondary_problems: e.target.value })}
                                    placeholder="Any other related problems? (Optional)"
                                />
                            </div>
                        </>
                    )}

                    {currentStep === 4 && (
                        <>
                            <div className="space-y-2">
                                <Label>Primary Business Goal</Label>
                                <Select
                                    value={formData.primary_goal}
                                    onValueChange={v => setFormData({ ...formData, primary_goal: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select primary goal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sales">Increase Sales / Revenue</SelectItem>
                                        <SelectItem value="leads">Generate Leads</SelectItem>
                                        <SelectItem value="awareness">Brand Awareness</SelectItem>
                                        <SelectItem value="retention">Customer Retention</SelectItem>
                                        <SelectItem value="efficiency">Operational Efficiency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-2">Business Snapshot</h3>
                                <p><span className="font-medium">Name:</span> {formData.business_name}</p>
                                <p><span className="font-medium">Industry:</span> {formData.industry}</p>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-2">Values</h3>
                                <p><span className="font-medium">Mission:</span> {formData.mission}</p>
                                <p><span className="font-medium">USP:</span> {formData.usp}</p>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-2">Audience</h3>
                                <p>{formData.audience_desc}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between items-center gap-4">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            disabled={currentStep === 1 || isSaving}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        {currentStep === 5 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        type="button"
                                        disabled={isSaving}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your onboarding profile
                                            and remove all saved business context from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete Profile
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
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={(e) => handleSave(true, e)}
                            disabled={isSaving}
                            className="bg-amber-500 text-zinc-900 hover:bg-amber-600"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Finish & Save
                                </>
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
