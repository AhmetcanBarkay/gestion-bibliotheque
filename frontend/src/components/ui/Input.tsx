import React, { useState, useEffect } from 'react';
import './Input.css';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    onCheck?: (value: string) => string | null;
    onChange?: (value: string) => void;
    onToggleError?: (hasError: boolean) => void;
    validationDeps?: ReadonlyArray<unknown>;
    label: string;
}

const Input: React.FC<InputProps> = ({
    onCheck,
    onChange,
    onToggleError,
    validationDeps = [],
    className = "",
    value = '',
    label = '',
    ...props
}) => {
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    const [focused, setFocused] = useState(false);

    // Validation initiale et à chaque changement de valeur
    useEffect(() => {
        if (onCheck) {
            const validationError = onCheck(value as string);
            setError(validationError);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, ...validationDeps]);

    // Notifier le parent quand l'erreur change
    useEffect(() => {
        onToggleError?.(!!error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.value);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setTouched(true);
        setFocused(false);
        props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        props.onFocus?.(e);
    };

    const showError = error && touched && !focused;

    return (
        <div className="input-wrapper">

            <p className="label-input">
                {label}
            </p>
            <span className="error-input-text">
                {showError ? error : '\u00A0'}
            </span>
            <input
                {...props}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className={`input-field ${className}`}
            />
        </div>
    );
};

export default Input;
