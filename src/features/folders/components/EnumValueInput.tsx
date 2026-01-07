import { useState, useEffect } from "react";

interface EnumValueInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}

/**
 * Componente para editar valores de enum com estado local
 * Converte automaticamente para UPPERCASE e permite apenas A-Z, 0-9 e _
 */
export function EnumValueInput({ value, onChange, disabled }: EnumValueInputProps) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
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
            placeholder="VALOR_DO_ENUM"
            disabled={disabled}
            className="flex-1 px-3 py-1.5 text-sm font-mono bg-(--app-bg) border border-(--app-border) rounded-md text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none focus:ring-2 focus:ring-(--app-accent) disabled:opacity-50"
        />
    );
}
