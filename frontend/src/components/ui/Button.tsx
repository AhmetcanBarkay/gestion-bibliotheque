import React, { useState } from 'react';
import "./Button.css";
import Spinner from "./Spinner";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    isLoading?: boolean;
    onClick?: (
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
    ) => void | Promise<void>;
}

const Button: React.FC<ButtonProps> = ({
    children,
    isLoading: externalLoading,
    disabled,
    onClick,
    ...props
}) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const isLoading = externalLoading || internalLoading;

    const handleClick = async () => {
        if (!onClick) return;
        const result = onClick(setInternalLoading);
        if (result instanceof Promise) {
            setInternalLoading(true);
            try {
                await result;
            } finally {
                setInternalLoading(false);
            }
        }
    };

    return (
        <button
            {...props}
            onClick={handleClick}
            disabled={isLoading || disabled}
            className={`button-component ${isLoading ? 'is-loading' : ''} ${props.className || ''}`}
        >
            {isLoading ? (
                <Spinner size={16} />
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
