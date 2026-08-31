import React from 'react';
import { InputNumber } from 'antd';

/**
 * Reusable CurrencyInputNumber component for QBA BMS ERP.
 * Displays thousand separators (e.g. 15.000.000) for presentation while
 * preserving raw numeric values (e.g. 15000000) for state and API payloads.
 */
const CurrencyInputNumber = ({
  value,
  onChange,
  min = 0,
  step = 10000,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <InputNumber
      min={min}
      step={step}
      value={value}
      onChange={onChange}
      className={`font-mono ${className}`}
      style={style}
      formatter={(v) => (v !== undefined && v !== null && v !== '' ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
      parser={(v) => (v ? v.replace(/\./g, '') : '')}
      {...props}
    />
  );
};

export default CurrencyInputNumber;
