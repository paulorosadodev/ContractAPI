import { useState, useEffect } from "react";

interface FieldNameInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}

/**
 * Componente com estado local para evitar travamento ao digitar
 */
export function FieldNameInput({ value, onChange, disabled }: FieldNameInputProps) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                if (localValue !== value) {
                    onChange(localValue);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.currentTarget.blur();
                }
            }}
            placeholder="Nome do campo"
            disabled={disabled}
            className="flex-1 px-3 py-1.5 text-sm bg-(--app-bg) border border-(--app-border) rounded-md text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none focus:ring-2 focus:ring-(--app-accent) disabled:opacity-50"
        />
    );
}
