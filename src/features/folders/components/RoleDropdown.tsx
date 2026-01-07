import { Dropdown, type DropdownItem } from "../../../shared/components/Dropdown";

interface RoleDropdownProps {
    value: string | undefined;
    onChange: (roleId: string | undefined) => void;
    roles: { id: string; name: string; order: number }[];
    disabled?: boolean;
}

export function RoleDropdown({ value, onChange, roles, disabled }: RoleDropdownProps) {
    const items: DropdownItem[] = [
        { id: "", label: "Sem restrição" },
        ...roles.map((role) => ({
            id: role.id,
            label: role.name,
        })),
    ];

    const selectedLabel = value ? roles.find((r) => r.id === value)?.name || "Sem restrição" : "Sem restrição";

    return <Dropdown items={items} value={value || ""} onSelect={(item) => onChange(item.id || undefined)} disabled={disabled} placeholder={selectedLabel} selectedItemClassName="bg-purple-600 text-white" fullWidth />;
}
