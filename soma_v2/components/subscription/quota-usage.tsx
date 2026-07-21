// ============================================================================
// QUOTA USAGE COMPONENT
// Displays brand quota usage with progress bars
// ============================================================================

'use client';

import { useBrandQuota, useQuotaProgress } from '@/hooks/use-subscription';
import { formatModelProviderName } from '@/lib/utils/subscription-utils';
import { AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';

interface QuotaUsageProps {
  brandId: string;
  accountId?: string;
  showDetails?: boolean;
}

export function QuotaUsage({ brandId, accountId, showDetails = true }: QuotaUsageProps) {
  const { quota, loading, error, refresh } = useBrandQuota(brandId);
  const progress = useQuotaProgress(quota);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !quota) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-700">{error || 'Quota information not available'}</p>
        </div>
      </div>
    );
  }

  const getProgressBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    return 'bg-[#FF760D]';
  };

  const getCountColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    return 'text-[#FF760D]';
  };

  const quotaItems = [
    {
      label: 'Prompts',
      ...progress.prompts,
      description: 'AI-optimized search queries',
    },
    {
      label: 'Competitors',
      ...progress.competitors,
      description: 'Tracked competitor brands',
    },
    {
      label: 'Model Platforms',
      ...progress.models,
      description: 'AI model integrations',
    },
    {
      label: 'Locales',
      ...progress.locales,
      description: 'Geographic regions',
    },
  ];

  return (
    <div className="-m-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-black text-white rounded-t-lg px-6 py-5">
        <div>
          <h3 className="text-lg font-light text-white">Resource Usage</h3>
          <p className="text-sm text-gray-400 font-light">
            Track your brand&apos;s quota utilization
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-md p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Quota Items */}
      <div className="px-6 py-5 space-y-5">
        {quotaItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">{item.label}</span>
              <span className={`text-sm font-bold ${getCountColor(item.percent)}`}>
                {item.used} / {item.max}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-1.5 w-full rounded-full bg-gray-200">
              <div
                className={`absolute h-full rounded-full transition-all ${getProgressBarColor(item.percent)}`}
                style={{ width: `${Math.min(item.percent, 100)}%` }}
              />
            </div>
            
            {showDetails && (
              <p className="text-xs text-gray-500">{item.description}</p>
            )}
            
            {/* Warning Message */}
            {item.percent >= 90 && (
              <div className="rounded-md bg-red-50 border border-red-100 p-2">
                <p className="text-xs text-red-700">
                  ⚠️ You&apos;re approaching your {item.label.toLowerCase()} limit. Consider upgrading your plan.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Allowed Models */}
      {showDetails && quota.allowed_models.length > 0 && (
        <div className="mx-6 mb-5 rounded-lg border border-gray-200 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Allowed AI Models</h4>
          <div className="flex flex-wrap gap-2">
            {quota.allowed_models.map((model) => (
              <span
                key={model}
                className="inline-flex items-center rounded-full bg-[#FF760D]/10 px-3 py-1 text-xs font-medium text-[#FF760D]"
              >
                {formatModelProviderName(model)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="mx-6 mb-5 rounded-lg bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Overall Utilization</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((
                progress.prompts.percent +
                progress.competitors.percent +
                progress.models.percent +
                progress.locales.percent
              ) / 4)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Resources used</p>
            <p className="text-sm font-semibold text-gray-800">
              {progress.prompts.used + progress.competitors.used + progress.models.used + progress.locales.used}
              {' / '}
              {progress.prompts.max + progress.competitors.max + progress.models.max + progress.locales.max}
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(progress.prompts.percent >= 75 || progress.competitors.percent >= 75) && (
        <div className="mx-6 mb-5 rounded-lg border border-[#FF760D]/30 bg-[#FF760D]/5 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-[#FF760D] mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">Need more resources?</h4>
              <p className="mt-1 text-sm text-gray-600">
                Upgrade your plan to get higher quotas and unlock advanced features.
              </p>
              <button className="mt-3 rounded-md bg-[#FF760D] px-4 py-2 text-sm font-medium text-white hover:bg-[#e5690b] transition-colors">
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
