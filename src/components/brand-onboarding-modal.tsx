'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Plus, Trash2 } from 'lucide-react';
import { upsertBrandCanon } from '@/lib/qdrant-client';
import type { BrandCanon } from '@/types/brand-canon';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export type BrandOnboardingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBrandCreated?: (brand: BrandCanon) => void;
};

export function BrandOnboardingModal({
  isOpen,
  onClose,
  onBrandCreated
}: BrandOnboardingModalProps) {
  const [brandId, setBrandId] = React.useState('');
  const [brandName, setBrandName] = React.useState('');
  const [voice, setVoice] = React.useState('');
  const [visualStyle, setVisualStyle] = React.useState('');
  const [icpProfile, setIcpProfile] = React.useState('');
  const [successfulPrompts, setSuccessfulPrompts] = React.useState<string[]>(['']);
  const [prohibitedContent, setProhibitedContent] = React.useState<string[]>(['']);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Auto-generate brand_id from brand_name
  React.useEffect(() => {
    if (brandName) {
      const slug = brandName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setBrandId(slug);
    }
  }, [brandName]);

  const addPromptField = () => {
    setSuccessfulPrompts([...successfulPrompts, '']);
  };

  const removePromptField = (index: number) => {
    setSuccessfulPrompts(successfulPrompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index: number, value: string) => {
    const updated = [...successfulPrompts];
    updated[index] = value;
    setSuccessfulPrompts(updated);
  };

  const addProhibitedField = () => {
    setProhibitedContent([...prohibitedContent, '']);
  };

  const removeProhibitedField = (index: number) => {
    setProhibitedContent(prohibitedContent.filter((_, i) => i !== index));
  };

  const updateProhibited = (index: number, value: string) => {
    const updated = [...prohibitedContent];
    updated[index] = value;
    setProhibitedContent(updated);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!brandId.trim()) newErrors.brandId = 'Brand ID is required';
    if (!brandName.trim()) newErrors.brandName = 'Brand name is required';
    if (!voice.trim()) newErrors.voice = 'Brand voice is required';
    if (!visualStyle.trim()) newErrors.visualStyle = 'Visual style is required';
    if (!icpProfile.trim()) newErrors.icpProfile = 'ICP profile is required';

    const validPrompts = successfulPrompts.filter(p => p.trim());
    if (validPrompts.length === 0) {
      newErrors.successfulPrompts = 'At least one successful prompt is required';
    }

    const validProhibited = prohibitedContent.filter(p => p.trim());
    if (validProhibited.length === 0) {
      newErrors.prohibitedContent = 'At least one content restriction is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Filter out empty prompts and prohibited items
      const validPrompts = successfulPrompts.filter(p => p.trim());
      const validProhibited = prohibitedContent.filter(p => p.trim());

      // Create brand canon object
      const brand: BrandCanon = {
        brand_id: brandId.trim(),
        brand_name: brandName.trim(),
        voice: voice.trim(),
        visual_style: visualStyle.trim(),
        icp_profile: icpProfile.trim(),
        successful_prompts: validPrompts,
        prohibited_content: validProhibited
      };

      // Generate vector embedding
      const embeddingText = `${brand.brand_name} ${brand.voice} ${brand.visual_style} ${brand.icp_profile}`;
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: embeddingText
      });

      const vector = response.data[0].embedding;

      // Upload to QDRANT
      const result = await upsertBrandCanon(brand, vector);

      if (result.success) {
        // Success - notify parent and close
        onBrandCreated?.(brand);
        resetForm();
        onClose();
      } else {
        setSubmitError(result.error || 'Failed to create brand');
      }
    } catch (error) {
      console.error('Brand creation failed:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setBrandId('');
    setBrandName('');
    setVoice('');
    setVisualStyle('');
    setIcpProfile('');
    setSuccessfulPrompts(['']);
    setProhibitedContent(['']);
    setErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A3728]/80 backdrop-blur-sm">
      <div className="bg-[#4A3728] border border-[rgba(245,245,220,0.2)] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(245,245,220,0.1)] p-6">
          <h2 className="text-2xl font-bold text-[#F5F5DC]">Add New Brand</h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-[#F5F5DC]/60 hover:text-[#F5F5DC] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded p-4 text-[#B7410E] text-sm">
                {submitError}
              </div>
            )}

            {/* Brand ID & Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandName" className="text-[#F5F5DC]">
                  Brand Name <span className="text-[#B7410E]">*</span>
                </Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., FitLife Supplements"
                  disabled={submitting}
                  className="bg-[#4A3728] border-[rgba(245,245,220,0.2)] text-[#F5F5DC]"
                />
                {errors.brandName && <p className="text-xs text-[#B7410E]">{errors.brandName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandId" className="text-[#F5F5DC]">
                  Brand ID <span className="text-xs text-[#F5F5DC]/40">(auto-generated)</span>
                </Label>
                <Input
                  id="brandId"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  placeholder="fitlife-supplements"
                  disabled={submitting}
                  className="bg-[#4A3728] border-[rgba(245,245,220,0.2)] text-[#F5F5DC]"
                />
                {errors.brandId && <p className="text-xs text-[#B7410E]">{errors.brandId}</p>}
              </div>
            </div>

            {/* Voice */}
            <div className="space-y-2">
              <Label htmlFor="voice" className="text-[#F5F5DC]">
                Brand Voice & Tone <span className="text-[#B7410E]">*</span>
              </Label>
              <Textarea
                id="voice"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                placeholder="Describe the brand's voice, tone, personality, and communication style..."
                disabled={submitting}
                className="min-h-[100px] bg-[#4A3728] border-[rgba(245,245,220,0.2)] text-[#F5F5DC]"
              />
              {errors.voice && <p className="text-xs text-[#B7410E]">{errors.voice}</p>}
            </div>

            {/* Visual Style */}
            <div className="space-y-2">
              <Label htmlFor="visualStyle" className="text-[#F5F5DC]">
                Visual Style & Aesthetics <span className="text-[#B7410E]">*</span>
              </Label>
              <Textarea
                id="visualStyle"
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                placeholder="Describe visual preferences: colors, aesthetics, cinematography, lighting..."
                disabled={submitting}
                className="min-h-[100px] bg-[#4A3728] border-[rgba(245,245,220,0.2)] text-[#F5F5DC]"
              />
              {errors.visualStyle && <p className="text-xs text-[#B7410E]">{errors.visualStyle}</p>}
            </div>

            {/* ICP Profile */}
            <div className="space-y-2">
              <Label htmlFor="icpProfile" className="text-[#F5F5DC]">
                Ideal Customer Profile (ICP) <span className="text-[#B7410E]">*</span>
              </Label>
              <Textarea
                id="icpProfile"
                value={icpProfile}
                onChange={(e) => setIcpProfile(e.target.value)}
                placeholder="Describe target audience: demographics, psychographics, pain points..."
                disabled={submitting}
                className="min-h-[100px] bg-[#4A3728] border-[rgba(245,245,220,0.2)] text-[#F5F5DC]"
              />
              {errors.icpProfile && <p className="text-xs text-[#B7410E]">{errors.icpProfile}</p>}
            </div>

            {/* Successful Prompts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#F5F5DC]">
                  Successful Sora Prompts <span className="text-[#B7410E]">*</span>
                </Label>
                <Button
                  type="button"
                  onClick={addPromptField}
                  disabled={submitting}
                  size="sm"
                  variant="outline"
                  className="border-[rgba(245,245,220,0.2)] text-[#F5F5DC] hover:bg-[rgba(245,245,220,0.1)]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Prompt
                </Button>
              </div>
              {successfulPrompts.map((prompt, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={prompt}
                    onChange={(e) => updatePrompt(index, e.target.value)}
                    placeholder="Example of a successful Sora 2 prompt for this brand..."
                    disabled={submitting}
                    className="flex-1 min-h-[80px] bg-[#4A3728] border-[rgba(245,245,220,0.2)] text-[#F5F5DC]"
                  />
                  {successfulPrompts.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removePromptField(index)}
                      disabled={submitting}
                      size="icon"
                      variant="outline"
                      className="border-[rgba(245,245,220,0.2)] text-[#B7410E] hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.successfulPrompts && <p className="text-xs text-[#B7410E]">{errors.successfulPrompts}</p>}
            </div>

            {/* Prohibited Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#F5F5DC]">
                  Content Restrictions <span className="text-[#B7410E]">*</span>
                </Label>
                <Button
                  type="button"
                  onClick={addProhibitedField}
                  disabled={submitting}
                  size="sm"
                  variant="outline"
                  className="border-[rgba(245,245,220,0.2)] text-[#F5F5DC] hover:bg-[rgba(245,245,220,0.1)]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Restriction
                </Button>
              </div>
              {prohibitedContent.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateProhibited(index, e.target.value)}
                    placeholder="e.g., No copyrighted content, No real people..."
                    disabled={submitting}
                    className="flex-1 bg-[#4A3728] border-[rgba(245,245,220,0.2)] text-[#F5F5DC]"
                  />
                  {prohibitedContent.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeProhibitedField(index)}
                      disabled={submitting}
                      size="icon"
                      variant="outline"
                      className="border-[rgba(245,245,220,0.2)] text-[#B7410E] hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.prohibitedContent && <p className="text-xs text-[#B7410E]">{errors.prohibitedContent}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[rgba(245,245,220,0.1)] p-6 flex gap-3 justify-end bg-[#4A3728]/40">
            <Button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              variant="outline"
              className="border-[rgba(245,245,220,0.2)] text-[#F5F5DC] hover:bg-[rgba(245,245,220,0.1)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#5F9EA0] text-[#4A3728] hover:bg-[#C75B39]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Brand...
                </>
              ) : (
                'Create Brand'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
