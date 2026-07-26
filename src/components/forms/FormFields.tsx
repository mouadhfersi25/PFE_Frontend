import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes } from 'react';

type FieldContainerProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

function FieldContainer({ label, error, required, children }: FieldContainerProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & {
  label: string;
  error?: string;
  inputClassName: string;
};

export function InputField({ label, error, inputClassName, required, className, ...props }: InputFieldProps) {
  return (
    <FieldContainer label={label} error={error} required={required}>
      <input
        {...props}
        required={required}
        className={`${inputClassName} ${error ? 'border-red-500' : ''} ${className ?? ''}`.trim()}
      />
    </FieldContainer>
  );
}

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> & {
  label: string;
  error?: string;
  inputClassName: string;
};

export function TextareaField({ label, error, inputClassName, required, className, ...props }: TextareaFieldProps) {
  return (
    <FieldContainer label={label} error={error} required={required}>
      <textarea
        {...props}
        required={required}
        className={`${inputClassName} ${error ? 'border-red-500' : ''} ${className ?? ''}`.trim()}
      />
    </FieldContainer>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  inputClassName: string;
};

export function SelectField({ label, error, inputClassName, required, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldContainer label={label} error={error} required={required}>
      <select
        {...props}
        required={required}
        className={`${inputClassName} ${error ? 'border-red-500' : ''} ${className ?? ''}`.trim()}
      >
        {children}
      </select>
    </FieldContainer>
  );
}
