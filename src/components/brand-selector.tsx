'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { getAllBrands, getDemoBrand } from '@/lib/qdrant-client';
import type { BrandCanon } from '@/types/brand-canon';

export type BrandSelectorProps = {
  value: string;
  onChange: (brandId: string) => void;
  onBrandLoaded?: (brand: BrandCanon | null) => void;
  onOpenAddBrand?: () => void;
  disabled?: boolean;
  className?: string;
};

export function BrandSelector({
  value,
  onChange,
  onBrandLoaded,
  onOpenAddBrand,
  disabled,
  className
}: BrandSelectorProps) {
  const [brands, setBrands] = React.useState<BrandCanon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load brands on component mount
  React.useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);

      const { brands: fetchedBrands } = await getAllBrands({ limit: 100 });

      if (fetchedBrands.length === 0) {
        // No brands in QDRANT, fall back to demo brand
        const demoBrand = getDemoBrand();
        setBrands([demoBrand]);

        // Auto-select demo brand if no value selected
        if (!value) {
          onChange(demoBrand.brand_id);
          onBrandLoaded?.(demoBrand);
        }
      } else {
        setBrands(fetchedBrands);

        // If no value selected, auto-select first brand (likely Demo Brand)
        if (!value && fetchedBrands.length > 0) {
          const defaultBrand = fetchedBrands.find(b => b.brand_id === 'demo-brand') || fetchedBrands[0];
          onChange(defaultBrand.brand_id);
          onBrandLoaded?.(defaultBrand);
        }
      }
    } catch (err) {
      console.error('Failed to load brands from QDRANT:', err);
      setError('Unable to connect to brand database. Using Demo Brand as fallback.');

      // Fallback to demo brand on error
      const demoBrand = getDemoBrand();
      setBrands([demoBrand]);

      if (!value) {
        onChange(demoBrand.brand_id);
        onBrandLoaded?.(demoBrand);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (brandId: string) => {
    if (brandId === '__add_new__') {
      onOpenAddBrand?.();
      return;
    }

    onChange(brandId);

    // Notify parent component of loaded brand
    const selectedBrand = brands.find(b => b.brand_id === brandId);
    onBrandLoaded?.(selectedBrand || null);
  };

  const handleRetry = () => {
    loadBrands();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[rgba(245,245,220,0.2)] bg-[#4A3728] px-3 py-2 text-[#F5F5DC]/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading brands...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className={`rounded-md border border-[rgba(245,245,220,0.2)] bg-[#4A3728] text-[#F5F5DC] ${className || ''}`}>
          <SelectValue placeholder="Select a brand" />
        </SelectTrigger>
        <SelectContent className="bg-[#4A3728]/95 text-[#F5F5DC] border-[rgba(245,245,220,0.2)]">
          {brands.map((brand) => (
            <SelectItem
              key={brand.brand_id}
              value={brand.brand_id}
              className="text-[#F5F5DC] hover:bg-[rgba(245,245,220,0.1)] focus:bg-white/10"
            >
              {brand.brand_name}
            </SelectItem>
          ))}
          {onOpenAddBrand && (
            <SelectItem
              value="__add_new__"
              className="text-[#5F9EA0] hover:bg-[rgba(245,245,220,0.1)] focus:bg-white/10 font-medium"
            >
              + Add New Brand...
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#E2725B]">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="text-[#5F9EA0] underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

// Export for external refresh (e.g., after adding new brand)
export { BrandSelector as default };
