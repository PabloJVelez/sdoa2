import { StoreProductVariant } from '@medusajs/types';
import clsx from 'clsx';
import { FC } from 'react';
import { Controller } from 'react-hook-form';
import { useRemixFormContext } from 'remix-hook-form';

export type QuantitySelectorLabels = {
  /** Shown inside the select control (e.g. "Quantity", "Tickets"). */
  prefix?: string;
  unitSingular?: string;
  unitPlural?: string;
  empty?: string;
};

interface QuantitySelectorProps {
  variant: StoreProductVariant | undefined;
  maxInventory?: number;
  /** Lowest selectable quantity (default 1). Options run from this value up to available inventory. */
  minQuantity?: number;
  className?: string;
  formId?: string;
  onChange?: (quantity: number) => void;
  customInventoryQuantity?: number;
  labels?: QuantitySelectorLabels;
  /** Stacked: label above select. Inline: label inside select (events/tickets). */
  layout?: 'stacked' | 'inline';
}

export const QuantitySelector: FC<QuantitySelectorProps> = ({
  className,
  variant,
  maxInventory = 10,
  minQuantity = 1,
  onChange,
  customInventoryQuantity,
  labels,
  layout = 'inline',
}) => {
  const prefixLabel = labels?.prefix ?? 'Quantity';
  const unitSingular = labels?.unitSingular;
  const unitPlural = labels?.unitPlural ?? labels?.unitSingular;
  const emptyLabel = labels?.empty ?? 'Not available';

  const formatOptionLabel = (value: number) => {
    if (!unitSingular) {
      return String(value);
    }
    const unit = value === 1 ? unitSingular : unitPlural ?? `${unitSingular}s`;
    return `${value} ${unit}`;
  };
  const formContext = useRemixFormContext();

  if (!formContext) {
    console.error('QuantitySelector must be used within a RemixFormProvider');
    return null;
  }

  const { control } = formContext;

  const variantInventory =
    customInventoryQuantity !== undefined
      ? customInventoryQuantity
      : variant?.manage_inventory && !variant.allow_backorder
        ? variant.inventory_quantity || 0
        : maxInventory;

  // When `customInventoryQuantity` is provided, trust it as the upper bound;
  // otherwise fall back to the legacy `maxInventory` cap.
  const maxOptions =
    customInventoryQuantity !== undefined
      ? variantInventory
      : Math.min(variantInventory, maxInventory);

  const minQ = Math.max(1, Math.floor(minQuantity))
  const safeMin = Math.min(minQ, Math.max(1, maxOptions))
  const optionCount = Math.max(0, maxOptions - safeMin + 1)
  const optionsArray = Array.from({ length: optionCount }, (_, index) => {
    const value = safeMin + index
    return {
      label: `${value}`,
      value,
    }
  })

  const selectClassName = clsx(
    'focus:border-orange-500 focus:ring-orange-500 !h-14 !w-full rounded-xl border-2 border-gray-200 pr-4 text-lg font-semibold bg-white shadow-sm hover:border-orange-300 transition-colors',
    layout === 'inline' ? 'pl-20' : 'pl-4',
  );

  return (
    <Controller
      name="quantity"
      control={control}
      render={({ field }) => (
        <div className={clsx('w-full', className)}>
          {layout === 'stacked' ? (
            <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700">
              {prefixLabel}
            </label>
          ) : (
            <label htmlFor="quantity" className="sr-only">
              {prefixLabel}
            </label>
          )}
          <div className={layout === 'inline' ? 'relative' : undefined}>
            {layout === 'inline' && (
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                {prefixLabel}
              </span>
            )}
            <select
              {...field}
              id="quantity"
              className={selectClassName}
              value={String(
                optionsArray.some((o) => o.value === Number(field.value))
                  ? field.value
                  : optionsArray[0]?.value ?? 1,
              )}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                field.onChange(value);
                onChange?.(value);
              }}
              disabled={optionsArray.length === 0}
            >
              {optionsArray.length === 0 ? (
                <option value="">{emptyLabel}</option>
              ) : (
                optionsArray.map((option) => (
                  <option key={option.value} value={option.value}>
                    {formatOptionLabel(option.value)}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}
    />
  );
};
