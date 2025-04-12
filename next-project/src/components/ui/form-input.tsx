"use client";

import { useState } from "react";

interface FormInputProps {
  id: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  helpText?: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormInput({
  id,
  name,
  type = "text",
  autoComplete,
  required = false,
  disabled = false,
  label,
  placeholder,
  helpText,
  value,
  error,
  onChange,
}: FormInputProps) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // Determine the input type based on passwordVisible state
  const inputType = type === "password" && passwordVisible ? "text" : type;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={id}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            block w-full rounded-md border px-3 py-2 shadow-sm 
            placeholder:text-gray-400 sm:text-sm
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }
            ${disabled ? "cursor-not-allowed bg-gray-100 opacity-75" : ""}
          `}
        />
        
        {/* Toggle password visibility */}
        {type === "password" && value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setPasswordVisible(!passwordVisible)}
          >
            {passwordVisible ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {/* Help text or error message */}
      {(helpText || error) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-500"}`}>
          {error || helpText}
        </p>
      )}
    </div>
  );
}