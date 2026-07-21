import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGetEmployeeQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Status = "재직" | "휴직" | "퇴사";

interface Props {
  employeeId: number;
  currentStatus: Status;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

async function patchStatus(id: number, status: Status, statusNote: string) {
  const res = await fetch(`${BASE_URL}/api/employees/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, statusNote }),
  });
  if (!res.ok) throw new Error("상태 변경 실패");
  return res.json();
}

const STATUS_OPTIONS: { value: Status; label: string; description: string; color: string }[] = [
  { value: "재직", label: "재직",  description: "정상 근무 중인 상태",  color: "text-emerald-600" },
  { value: "휴직", label: "휴직",  description: "병가·육아휴직 등으로 일시 휴직",  color: "text-amber-600" },
  { value: "퇴사", label: "퇴사",  description: "자발적 퇴사 또는 계약 종료",  color: "text-red-600" },
];

export function EmployeeStatusDialog({ employeeId, currentStatus, employeeName, open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<Status>(currentStatus);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => patchStatus(employeeId, selected, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetEmployeeQueryKey(employeeId) });
      // 목록 쿼리도 무효화
      queryClient.invalidateQueries({ queryKey: ["listEmployees"] });
      toast.success(`${employeeName} 님의 상태가 '${selected}'으로 변경되었습니다.`);
      onOpenChange(false);
      setNote("");
    },
    onError: () => {
      toast.error("상태 변경에 실패했습니다.");
    },
  });

  const changed = selected !== currentStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>재직 상태 변경</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{employeeName}</span> 님의 현재 상태:{" "}
            <span className="font-semibold">{currentStatus}</span>
          </p>

          <RadioGroup
            value={selected}
            onValueChange={(v) => setSelected(v as Status)}
            className="space-y-2"
          >
            {STATUS_OPTIONS.map(({ value, label, description, color }) => (
              <label
                key={value}
                htmlFor={`status-${value}`}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selected === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <RadioGroupItem value={value} id={`status-${value}`} className="mt-0.5" />
                <div>
                  <p className={`font-semibold text-sm ${color}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="status-note" className="text-sm">
              사유 / 비고 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Textarea
              id="status-note"
              placeholder="예: 육아휴직 (복귀 예정: 2026-03-01)"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!changed || mutation.isPending}
          >
            {mutation.isPending ? "변경 중..." : "상태 변경"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
