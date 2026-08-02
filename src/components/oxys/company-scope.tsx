import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSessionInfo, listCompanies } from "@/lib/oxys.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CompanyOption = { id: string; name: string };

export function useCompanyScope() {
  const fetchSession = useServerFn(getSessionInfo);
  const fetchCompanies = useServerFn(listCompanies);
  const [companyId, setCompanyId] = useState("");

  const { data: session } = useQuery({ queryKey: ["session-info"], queryFn: () => fetchSession() });
  const isOwner = session?.isOwner ?? false;

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => fetchCompanies(),
    enabled: isOwner,
  });

  const options = useMemo<CompanyOption[]>(() => {
    if (isOwner) return (companies ?? []).map((c) => ({ id: c.id, name: c.trade_name }));
    return (session?.memberships ?? [])
      .filter((m) => m.companyId)
      .map((m) => ({ id: m.companyId as string, name: m.companyName ?? "Minha empresa" }));
  }, [companies, isOwner, session]);

  useEffect(() => {
    const first = options[0];
    if (!companyId && first) setCompanyId(first.id);
  }, [companyId, options]);

  return { session, isOwner, options, companyId, setCompanyId };
}

export function CompanyPicker({
  options,
  value,
  onChange,
}: {
  options: CompanyOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-60">
        <SelectValue placeholder="Selecione a empresa" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
