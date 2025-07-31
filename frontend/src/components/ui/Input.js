import React, { useState, forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  disabled = false,
  required = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  className = '',
  helperText,
  maxLength,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const baseClasses = 'input-field';
  const sizeClasses = `input-field--${size}`;
  const variantClasses = `input-field--${variant}`;
  const stateClasses = [
    focused && 'input-field--focused',
    error && 'input-field--error',
    success && 'input-field--success',
    disabled && 'input-field--disabled',
    icon && 'input-field--with-icon',
    iconPosition === 'right' && 'input-field--icon-right'
  ].filter(Boolean).join(' ');

  const fieldClasses = [
    baseClasses,
    sizeClasses,
    variantClasses,
    stateClasses,
    className
  ].filter(Boolean).join(' ');

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={fieldClasses}>
      {label && (
        <label className="input-field__label">
          {label}
          {required && <span className="input-field__required">*</span>}
        </label>
      )}
      
      <div className="input-field__wrapper">
        {icon && iconPosition === 'left' && (
          <div className="input-field__icon input-field__icon--left">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className="input-field__input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className="input-field__password-toggle"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
        
        {icon && iconPosition === 'right' && type !== 'password' && (
          <div className="input-field__icon input-field__icon--right">
            {icon}
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="input-field__feedback">
          {error && (
            <div className="input-field__error">
              <ErrorIcon />
              <span>{error}</span>
            </div>
          )}
          {success && !error && (
            <div className="input-field__success">
              <CheckIcon />
              <span>{success}</span>
            </div>
          )}
          {helperText && !error && !success && (
            <div className="input-field__helper">
              {helperText}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Icon components
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

Input.displayName = 'Input';

export default Input;