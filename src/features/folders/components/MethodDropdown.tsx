import { Dropdown, type DropdownItem } from "../../../shared/components/Dropdown";
import type { HttpMethod } from "../model/folderTypes";
import { HTTP_METHODS } from "./FolderExplorer";

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: "bg-green-600",
    POST: "bg-blue-600",
    PUT: "bg-orange-500",
    PATCH: "bg-yellow-600",
    DELETE: "bg-red-600",
};

interface MethodDropdownProps {
    value: HttpMethod;
    onChange: (method: HttpMethod) => void;
    disabled?: boolean;
}

export function MethodDropdown({ value, onChange, disabled }: MethodDropdownProps) {
    const items: DropdownItem[] = HTTP_METHODS.map((method) => ({
        id: method,
        label: method,
    }));

    return <Dropdown items={items} value={value} onSelect={(item) => onChange(item.id as HttpMethod)} disabled={disabled} trigger={<span className={`px-2 py-1 text-xs font-bold rounded-md ${METHOD_COLORS[value]} text-white`}>{value}</span>} triggerClassName="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" selectedItemClassName="bg-purple-600 text-white" minWidth={80} />;
}

export { METHOD_COLORS };
