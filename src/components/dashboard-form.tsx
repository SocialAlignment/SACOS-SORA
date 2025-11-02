'use client';
// Earth tones color palette applied
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DashboardFormData } from '@/types/dashboard';
import type { BrandCanon } from '@/types/brand-canon';
import { BrandSelector } from '@/components/brand-selector';
import { BrandOnboardingModal } from '@/components/brand-onboarding-modal';
import { queryBrandCanon } from '@/lib/qdrant-client';
import { ArrowLeft, ArrowRight, CheckCircle, HelpCircle, Info, Lightbulb, Loader2 } from 'lucide-react';
import * as React from 'react';
import type { MatrixResult } from '@/types/dashboard';
import { MatrixPreview } from '@/components/matrix-preview';
import { MatrixPreviewTable } from '@/components/matrix-preview-table';
import { calculateMatrixCombinations } from '@/lib/matrix-calculator';
import { calculateBatchCost } from '@/lib/cost-calculator';
import { CostSummary } from '@/components/cost-summary';
import { CostBreakdown } from '@/components/cost-breakdown';
import { v4 as uuidv4 } from 'uuid';
// Removed campaignApi - now handled by /api/generate-batch endpoint
// import { campaignApi, combinationApi } from '@/lib/campaign-api';
import { aiRecommendations, type AIRecommendationResult } from '@/lib/ai-recommendations';
import { performanceAnalytics, type BrandAnalytics } from '@/lib/performance-analytics';
import { WinningFormulaInsights } from '@/components/winning-formula-insights';
import { Sparkles } from 'lucide-react';

type DashboardFormProps = {
    onSubmit: (data: DashboardFormData, batchData?: any) => void;
    isLoading: boolean;
};

const STORAGE_KEY = 'sacos-dashboard-form-data';

// Field options from brainstorming session
const FUNNEL_LEVELS = [
    { value: 'unaware', label: 'Unaware' },
    { value: 'problem-aware', label: 'Problem Aware' },
    { value: 'solution-aware', label: 'Solution Aware' },
    { value: 'product-aware', label: 'Product Aware' },
    { value: 'most-aware', label: 'Most Aware' }
];

const AESTHETICS = [
    { value: 'animated-2d', label: 'Animated-2D' },
    { value: 'ugc', label: 'UGC' },
    { value: 'professional', label: 'Professional' },
    { value: 'cinema', label: 'Cinema' },
    { value: 'animated-3d', label: 'Animated-3D' }
];

const ANIMATION_STYLES = [
    { value: 'paper-cutout-2650822702', label: 'Paper Cutout (--sref 2650822702)', desc: 'Nostalgic, handcrafted' },
    { value: 'lego', label: 'Lego Style', desc: 'Adventure, kid-friendly' },
    { value: 'ukiyo-e-2950587055', label: 'Ukiyo-E (--sref 2950587055)', desc: 'Japanese aesthetic, peaceful' },
    { value: 'sci-fi-anime-2966984073', label: 'Sci-Fi Anime (--sref 2966984073)', desc: 'Dark futuristic' },
    { value: 'comic-book-3048385687', label: 'Comic Book (--sref 3048385687)', desc: 'Dynamic action' },
    { value: 'pixel-animation', label: 'Pixel Animation', desc: 'Retro gaming' },
    { value: 'pixar-style', label: 'Pixar Style', desc: 'Expressive, humorous' }
];

const VIDEO_TYPES = [
    { value: 'review-social-proof', label: 'Review-Social Proof' },
    { value: 'broll-visual-narrative', label: 'B-roll Visual Narrative' },
    { value: 'storytime', label: 'Storytime' },
    { value: 'listicle', label: 'Listicle' },
    { value: 'vsl', label: 'VSL' },
    { value: 'skit', label: 'Skit' },
    { value: 'review-testimonial', label: 'Review-Testimonial' },
    { value: 'vintage-2000s-ad', label: 'Vintage 2000s AD' },
    { value: 'modern-tv-ad', label: 'Modern TV AD' },
    { value: 'vintage-90s-ad', label: 'Vintage 90s AD' },
    { value: 'vintage-80s-ad', label: 'Vintage 80s AD' }
];

const INTENTIONS = [
    { value: 'educate', label: 'Educate' },
    { value: 'entertain', label: 'Entertain' },
    { value: 'challenge-belief', label: 'Challenge Belief' },
    { value: 'provide-value', label: 'Provide Value' },
    { value: 'heighten-mood', label: 'Heighten Mood' },
    { value: 'inspire', label: 'Inspire' }
];

const MOODS = [
    { value: 'wholesome', label: 'Wholesome' },
    { value: 'unhinged', label: 'Unhinged' },
    { value: 'intense', label: 'Intense' },
    { value: 'professional', label: 'Professional' },
    { value: 'shocking', label: 'Shocking' }
];

const AGE_GENERATIONS = [
    { value: 'gen-alpha', label: 'Gen Alpha' },
    { value: 'gen-z', label: 'Gen Z' },
    { value: 'millennial', label: 'Millennial' },
    { value: 'gen-x', label: 'Gen X' },
    { value: 'baby-boomer', label: 'Baby Boomer' }
];

const GENDERS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non Binary' }
];

const ORIENTATIONS = [
    { value: 'straight', label: 'Straight' },
    { value: 'lgbtqia', label: 'LGBTQIA+' }
];

const LIFE_STAGES = [
    { value: 'people', label: 'People' },
    { value: 'unmarried-couple', label: 'Unmarried Couple' },
    { value: 'married-couple', label: 'Married Couple' },
    { value: 'parents', label: 'Parents' }
];

const ETHNICITIES = [
    { value: 'white', label: 'White' },
    { value: 'black', label: 'Black' },
    { value: 'asian', label: 'Asian' },
    { value: 'latino', label: 'Latino' },
    { value: 'middle-eastern', label: 'Middle Eastern' },
    { value: 'indian', label: 'Indian' }
];

export function DashboardForm({ onSubmit, isLoading }: DashboardFormProps) {
    // BRAND MANAGEMENT
    const [brand, setBrand] = React.useState('');
    const [currentBrandCanon, setCurrentBrandCanon] = React.useState<BrandCanon | null>(null);
    const [loadingBrandCanon, setLoadingBrandCanon] = React.useState(false);
    const [showBrandOnboarding, setShowBrandOnboarding] = React.useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = React.useState(false);
    const [pendingBrandSwitch, setPendingBrandSwitch] = React.useState<string | null>(null);
    const [isDirty, setIsDirty] = React.useState(false);

    // PROJECT SETUP
    const [productImage, setProductImage] = React.useState<File | null>(null);
    const [bigIdea, setBigIdea] = React.useState('');
    const [funnelLevel, setFunnelLevel] = React.useState<string[]>([]);

    // CREATIVE DIRECTION
    const [aesthetic, setAesthetic] = React.useState<string[]>([]);
    const [animationStyle, setAnimationStyle] = React.useState<string[]>([]);
    const [type, setType] = React.useState<string[]>([]);
    const [intention, setIntention] = React.useState<string[]>([]);
    const [mood, setMood] = React.useState<string[]>([]);

    // VISUAL & AUDIO MESSAGING
    const [visualMessaging, setVisualMessaging] = React.useState('');
    const [audioMessaging, setAudioMessaging] = React.useState('');
    const [audioStyle, setAudioStyle] = React.useState<string[]>([]);
    const [heroVoDescription, setHeroVoDescription] = React.useState('');
    const [matchDemographic, setMatchDemographic] = React.useState(false);

    // POST-PRODUCTION ASSETS
    const [hookVideo, setHookVideo] = React.useState<File | null>(null);
    const [ctaVideo, setCtaVideo] = React.useState<File | null>(null);
    const [watermark, setWatermark] = React.useState<File | null>(null);

    // GENERATION SETTINGS
    const [music, setMusic] = React.useState(false);
    const [sfx, setSfx] = React.useState(false);
    const [ost, setOst] = React.useState(false);
    const [soraModel, setSoraModel] = React.useState<'sora-2' | 'sora-2-pro'>('sora-2');
    const [videoDuration, setVideoDuration] = React.useState<5 | 10 | 20>(10);

    // DEMOGRAPHICS
    const [ageGeneration, setAgeGeneration] = React.useState<string[]>([]);
    const [gender, setGender] = React.useState<string[]>([]);
    const [orientation, setOrientation] = React.useState<string[]>([]);
    const [lifeStage, setLifeStage] = React.useState<string[]>([]);
    const [ethnicity, setEthnicity] = React.useState<string[]>([]);
    const [lifestyle, setLifestyle] = React.useState('');

    // Validation state
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    // Matrix calculation state
    const [matrixResult, setMatrixResult] = React.useState<MatrixResult | null>(null);

    // Cost calculation state (Story 1.5)
    const [costResult, setCostResult] = React.useState<import('@/types/dashboard').CostResult | null>(null);

    // Screen navigation state (Story 1.6, AC#5)
    const [activeScreen, setActiveScreen] = React.useState<'form' | 'preview'>('form');

    // Exclusion state management (Story 1.6, AC#3, AC#4)
    const [excludedCombinations, setExcludedCombinations] = React.useState<Set<string>>(new Set());

    // Confirmation modal state (Story 1.7, AC#3)
    const [showConfirmationModal, setShowConfirmationModal] = React.useState(false);

    // Success message state (Story 1.7, AC#5)
    const [successMessage, setSuccessMessage] = React.useState<{
        batchId: string;
        estimatedMinutes: number;
        videoCount: number;
    } | null>(null);

    // AI Recommendations state (Story 1.8, Task 7)
    const [showAIRecommendations, setShowAIRecommendations] = React.useState(false);
    const [aiRecommendationData, setAIRecommendationData] = React.useState<AIRecommendationResult | null>(null);
    const [loadingRecommendations, setLoadingRecommendations] = React.useState(false);

    // Winning Formula state (Story 1.8, Task 7)
    const [showWinningFormula, setShowWinningFormula] = React.useState(false);
    const [winningFormulaData, setWinningFormulaData] = React.useState<BrandAnalytics | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = React.useState(false);

    // Campaign database initialization removed - now handled server-side via /api/generate-batch

    // Show animation styles conditionally
    const showAnimationStyles = aesthetic.includes('animated-2d') || aesthetic.includes('animated-3d');
    const showHeroVo = audioStyle.includes('vo');

    // Dynamic duration options based on model - REAL Sora 2 API values only
    const durationOptions = [5, 10, 20]; // Both sora-2 and sora-2-pro support same durations

    // Adjust duration if it's not valid for selected model
    React.useEffect(() => {
        if (!durationOptions.includes(videoDuration)) {
            setVideoDuration(10);
        }
    }, [soraModel, videoDuration, durationOptions]);

    // Track dirty state when any field changes
    React.useEffect(() => {
        const hasChanges = !!(bigIdea.trim() || funnelLevel.length > 0 || aesthetic.length > 0 ||
            type.length > 0 || intention.length > 0 || mood.length > 0 ||
            visualMessaging.trim() || audioMessaging.trim() || audioStyle.length > 0 ||
            ageGeneration.length > 0 || gender.length > 0 || ethnicity.length > 0 || lifestyle.trim());

        setIsDirty(hasChanges);
    }, [bigIdea, funnelLevel, aesthetic, type, intention, mood, visualMessaging, audioMessaging,
        audioStyle, ageGeneration, gender, ethnicity, lifestyle]);

    // Calculate matrix combinations whenever relevant fields change (Story 1.4, AC#1, AC#2)
    React.useEffect(() => {
        // Only calculate if all required dimensions have at least one selection
        // Optional: orientation, lifeStage (will be treated as "any" if empty)
        if (funnelLevel.length > 0 && aesthetic.length > 0 && type.length > 0 &&
            intention.length > 0 && mood.length > 0 && audioStyle.length > 0 &&
            ageGeneration.length > 0 && gender.length > 0 && ethnicity.length > 0) {

            const result = calculateMatrixCombinations(
                funnelLevel,
                aesthetic,
                type,
                intention,
                mood,
                audioStyle,
                ageGeneration,
                gender,
                orientation,
                lifeStage,
                ethnicity
            );
            setMatrixResult(result);
        } else {
            setMatrixResult(null);
        }
    }, [funnelLevel, aesthetic, type, intention, mood, audioStyle, ageGeneration, gender, orientation, lifeStage, ethnicity]);

    // Calculate batch cost whenever matrix result, exclusions, or model/duration changes (Story 1.5, AC#4 + Story 1.6, AC#4)
    React.useEffect(() => {
        if (matrixResult && matrixResult.totalCombinations > 0) {
            try {
                // Calculate active count by subtracting excluded combinations (Story 1.6, AC#4)
                const activeCount = matrixResult.totalCombinations - excludedCombinations.size;

                const cost = calculateBatchCost(
                    soraModel,
                    videoDuration,
                    activeCount
                );
                setCostResult(cost);
            } catch (error) {
                // Handle invalid model/duration combinations
                console.error('Cost calculation error:', error);
                setCostResult(null);
            }
        } else {
            setCostResult(null);
        }
    }, [matrixResult, soraModel, videoDuration, excludedCombinations]);

    // Clear exclusions when matrix changes (Story 1.6, Task 2)
    React.useEffect(() => {
        // Reset exclusions when a new matrix is calculated
        setExcludedCombinations(new Set());
        // Also reset to form screen when matrix changes
        setActiveScreen('form');
    }, [matrixResult]);

    // Toggle exclusion handler (Story 1.6, AC#3)
    const handleToggleExclusion = React.useCallback((combinationId: string) => {
        setExcludedCombinations((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(combinationId)) {
                newSet.delete(combinationId);
            } else {
                newSet.add(combinationId);
            }
            return newSet;
        });
    }, []);

    // Handle brand selection and load brand canon
    const handleBrandSelect = async (brandId: string) => {
        // Check for unsaved changes before switching brands
        if (isDirty && brand !== '' && brandId !== brand) {
            setPendingBrandSwitch(brandId);
            setShowUnsavedChangesDialog(true);
            return;
        }

        // No unsaved changes, proceed with brand switch
        await performBrandSwitch(brandId);
    };

    const performBrandSwitch = async (brandId: string, preserveFormData: boolean = false) => {
        setBrand(brandId);

        if (!brandId) {
            setCurrentBrandCanon(null);
            return;
        }

        // Query QDRANT for brand canon
        try {
            setLoadingBrandCanon(true);
            const brandCanon = await queryBrandCanon(brandId);

            if (brandCanon) {
                setCurrentBrandCanon(brandCanon);

                // Populate defaults from brand canon (Task 3)
                if (!preserveFormData) {
                    applyBrandDefaults(brandCanon);
                }
            } else {
                console.warn(`Brand canon not found for: ${brandId}`);
                setCurrentBrandCanon(null);
            }
        } catch (error) {
            console.error('Failed to load brand canon:', error);
            setCurrentBrandCanon(null);
        } finally {
            setLoadingBrandCanon(false);
        }
    };

    const applyBrandDefaults = (brandCanon: BrandCanon) => {
        // Apply defaults without overwriting existing user input (AC #3)
        // This sets sensible defaults based on brand canon but preserves any user changes

        // Parse visual style for aesthetic defaults
        const visualStyleLower = brandCanon.visual_style.toLowerCase();
        const newAesthetics: string[] = [];

        if (visualStyleLower.includes('animated') && visualStyleLower.includes('2d')) {
            newAesthetics.push('animated-2d');
        }
        if (visualStyleLower.includes('animated') && visualStyleLower.includes('3d')) {
            newAesthetics.push('animated-3d');
        }
        if (visualStyleLower.includes('professional')) {
            newAesthetics.push('professional');
        }
        if (visualStyleLower.includes('cinema')) {
            newAesthetics.push('cinema');
        }
        if (visualStyleLower.includes('ugc') || visualStyleLower.includes('user generated')) {
            newAesthetics.push('ugc');
        }

        // Only set aesthetic if user hasn't selected any yet
        if (aesthetic.length === 0 && newAesthetics.length > 0) {
            setAesthetic(newAesthetics);
        }

        // Note: Voice tone and ICP will be displayed as context/suggestions, not form population
        // Prohibited content will be shown as warnings (handled in render)
    };

    // Handle unsaved changes dialog actions
    const handleDiscardAndSwitch = async () => {
        setShowUnsavedChangesDialog(false);
        if (pendingBrandSwitch) {
            await performBrandSwitch(pendingBrandSwitch, false);
            setPendingBrandSwitch(null);
            setIsDirty(false);
        }
    };

    const handleCancelSwitch = () => {
        setShowUnsavedChangesDialog(false);
        setPendingBrandSwitch(null);
    };

    // Handle "Add New Brand" action
    const handleOpenAddBrand = () => {
        setShowBrandOnboarding(true);
    };

    // Handle brand created from onboarding modal
    const handleBrandCreated = async (newBrand: BrandCanon) => {
        setShowBrandOnboarding(false);

        // Auto-select newly created brand and load its canon
        await performBrandSwitch(newBrand.brand_id, false);

        // Note: BrandSelector will need to refresh its list
        // This will happen automatically on next mount, but for immediate update,
        // we could add a refresh mechanism to BrandSelector via ref
    };

    const toggleArrayValue = (arr: string[], value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!brand.trim()) newErrors.brand = 'Brand is required';
        if (!bigIdea.trim()) newErrors.bigIdea = 'Big Idea is required';
        if (funnelLevel.length === 0) newErrors.funnelLevel = 'Select at least one funnel level';
        if (aesthetic.length === 0) newErrors.aesthetic = 'Select at least one aesthetic';
        if (type.length === 0) newErrors.type = 'Select at least one type';
        if (intention.length === 0) newErrors.intention = 'Select at least one intention';
        if (mood.length === 0) newErrors.mood = 'Select at least one mood';
        if (!visualMessaging.trim()) newErrors.visualMessaging = 'Visual messaging is required';
        if (!audioMessaging.trim()) newErrors.audioMessaging = 'Audio messaging is required';
        if (audioStyle.length === 0) newErrors.audioStyle = 'Select Dialog and/or VO';
        if (ageGeneration.length === 0) newErrors.ageGeneration = 'Select at least one age/generation';
        if (gender.length === 0) newErrors.gender = 'Select at least one gender';
        if (ethnicity.length === 0) newErrors.ethnicity = 'Select at least one ethnicity';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData: DashboardFormData = {
            brand,
            productImage,
            bigIdea,
            funnelLevel,
            aesthetic,
            animationStyle: animationStyle.length > 0 ? animationStyle : undefined,
            type,
            intention,
            mood,
            visualMessaging,
            audioMessaging,
            audioStyle,
            heroVoDescription: heroVoDescription || undefined,
            matchDemographic: matchDemographic || undefined,
            hookVideo,
            ctaVideo,
            watermark,
            music,
            sfx,
            ost,
            soraModel,
            videoDuration,
            ageGeneration,
            gender,
            orientation,
            lifeStage,
            ethnicity,
            lifestyle
        };

        onSubmit(formData);
    };

    // Helper function to generate unique combination ID (Story 1.8, Task 2)
    const generateCombinationId = (combo: MatrixResult['combinations'][0]) => {
        return `${combo.funnelLevel}-${combo.aesthetic}-${combo.type}-${combo.intention}-${combo.mood}-${combo.audioStyle}-${combo.ageGeneration}-${combo.gender}-${combo.orientation}-${combo.lifeStage}-${combo.ethnicity}`;
    };

    // Batch submission handler (Story 1.7, AC#4; Story 1.8, Task 2)
    const handleBatchSubmit = async () => {
        if (!matrixResult || !costResult) {
            console.error('Cannot submit batch: missing matrix or cost data');
            return;
        }

        // Generate unique batch ID (Story 1.7, AC#4)
        const batchId = `BATCH_${uuidv4()}`;

        // Calculate active combinations
        const activeCount = matrixResult.totalCombinations - excludedCombinations.size;

        // Collect excluded combination IDs
        const excludedIds = Array.from(excludedCombinations);

        // Prepare batch data with metadata
        const batchData: DashboardFormData = {
            brand,
            productImage,
            bigIdea,
            funnelLevel,
            aesthetic,
            animationStyle: animationStyle.length > 0 ? animationStyle : undefined,
            type,
            intention,
            mood,
            visualMessaging,
            audioMessaging,
            audioStyle,
            heroVoDescription: heroVoDescription || undefined,
            matchDemographic: matchDemographic || undefined,
            hookVideo,
            ctaVideo,
            watermark,
            music,
            sfx,
            ost,
            soraModel,
            videoDuration,
            ageGeneration,
            gender,
            orientation,
            lifeStage,
            ethnicity,
            lifestyle,
            // Batch metadata (Story 1.7)
            batchId,
            submittedAt: new Date().toISOString(),
            activeCombinations: activeCount,
            excludedCombinationIds: excludedIds,
            brandCanon: currentBrandCanon,
            costEstimate: costResult
        };

        try {
            // Close modal
            setShowConfirmationModal(false);

            // Epic 2: Pass form data, matrix, and exclusions to API for video generation
            // The API endpoint will handle campaign creation, Notion records, and queuing
            const apiPayload = {
                formData: batchData,
                matrixResult,
                excludedCombinations: Array.from(excludedCombinations),
                batchId
            };

            // Submit batch (triggers Epic 2 workflows)
            onSubmit(batchData, apiPayload);

            // Calculate estimated completion time (Story 1.7, AC#5)
            // Concurrent generation: 4 videos at a time, ~4 minutes per batch
            const estimatedMinutes = Math.ceil(activeCount / 4) * 4;

            // Show success message (Story 1.7, AC#5)
            setSuccessMessage({
                batchId,
                estimatedMinutes,
                videoCount: activeCount
            });
        } catch (error) {
            console.error('Batch submission failed:', error);
            // TODO: Display user-friendly error message
        }
    };

    // AI Recommendations handler (Story 1.8, Task 7, AC#2, AC#6)
    const handleViewAIRecommendations = async () => {
        if (!brand) {
            console.warn('Cannot load AI recommendations: no brand selected');
            return;
        }

        setLoadingRecommendations(true);
        try {
            // Generate AI recommendations based on campaign history
            const recommendations = await aiRecommendations.generateRecommendations(
                brand,
                'general' // Product category - could be added to form later
            );

            setAIRecommendationData(recommendations);
            setShowAIRecommendations(true);
        } catch (error) {
            console.error('Failed to load AI recommendations:', error);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    // Winning Formula handler (Story 1.8, Task 7, AC#5)
    const handleViewWinningFormula = async () => {
        if (!brand) {
            console.warn('Cannot load analytics: no brand selected');
            return;
        }

        setLoadingAnalytics(true);
        try {
            // Load brand analytics from campaign history
            const analytics = await performanceAnalytics.getBrandAnalytics(brand);

            setWinningFormulaData(analytics);
            setShowWinningFormula(true);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const isFormValid =
        brand.trim() &&
        bigIdea.trim() &&
        funnelLevel.length > 0 &&
        aesthetic.length > 0 &&
        type.length > 0 &&
        intention.length > 0 &&
        mood.length > 0 &&
        visualMessaging.trim() &&
        audioMessaging.trim() &&
        audioStyle.length > 0 &&
        ageGeneration.length > 0 &&
        gender.length > 0 &&
        ethnicity.length > 0;

    return (
        <TooltipProvider>
            <Card className='flex h-full w-full flex-col overflow-hidden rounded-lg border border-[rgba(245,245,220,0.1)] bg-[#1a1a1a]'>
                <CardHeader className='border-b border-[rgba(245,245,220,0.1)] pb-4'>
                    <CardTitle className='text-2xl font-bold text-[#f5f5f5]'>SORA 2 VIDEO GENERATOR</CardTitle>
                    <CardDescription className='text-[#f5f5f5]/60'>Configure batch video generation parameters</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit} className='flex h-full flex-1 flex-col overflow-hidden'>
                    <CardContent className='flex-1 space-y-6 overflow-y-auto p-4'>
                        {/* PROJECT SETUP */}
                        <div className='space-y-4 rounded-lg border border-[rgba(245,245,220,0.1)] bg-[#1a1a1a]/40 p-4'>
                            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#f5f5f5]'>Project Setup</h3>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label htmlFor='brand' className='text-[#f5f5f5]'>
                                        Brand <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Select brand from QDRANT. Brand canon loads automatically with voice, visual style, and ICP context.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Lightbulb className='h-4 w-4 text-[#E2725B]' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Choose "Demo Brand" for generic defaults or select a configured brand. Click "+ Add New Brand..." to onboard a new client.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <BrandSelector
                                    value={brand}
                                    onChange={handleBrandSelect}
                                    onOpenAddBrand={handleOpenAddBrand}
                                    disabled={isLoading || loadingBrandCanon}
                                />
                                {errors.brand && <p className='text-xs text-[#B7410E]'>{errors.brand}</p>}
                                {loadingBrandCanon && (
                                    <p className='text-xs text-[#3b82f6] flex items-center gap-2'>
                                        <Loader2 className='h-3 w-3 animate-spin' />
                                        Loading brand canon...
                                    </p>
                                )}
                                {currentBrandCanon && (
                                    <div className='space-y-2 rounded border border-[rgba(245,245,220,0.1)] bg-[#1a1a1a]/20 p-3 text-xs'>
                                        <div>
                                            <p className='font-semibold text-[#f5f5f5]/80'>Brand Voice:</p>
                                            <p className='text-[#f5f5f5]/60'>{currentBrandCanon.voice.substring(0, 150)}...</p>
                                        </div>
                                        {currentBrandCanon.prohibited_content && currentBrandCanon.prohibited_content.length > 0 && (
                                            <div>
                                                <p className='font-semibold text-[#E2725B]'>Content Restrictions:</p>
                                                <ul className='list-disc list-inside text-[#E2725B]/80'>
                                                    {currentBrandCanon.prohibited_content.slice(0, 3).map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* AI Recommendations & Winning Formula Buttons (Story 1.8, Task 7) */}
                                {brand && currentBrandCanon && (
                                    <div className='flex gap-2 mt-3'>
                                        <Button
                                            type='button'
                                            variant='outline'
                                            size='sm'
                                            onClick={handleViewAIRecommendations}
                                            disabled={loadingRecommendations}
                                            className='flex-1 border-[#5F9EA0] text-[#5F9EA0] hover:bg-[#5F9EA0]/10'
                                        >
                                            {loadingRecommendations ? (
                                                <>
                                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className='mr-2 h-4 w-4' />
                                                    AI Recommendations
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type='button'
                                            variant='outline'
                                            size='sm'
                                            onClick={handleViewWinningFormula}
                                            disabled={loadingAnalytics}
                                            className='flex-1 border-[#5F9EA0] text-[#5F9EA0] hover:bg-[#5F9EA0]/10'
                                        >
                                            {loadingAnalytics ? (
                                                <>
                                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    <Info className='mr-2 h-4 w-4' />
                                                    Winning Formula
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label htmlFor='productImage' className='text-[#f5f5f5]'>
                                        Product Image 720p
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Upload a 720p product image (.jpg format)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id='productImage'
                                    type='file'
                                    accept='.jpg,.jpeg'
                                    onChange={(e) => setProductImage(e.target.files?.[0] || null)}
                                    disabled={isLoading}
                                    className='rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[#f5f5f5]'
                                />
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label htmlFor='bigIdea' className='text-[#f5f5f5]'>
                                        Big Idea <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Core campaign concept for this batch</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Lightbulb className='h-4 w-4 text-[#E2725B]' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Example: "New pre-workout powder with natural energy boost"</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Textarea
                                    id='bigIdea'
                                    placeholder='Describe your core campaign idea...'
                                    value={bigIdea}
                                    onChange={(e) => setBigIdea(e.target.value)}
                                    disabled={isLoading}
                                    className='min-h-[100px] rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] placeholder:text-[#f5f5f5]/40'
                                />
                                {errors.bigIdea && <p className='text-xs text-[#B7410E]'>{errors.bigIdea}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Funnel Level <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Select where your audience is in the awareness journey</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    {FUNNEL_LEVELS.map((level) => (
                                        <div key={level.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`funnel-${level.value}`}
                                                checked={funnelLevel.includes(level.value)}
                                                onCheckedChange={() => toggleArrayValue(funnelLevel, level.value, setFunnelLevel)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`funnel-${level.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {level.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.funnelLevel && <p className='text-xs text-[#B7410E]'>{errors.funnelLevel}</p>}
                            </div>
                        </div>

                        {/* CREATIVE DIRECTION */}
                        <div className='space-y-4 rounded-lg border border-[rgba(245,245,220,0.1)] bg-[#1a1a1a]/40 p-4'>
                            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#f5f5f5]'>Creative Direction</h3>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Aesthetic <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Visual style for the video. Animation options appear if Animated-2D or 3D selected.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    {AESTHETICS.map((aes) => (
                                        <div key={aes.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`aes-${aes.value}`}
                                                checked={aesthetic.includes(aes.value)}
                                                onCheckedChange={() => toggleArrayValue(aesthetic, aes.value, setAesthetic)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`aes-${aes.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {aes.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.aesthetic && <p className='text-xs text-[#B7410E]'>{errors.aesthetic}</p>}
                            </div>

                            {showAnimationStyles && (
                                <div className='space-y-1.5 border-l-2 border-earth-teal/50 pl-4'>
                                    <Label className='text-[#f5f5f5]'>Animation Style (--sref codes)</Label>
                                    <div className='space-y-2'>
                                        {ANIMATION_STYLES.map((style) => (
                                            <div key={style.value} className='flex items-start space-x-2'>
                                                <Checkbox
                                                    id={`anim-${style.value}`}
                                                    checked={animationStyle.includes(style.value)}
                                                    onCheckedChange={() => toggleArrayValue(animationStyle, style.value, setAnimationStyle)}
                                                    disabled={isLoading}
                                                    className='mt-0.5 border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                                />
                                                <Label htmlFor={`anim-${style.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                    <div>{style.label}</div>
                                                    <div className='text-xs text-[#f5f5f5]/50'>{style.desc}</div>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Type <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Video format type</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    {VIDEO_TYPES.map((vt) => (
                                        <div key={vt.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`type-${vt.value}`}
                                                checked={type.includes(vt.value)}
                                                onCheckedChange={() => toggleArrayValue(type, vt.value, setType)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`type-${vt.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {vt.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.type && <p className='text-xs text-[#B7410E]'>{errors.type}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Intention <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>What should this video accomplish?</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    {INTENTIONS.map((int) => (
                                        <div key={int.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`int-${int.value}`}
                                                checked={intention.includes(int.value)}
                                                onCheckedChange={() => toggleArrayValue(intention, int.value, setIntention)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`int-${int.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {int.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.intention && <p className='text-xs text-[#B7410E]'>{errors.intention}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Mood <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Emotional tone of the video</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className='grid grid-cols-3 gap-3'>
                                    {MOODS.map((m) => (
                                        <div key={m.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`mood-${m.value}`}
                                                checked={mood.includes(m.value)}
                                                onCheckedChange={() => toggleArrayValue(mood, m.value, setMood)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`mood-${m.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {m.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.mood && <p className='text-xs text-[#B7410E]'>{errors.mood}</p>}
                            </div>
                        </div>

                        {/* VISUAL & AUDIO MESSAGING */}
                        <div className='space-y-4 rounded-lg border border-[rgba(245,245,220,0.1)] bg-[#1a1a1a]/40 p-4'>
                            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#f5f5f5]'>Visual & Audio Messaging</h3>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label htmlFor='visualMessaging' className='text-[#f5f5f5]'>
                                        Visual Messaging <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Describe what viewers will see on screen</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Textarea
                                    id='visualMessaging'
                                    placeholder='Describe the visual elements and scenes...'
                                    value={visualMessaging}
                                    onChange={(e) => setVisualMessaging(e.target.value)}
                                    disabled={isLoading}
                                    className='min-h-[100px] rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] placeholder:text-[#f5f5f5]/40'
                                />
                                {errors.visualMessaging && <p className='text-xs text-[#B7410E]'>{errors.visualMessaging}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label htmlFor='audioMessaging' className='text-[#f5f5f5]'>
                                        Audio Messaging <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Script, dialog, or narration. If Dialog selected, include character assignments.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Textarea
                                    id='audioMessaging'
                                    placeholder='Write the script, dialog, or narration...'
                                    value={audioMessaging}
                                    onChange={(e) => setAudioMessaging(e.target.value)}
                                    disabled={isLoading}
                                    className='min-h-[100px] rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] placeholder:text-[#f5f5f5]/40'
                                />
                                {errors.audioMessaging && <p className='text-xs text-[#B7410E]'>{errors.audioMessaging}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Audio Style <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className='h-4 w-4 text-[#f5f5f5]/40' />
                                        </TooltipTrigger>
                                        <TooltipContent className='max-w-xs bg-[#1a1a1a]/90 text-[#f5f5f5]'>
                                            <p>Select Dialog and/or VO (voiceover)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className='flex gap-4'>
                                    <div className='flex items-center space-x-2'>
                                        <Checkbox
                                            id='audio-dialog'
                                            checked={audioStyle.includes('dialog')}
                                            onCheckedChange={() => toggleArrayValue(audioStyle, 'dialog', setAudioStyle)}
                                            disabled={isLoading}
                                            className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                        />
                                        <Label htmlFor='audio-dialog' className='cursor-pointer text-[#f5f5f5]/80'>
                                            Dialog
                                        </Label>
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                        <Checkbox
                                            id='audio-vo'
                                            checked={audioStyle.includes('vo')}
                                            onCheckedChange={() => toggleArrayValue(audioStyle, 'vo', setAudioStyle)}
                                            disabled={isLoading}
                                            className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                        />
                                        <Label htmlFor='audio-vo' className='cursor-pointer text-[#f5f5f5]/80'>
                                            VO
                                        </Label>
                                    </div>
                                </div>
                                {errors.audioStyle && <p className='text-xs text-[#B7410E]'>{errors.audioStyle}</p>}
                                {audioStyle.includes('dialog') && (
                                    <p className='text-xs text-[#3b82f6]'>Reference Audio Messaging field above for dialog and character assignments</p>
                                )}
                            </div>

                            {showHeroVo && (
                                <div className='space-y-2 border-l-2 border-[rgba(199,91,57,0.5)] pl-4'>
                                    <Label htmlFor='heroVoDescription' className='text-[#f5f5f5]'>
                                        Hero VO Description
                                    </Label>
                                    <div className='flex items-center space-x-2'>
                                        <Checkbox
                                            id='matchDemo'
                                            checked={matchDemographic}
                                            onCheckedChange={(checked) => setMatchDemographic(checked === true)}
                                            disabled={isLoading}
                                            className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-white data-[state=checked]:text-[#4A3728]'
                                        />
                                        <Label htmlFor='matchDemo' className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                            Match Demographic (AI chooses appropriate VO)
                                        </Label>
                                    </div>
                                    <Textarea
                                        id='heroVoDescription'
                                        placeholder='Custom VO description...'
                                        value={heroVoDescription}
                                        onChange={(e) => setHeroVoDescription(e.target.value)}
                                        disabled={isLoading}
                                        className='min-h-[80px] rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] placeholder:text-[#f5f5f5]/40'
                                    />
                                </div>
                            )}
                        </div>

                        {/* POST-PRODUCTION ASSETS */}
                        <div className='space-y-4 rounded-lg border border-[rgba(245,245,220,0.1)] bg-[#1a1a1a]/40 p-4'>
                            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#f5f5f5]'>Post-Production Assets</h3>

                            <div className='space-y-1.5'>
                                <Label htmlFor='hookVideo' className='text-[#f5f5f5]'>
                                    Hook Video (.mp4)
                                </Label>
                                <Input
                                    id='hookVideo'
                                    type='file'
                                    accept='.mp4'
                                    onChange={(e) => setHookVideo(e.target.files?.[0] || null)}
                                    disabled={isLoading}
                                    className='rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[#f5f5f5]'
                                />
                            </div>

                            <div className='space-y-1.5'>
                                <Label htmlFor='ctaVideo' className='text-[#f5f5f5]'>
                                    CTA Video (.mp4)
                                </Label>
                                <Input
                                    id='ctaVideo'
                                    type='file'
                                    accept='.mp4'
                                    onChange={(e) => setCtaVideo(e.target.files?.[0] || null)}
                                    disabled={isLoading}
                                    className='rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[#f5f5f5]'
                                />
                            </div>

                            <div className='space-y-1.5'>
                                <Label htmlFor='watermark' className='text-[#f5f5f5]'>
                                    Watermark (.png 720p)
                                </Label>
                                <Input
                                    id='watermark'
                                    type='file'
                                    accept='.png'
                                    onChange={(e) => setWatermark(e.target.files?.[0] || null)}
                                    disabled={isLoading}
                                    className='rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[#f5f5f5]'
                                />
                            </div>
                        </div>

                        {/* GENERATION SETTINGS */}
                        <div className='space-y-4 rounded-lg border border-[rgba(95,158,160,0.3)] bg-[#3b82f6]/10 p-4'>
                            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#3b82f6]'>Generation Settings</h3>

                            <div className='flex gap-6'>
                                <div className='flex items-center space-x-2'>
                                    <Checkbox
                                        id='music'
                                        checked={music}
                                        onCheckedChange={(checked) => setMusic(checked === true)}
                                        disabled={isLoading}
                                        className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                    />
                                    <Label htmlFor='music' className='cursor-pointer text-[#f5f5f5]/80'>
                                        Music
                                    </Label>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <Checkbox
                                        id='sfx'
                                        checked={sfx}
                                        onCheckedChange={(checked) => setSfx(checked === true)}
                                        disabled={isLoading}
                                        className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                    />
                                    <Label htmlFor='sfx' className='cursor-pointer text-[#f5f5f5]/80'>
                                        SFX
                                    </Label>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <Checkbox
                                        id='ost'
                                        checked={ost}
                                        onCheckedChange={(checked) => setOst(checked === true)}
                                        disabled={isLoading}
                                        className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                    />
                                    <Label htmlFor='ost' className='cursor-pointer text-[#f5f5f5]/80'>
                                        OST
                                    </Label>
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-[#f5f5f5]'>Model</Label>
                                <RadioGroup
                                    value={soraModel}
                                    onValueChange={(value) => setSoraModel(value as 'sora-2' | 'sora-2-pro')}
                                    disabled={isLoading}
                                    className='flex gap-4'>
                                    <div className='flex items-center space-x-2'>
                                        <RadioGroupItem value='sora-2' id='model-sora-2' className='border-[rgba(245,245,220,0.4)] text-[#3b82f6]' />
                                        <Label htmlFor='model-sora-2' className='cursor-pointer text-[#f5f5f5]/80'>
                                            Sora 2
                                        </Label>
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                        <RadioGroupItem value='sora-2-pro' id='model-sora-2-pro' className='border-[rgba(245,245,220,0.4)] text-[#3b82f6]' />
                                        <Label htmlFor='model-sora-2-pro' className='cursor-pointer text-[#f5f5f5]/80'>
                                            Sora 2 Pro
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='duration' className='text-[#f5f5f5]'>
                                    Length (dynamically updates based on Model)
                                </Label>
                                <Select value={videoDuration.toString()} onValueChange={(value) => setVideoDuration(parseInt(value) as any)} disabled={isLoading}>
                                    <SelectTrigger id='duration' className='rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5]'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className='border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5]'>
                                        {durationOptions.map((dur) => (
                                            <SelectItem key={dur} value={dur.toString()} className='focus:bg-[#3b82f6]/20 focus:text-[#f5f5f5]'>
                                                {dur} seconds
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className='text-xs text-[#3b82f6]/60'>
                                    Both models: 5, 10, or 20 seconds
                                </p>
                            </div>
                        </div>

                        {/* DEMOGRAPHICS */}
                        <div className='space-y-4 rounded-lg border border-[rgba(156,175,136,0.3)] bg-[#3b82f6]/10 p-4'>
                            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#3b82f6]'>Demographics</h3>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Age/Generation <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                </div>
                                <div className='grid grid-cols-3 gap-3'>
                                    {AGE_GENERATIONS.map((age) => (
                                        <div key={age.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`age-${age.value}`}
                                                checked={ageGeneration.includes(age.value)}
                                                onCheckedChange={() => toggleArrayValue(ageGeneration, age.value, setAgeGeneration)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`age-${age.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {age.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.ageGeneration && <p className='text-xs text-[#B7410E]'>{errors.ageGeneration}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Gender <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                </div>
                                <div className='grid grid-cols-3 gap-3'>
                                    {GENDERS.map((g) => (
                                        <div key={g.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`gender-${g.value}`}
                                                checked={gender.includes(g.value)}
                                                onCheckedChange={() => toggleArrayValue(gender, g.value, setGender)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`gender-${g.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {g.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.gender && <p className='text-xs text-[#B7410E]'>{errors.gender}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <Label className='text-[#f5f5f5]'>Orientation</Label>
                                <div className='grid grid-cols-2 gap-3'>
                                    {ORIENTATIONS.map((o) => (
                                        <div key={o.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`orient-${o.value}`}
                                                checked={orientation.includes(o.value)}
                                                onCheckedChange={() => toggleArrayValue(orientation, o.value, setOrientation)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`orient-${o.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {o.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className='space-y-1.5'>
                                <Label className='text-[#f5f5f5]'>Life Stage</Label>
                                <div className='grid grid-cols-2 gap-3'>
                                    {LIFE_STAGES.map((ls) => (
                                        <div key={ls.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`life-${ls.value}`}
                                                checked={lifeStage.includes(ls.value)}
                                                onCheckedChange={() => toggleArrayValue(lifeStage, ls.value, setLifeStage)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`life-${ls.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {ls.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Label className='text-[#f5f5f5]'>
                                        Ethnicity <span className='text-[#B7410E]'>*</span>
                                    </Label>
                                </div>
                                <div className='grid grid-cols-3 gap-3'>
                                    {ETHNICITIES.map((eth) => (
                                        <div key={eth.value} className='flex items-center space-x-2'>
                                            <Checkbox
                                                id={`eth-${eth.value}`}
                                                checked={ethnicity.includes(eth.value)}
                                                onCheckedChange={() => toggleArrayValue(ethnicity, eth.value, setEthnicity)}
                                                disabled={isLoading}
                                                className='border-[rgba(245,245,220,0.4)] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-[#4A3728]'
                                            />
                                            <Label htmlFor={`eth-${eth.value}`} className='cursor-pointer text-sm text-[#f5f5f5]/80'>
                                                {eth.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.ethnicity && <p className='text-xs text-[#B7410E]'>{errors.ethnicity}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <Label htmlFor='lifestyle' className='text-[#f5f5f5]'>
                                    Lifestyle
                                </Label>
                                <Textarea
                                    id='lifestyle'
                                    placeholder='Describe lifestyle characteristics...'
                                    value={lifestyle}
                                    onChange={(e) => setLifestyle(e.target.value)}
                                    disabled={isLoading}
                                    className='min-h-[80px] rounded-md border border-[rgba(245,245,220,0.2)] bg-[#1a1a1a] text-[#f5f5f5] placeholder:text-[#f5f5f5]/40'
                                />
                            </div>
                        </div>

                        {/* SCREEN 1: FORM VIEW WITH MATRIX PREVIEW (Story 1.6, AC#5) */}
                        {activeScreen === 'form' && (
                            <>
                                {/* MATRIX PREVIEW (Story 1.4, AC#2) */}
                                <MatrixPreview result={matrixResult} isLoading={false} />

                                {/* COST SUMMARY (Story 1.5, AC#2) */}
                                {costResult && (
                                    <div className='space-y-4'>
                                        <CostSummary costResult={costResult} isLoading={false} />
                                        <CostBreakdown costResult={costResult} />
                                    </div>
                                )}

                                {/* PROCEED TO PREVIEW BUTTON (Story 1.6, AC#1) */}
                                {matrixResult && matrixResult.totalCombinations > 0 && (
                                    <div className='flex justify-end'>
                                        <Button
                                            type='button'
                                            onClick={() => setActiveScreen('preview')}
                                            className='bg-[#5F9EA0] text-[#f5f5f5] hover:bg-[#5F9EA0]/90'
                                        >
                                            Proceed to Matrix Preview
                                            <ArrowRight className='ml-2 h-4 w-4' />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* SCREEN 2: MATRIX PREVIEW TABLE (Story 1.6, AC#1, AC#2, AC#3) */}
                        {activeScreen === 'preview' && matrixResult && (
                            <div className='space-y-4'>
                                {/* BACK TO EDIT BUTTON (Story 1.6, AC#5) */}
                                <div className='flex items-center justify-between'>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={() => setActiveScreen('form')}
                                        className='border-[rgba(245,245,220,0.2)] text-[#f5f5f5] hover:bg-white/10'
                                    >
                                        <ArrowLeft className='mr-2 h-4 w-4' />
                                        Back to Edit
                                    </Button>
                                    <div className='text-sm text-[#f5f5f5]/60'>
                                        Screen 2: Matrix Preview
                                    </div>
                                </div>

                                {/* MATRIX PREVIEW TABLE WITH EXCLUSION (Story 1.6, AC#1, AC#2, AC#3) */}
                                <MatrixPreviewTable
                                    matrixResult={matrixResult}
                                    excludedCombinations={excludedCombinations}
                                    onToggleExclusion={handleToggleExclusion}
                                />

                                {/* COST SUMMARY WITH FILTERED COUNT (Story 1.6, AC#4) */}
                                {costResult && (
                                    <div className='space-y-4'>
                                        <CostSummary costResult={costResult} isLoading={false} />
                                        <CostBreakdown costResult={costResult} />
                                    </div>
                                )}

                                {/* APPROVE & GENERATE BUTTON (Story 1.7, AC#1, AC#2) */}
                                {(() => {
                                    // Calculate active combinations (Story 1.7, AC#2)
                                    const activeCount = matrixResult
                                        ? matrixResult.totalCombinations - excludedCombinations.size
                                        : 0;

                                    // Validation logic (Story 1.7, AC#2)
                                    const isApprovalEnabled =
                                        activeCount > 0 &&
                                        brand !== '' &&
                                        currentBrandCanon !== null;

                                    // Determine tooltip message
                                    let tooltipMessage = '';
                                    if (activeCount === 0) {
                                        tooltipMessage = 'No videos selected. Return to Edit to adjust matrix or uncheck excluded combinations.';
                                    } else if (brand === '') {
                                        tooltipMessage = 'Brand required. Return to Edit and select a brand from the dropdown.';
                                    } else if (currentBrandCanon === null) {
                                        tooltipMessage = 'Brand data loading. Please wait or refresh the page.';
                                    }

                                    return (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className='w-full'>
                                                        <Button
                                                            type='button'
                                                            size='lg'
                                                            disabled={!isApprovalEnabled}
                                                            onClick={() => setShowConfirmationModal(true)}
                                                            className='w-full mt-6 bg-[#5F9EA0] hover:bg-[#5F9EA0]/90 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                                        >
                                                            {costResult
                                                                ? `Approve & Generate - $${costResult.totalBatchCost.toFixed(2)}`
                                                                : 'Approve & Generate'
                                                            }
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                {!isApprovalEnabled && (
                                                    <TooltipContent className='bg-[#1a1a1a] border-[rgba(245,245,220,0.2)] text-[#f5f5f5]'>
                                                        <p>{tooltipMessage}</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })()}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className='flex gap-3 border-t border-[rgba(245,245,220,0.1)] p-4'>
                        <Button type='button' variant='outline' className='border-[rgba(245,245,220,0.2)] text-[#f5f5f5] hover:bg-white/10'>
                            Load Template
                        </Button>
                        <Button type='button' variant='outline' className='border-[rgba(245,245,220,0.2)] text-[#f5f5f5] hover:bg-white/10'>
                            Save as Template
                        </Button>
                        <Button
                            type='submit'
                            disabled={isLoading || !isFormValid}
                            className='flex-1 bg-white text-[#4A3728] hover:bg-white/90 disabled:bg-white/40'>
                            {isLoading ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Generate Matrix Preview
                                    <ArrowRight className='ml-2 h-4 w-4' />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Unsaved Changes Confirmation Dialog (AC #4) */}
            <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
                <DialogContent className="bg-[#1a1a1a] border-[rgba(245,245,220,0.2)] text-[#f5f5f5]">
                    <DialogHeader>
                        <DialogTitle className="text-[#f5f5f5]">Unsaved Changes</DialogTitle>
                        <DialogDescription className="text-[#f5f5f5]/70">
                            You have unsaved changes. Switching brands will reset the form. Are you sure you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelSwitch}
                            className="border-[rgba(245,245,220,0.2)] text-[#f5f5f5] hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDiscardAndSwitch}
                            className="bg-red-500 text-[#f5f5f5] hover:bg-red-600"
                        >
                            Discard and Switch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Batch Confirmation Modal (Story 1.7, AC#3) */}
            <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
                <DialogContent className='bg-[#1a1a1a] border-[rgba(245,245,220,0.2)] text-[#f5f5f5]'>
                    <DialogHeader>
                        <DialogTitle className='text-[#f5f5f5]'>Confirm Batch Generation</DialogTitle>
                        <DialogDescription className='text-[#f5f5f5]/70'>
                            {matrixResult && costResult && (
                                <>
                                    You will be charged ${costResult.totalBatchCost.toFixed(2)} for{' '}
                                    {matrixResult.totalCombinations - excludedCombinations.size} videos.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {costResult && (
                        <div className='space-y-4'>
                            {/* Cost Breakdown */}
                            <div>
                                <h4 className='font-semibold mb-2 text-[#f5f5f5]'>Cost Breakdown:</h4>
                                <ul className='space-y-1 text-sm text-[#f5f5f5]/80'>
                                    <li>• Sora 2 API: ${costResult.soraApiSubtotal.toFixed(2)}</li>
                                    <li>• LLM Costs: ${costResult.llmSubtotal.toFixed(2)}</li>
                                    <li>• Storage: ${costResult.storageSubtotal.toFixed(2)}</li>
                                </ul>
                            </div>

                            {/* Configuration Details */}
                            <div className='text-sm text-[#f5f5f5]/60'>
                                <p>Brand: {currentBrandCanon?.brand_name || brand}</p>
                                <p>Model: {soraModel}, Duration: {videoDuration} seconds</p>
                            </div>

                            <p className='text-sm text-[#f5f5f5]/70'>
                                Proceed with generation?
                            </p>
                        </div>
                    )}

                    <DialogFooter className='gap-2'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => setShowConfirmationModal(false)}
                            className='border-[rgba(245,245,220,0.2)] text-[#f5f5f5] hover:bg-white/10'
                        >
                            Cancel
                        </Button>
                        <Button
                            type='button'
                            onClick={handleBatchSubmit}
                            className='bg-[#5F9EA0] hover:bg-[#5F9EA0]/90 text-white'
                        >
                            Confirm & Generate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Message (Story 1.7, AC#5) */}
            {successMessage && (
                <Alert className='mt-4 bg-[#1a1a1a] border-[#5F9EA0] text-[#f5f5f5]'>
                    <CheckCircle className='h-4 w-4 text-[#5F9EA0]' />
                    <AlertTitle className='text-[#f5f5f5] font-semibold'>Batch Initiated Successfully</AlertTitle>
                    <AlertDescription>
                        <div className='space-y-1 mt-2 text-[#f5f5f5]/80'>
                            <p><strong>Batch ID:</strong> {successMessage.batchId}</p>
                            <p><strong>Videos:</strong> {successMessage.videoCount}</p>
                            <p><strong>Estimated completion:</strong> {successMessage.estimatedMinutes} minutes</p>
                            <p className='mt-3 text-sm text-[#f5f5f5]/60'>
                                Track progress in your Notion dashboard
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* AI Recommendations Dialog (Story 1.8, Task 7, AC#2, AC#6) */}
            <Dialog open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
                <DialogContent className='bg-[#1a1a1a] border-[rgba(245,245,220,0.2)] text-[#f5f5f5] max-w-4xl max-h-[80vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle className='flex items-center gap-2 text-[#f5f5f5]'>
                            <Sparkles className='h-5 w-5 text-[#5F9EA0]' />
                            AI Recommendations for {brand}
                        </DialogTitle>
                        <DialogDescription className='text-[#f5f5f5]/70'>
                            Intelligent recommendations based on campaign history and trend research
                        </DialogDescription>
                    </DialogHeader>

                    {aiRecommendationData && (
                        <div className='space-y-6'>
                            {/* Data Status */}
                            <Alert className={aiRecommendationData.hasSufficientData ? 'border-[#5F9EA0] bg-[#5F9EA0]/10' : 'border-[#B7410E] bg-[#B7410E]/10'}>
                                <Info className='h-4 w-4' />
                                <AlertDescription className='text-[#f5f5f5]'>
                                    {aiRecommendationData.hasSufficientData ? (
                                        <>Based on {aiRecommendationData.totalCampaigns} campaigns ({aiRecommendationData.totalCombinationsTested} videos tested)</>
                                    ) : (
                                        <>Not enough data for recommendations. Complete at least 3 campaigns with metrics to see AI insights.</>
                                    )}
                                </AlertDescription>
                            </Alert>

                            {/* Trend Insight */}
                            {aiRecommendationData.trendInsight && (
                                <Alert className='border-[#5F9EA0]/30 bg-[#1a1a1a]'>
                                    <Lightbulb className='h-4 w-4 text-[#5F9EA0]' />
                                    <AlertDescription className='text-[#f5f5f5]'>
                                        {aiRecommendationData.trendInsight}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Untested Combinations */}
                            {aiRecommendationData.untestedCombinations.length > 0 && (
                                <div>
                                    <h4 className='font-semibold text-[#f5f5f5] mb-3'>Recommended Untested Combinations:</h4>
                                    <div className='space-y-3'>
                                        {aiRecommendationData.untestedCombinations.map((rec, idx) => (
                                            <div key={idx} className='rounded-lg border border-[rgba(245,245,220,0.1)] bg-[#1a1a1a]/40 p-3'>
                                                <div className='flex items-center justify-between mb-2'>
                                                    <span className='text-[#5F9EA0] font-semibold'>Combination #{idx + 1}</span>
                                                    <span className='text-sm text-[#f5f5f5]/60'>Confidence: {rec.score}%</span>
                                                </div>
                                                <div className='text-sm text-[#f5f5f5]/80'>
                                                    <p><strong>Funnel:</strong> {rec.combination.funnelLevel}</p>
                                                    <p><strong>Aesthetic:</strong> {rec.combination.aesthetic}</p>
                                                    <p><strong>Type:</strong> {rec.combination.type}</p>
                                                    <p className='mt-2 text-[#f5f5f5]/60'>{rec.reason}</p>
                                                    {rec.trendInsight && <p className='mt-1 text-[#5F9EA0] text-xs'>{rec.trendInsight}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => setShowAIRecommendations(false)}
                            className='border-[rgba(245,245,220,0.2)] text-[#f5f5f5] hover:bg-white/10'
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Winning Formula Dialog (Story 1.8, Task 7, AC#5) */}
            <Dialog open={showWinningFormula} onOpenChange={setShowWinningFormula}>
                <DialogContent className='bg-[#1a1a1a] border-[rgba(245,245,220,0.2)] text-[#f5f5f5] max-w-6xl max-h-[80vh] overflow-y-auto'>
                    {winningFormulaData && (
                        <WinningFormulaInsights
                            brandId={brand}
                            analytics={winningFormulaData}
                            onClose={() => setShowWinningFormula(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Brand Onboarding Modal (AC #5) */}
            <BrandOnboardingModal
                isOpen={showBrandOnboarding}
                onClose={() => setShowBrandOnboarding(false)}
                onBrandCreated={handleBrandCreated}
            />
        </TooltipProvider>
    );
}
