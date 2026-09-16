import React from 'react';
import { Check } from 'lucide-react';

/**
 * Multi-select for fishing types — a trip or event can combine several
 * (for example casting in the morning and couler in the evening).
 */
const FishingTypeSelector = ({
  options = [],
  selected = [],
  onChange,
  otherValue = '',
  onOtherChange,
  allowOther = true
}) => {
  const toggle = (name) => {
    onChange(selected.includes(name)
      ? selected.filter(type => type !== name)
      : [...selected, name]);
  };

  const otherSelected = selected.includes('other');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((type) => {
          const isSelected = selected.includes(type.name);
          return (
            <button
              key={type.id ?? type.name}
              type="button"
              onClick={() => toggle(type.name)}
              aria-pressed={isSelected}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              {isSelected && <Check className="w-4 h-4" />}
              {type.name}
            </button>
          );
        })}

        {allowOther && (
          <button
            type="button"
            onClick={() => toggle('other')}
            aria-pressed={otherSelected}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-sm transition-colors ${
              otherSelected
                ? 'bg-gray-700 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-500'
            }`}
          >
            {otherSelected && <Check className="w-4 h-4" />}
            ➕ Other
          </button>
        )}
      </div>

      {allowOther && otherSelected && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => onOtherChange?.(e.target.value)}
          placeholder="Specify the other fishing type..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      )}

      <p className="text-xs text-gray-500">
        {selected.length === 0
          ? 'Pick one or more — you can combine several types in a single trip.'
          : `${selected.length} type${selected.length === 1 ? '' : 's'} selected`}
      </p>
    </div>
  );
};

export default FishingTypeSelector;
