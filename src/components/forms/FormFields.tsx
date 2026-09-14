import { useId } from 'react';
import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes } from 'react';

type FieldContainerProps = {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

function FieldContainer({ label, htmlFor, error, required, children }: FieldContainerProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-2">
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

export function InputField({ label, error, inputClassName, required, className, id, ...props }: InputFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldContainer label={label} htmlFor={fieldId} error={error} required={required}>
      <input
        {...props}
        id={fieldId}
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

export function TextareaField({ label, error, inputClassName, required, className, id, ...props }: TextareaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldContainer label={label} htmlFor={fieldId} error={error} required={required}>
      <textarea
        {...props}
        id={fieldId}
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

export function SelectField({ label, error, inputClassName, required, className, id, children, ...props }: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldContainer label={label} htmlFor={fieldId} error={error} required={required}>
      <select
        {...props}
        id={fieldId}
        required={required}
        className={`${inputClassName} ${error ? 'border-red-500' : ''} ${className ?? ''}`.trim()}
      >
        {children}
      </select>
    </FieldContainer>
  );
}
