/**
 * 직원 360 View — 인사이력 / 교육이력 / 상벌이력 / 면담기록 탭 컴포넌트
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error("불러오기 실패");
  return res.json();
}
async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("저장 실패");
  return res.json();
}

// ─── 공통 빈 상태 ─────────────────────────────────────────────────────────────
function EmptyRow({ text }: { text: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">{text}</div>
  );
}

// ─── 인사이력 ─────────────────────────────────────────────────────────────────
interface PersonnelRecord {
  id: number; type: string; date: string; description: string;
  previousDepartment?: string | null; newDepartment?: string | null;
  previousPosition?: string | null; newPosition?: string | null;
}

export function PersonnelHistoryTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "입사", date: "", description: "", previousDepartment: "", newDepartment: "", previousPosition: "", newPosition: "" });

  const { data = [], isLoading } = useQuery<PersonnelRecord[]>({
    queryKey: ["personnel-history", employeeId],
    queryFn: () => apiFetch(`/api/employees/${employeeId}/personnel-history`),
  });

  const mutation = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/personnel-history`, {
      type: form.type, date: form.date, description: form.description,
      previousDepartment: form.previousDepartment || null, newDepartment: form.newDepartment || null,
      previousPosition: form.previousPosition || null, newPosition: form.newPosition || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personnel-history", employeeId] });
      qc.invalidateQueries({ queryKey: ["timeline", employeeId] });
      toast.success("인사이력이 추가되었습니다.");
      setForm({ type: "입사", date: "", description: "", previousDepartment: "", newDepartment: "", previousPosition: "", newPosition: "" });
      setOpen(false);
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">인사이력</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
          {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {open ? "닫기" : "추가"}
        </Button>
      </div>

      {open && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">구분 *</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["입사","승진","부서이동","직급변경","계약갱신","복직","퇴사","기타"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">일자 *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이전 부서</Label>
              <Input placeholder="이전 부서" value={form.previousDepartment} onChange={e => setForm(f => ({ ...f, previousDepartment: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">변경 부서</Label>
              <Input placeholder="변경 부서" value={form.newDepartment} onChange={e => setForm(f => ({ ...f, newDepartment: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이전 직급</Label>
              <Input placeholder="이전 직급" value={form.previousPosition} onChange={e => setForm(f => ({ ...f, previousPosition: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">변경 직급</Label>
              <Input placeholder="변경 직급" value={form.newPosition} onChange={e => setForm(f => ({ ...f, newPosition: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">내용 *</Label>
            <Textarea rows={2} placeholder="내용을 입력하세요" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={!form.date || !form.description || mutation.isPending}>
              {mutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">불러오는 중...</div>
      ) : data.length === 0 ? (
        <EmptyRow text="등록된 인사이력이 없습니다." />
      ) : (
        <div className="divide-y divide-border rounded-lg border overflow-hidden">
          {data.map(r => (
            <div key={r.id} className="flex items-start gap-4 p-4 hover:bg-muted/30">
              <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                  {(r.previousPosition || r.newPosition) && (
                    <span className="text-xs text-muted-foreground">{r.previousPosition} → {r.newPosition}</span>
                  )}
                  {(r.previousDepartment || r.newDepartment) && (
                    <span className="text-xs text-muted-foreground">{r.previousDepartment} → {r.newDepartment}</span>
                  )}
                </div>
                <p className="text-sm">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 교육이력 ─────────────────────────────────────────────────────────────────
interface EducationRecord {
  id: number; name: string; date: string; completed: boolean; notes?: string | null;
}

export function EducationTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", completed: false, notes: "" });

  const { data = [], isLoading } = useQuery<EducationRecord[]>({
    queryKey: ["education", employeeId],
    queryFn: () => apiFetch(`/api/employees/${employeeId}/education`),
  });

  const mutation = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/education`, {
      name: form.name, date: form.date, completed: form.completed, notes: form.notes || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["education", employeeId] });
      qc.invalidateQueries({ queryKey: ["timeline", employeeId] });
      toast.success("교육이력이 추가되었습니다.");
      setForm({ name: "", date: "", completed: false, notes: "" });
      setOpen(false);
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">교육이력</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
          {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {open ? "닫기" : "추가"}
        </Button>
      </div>

      {open && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">교육명 *</Label>
              <Input placeholder="교육명을 입력하세요" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">교육일 *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.completed} onCheckedChange={v => setForm(f => ({ ...f, completed: !!v }))} />
                <span className="text-sm">이수 완료</span>
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">비고</Label>
            <Textarea rows={2} placeholder="비고를 입력하세요" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={!form.name || !form.date || mutation.isPending}>
              {mutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">불러오는 중...</div>
      ) : data.length === 0 ? (
        <EmptyRow text="등록된 교육이력이 없습니다." />
      ) : (
        <div className="divide-y divide-border rounded-lg border overflow-hidden">
          {data.map(r => (
            <div key={r.id} className="flex items-start gap-4 p-4 hover:bg-muted/30">
              <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{r.name}</span>
                  <Badge variant={r.completed ? "success" : "warning"} className="text-xs">
                    {r.completed ? "이수" : "예정"}
                  </Badge>
                </div>
                {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 상벌이력 ─────────────────────────────────────────────────────────────────
interface RewardRecord { id: number; type: string; date: string; content: string; }
interface DisciplinaryRecord { id: number; disciplinaryType: string; date: string; content: string; }

export function RewardsTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [discOpen, setDiscOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState({ type: "포상", date: "", content: "" });
  const [discForm, setDiscForm] = useState({ disciplinaryType: "주의", date: "", content: "" });

  const { data: rewards = [], isLoading: rLoading } = useQuery<RewardRecord[]>({
    queryKey: ["rewards", employeeId],
    queryFn: () => apiFetch(`/api/employees/${employeeId}/rewards`),
  });
  const { data: disciplinary = [], isLoading: dLoading } = useQuery<DisciplinaryRecord[]>({
    queryKey: ["disciplinary", employeeId],
    queryFn: () => apiFetch(`/api/employees/${employeeId}/disciplinary`),
  });

  const rewardMutation = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/rewards`, rewardForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards", employeeId] });
      qc.invalidateQueries({ queryKey: ["timeline", employeeId] });
      toast.success("포상이 추가되었습니다.");
      setRewardForm({ type: "포상", date: "", content: "" });
      setRewardOpen(false);
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const discMutation = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/disciplinary`, discForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinary", employeeId] });
      qc.invalidateQueries({ queryKey: ["timeline", employeeId] });
      toast.success("징계가 추가되었습니다.");
      setDiscForm({ disciplinaryType: "주의", date: "", content: "" });
      setDiscOpen(false);
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  return (
    <div className="space-y-6">
      {/* 포상 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-emerald-700">포상 이력</h3>
          <Button size="sm" variant="outline" onClick={() => setRewardOpen(!rewardOpen)}>
            {rewardOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {rewardOpen ? "닫기" : "추가"}
          </Button>
        </div>
        {rewardOpen && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">구분 *</Label>
                <Select value={rewardForm.type} onValueChange={v => setRewardForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["포상","표창","감사장","기타"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">일자 *</Label>
                <Input type="date" value={rewardForm.date} onChange={e => setRewardForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">내용 *</Label>
              <Textarea rows={2} placeholder="포상 내용을 입력하세요" value={rewardForm.content} onChange={e => setRewardForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setRewardOpen(false)}>취소</Button>
              <Button size="sm" onClick={() => rewardMutation.mutate()} disabled={!rewardForm.date || !rewardForm.content || rewardMutation.isPending}>
                {rewardMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        )}
        {rLoading ? <div className="text-center py-4 text-sm text-muted-foreground">불러오는 중...</div>
          : rewards.length === 0 ? <EmptyRow text="등록된 포상 이력이 없습니다." />
          : (
            <div className="divide-y divide-border rounded-lg border overflow-hidden">
              {rewards.map(r => (
                <div key={r.id} className="flex items-start gap-4 p-4 hover:bg-muted/30">
                  <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
                  <div className="flex-1">
                    <Badge variant="success" className="text-xs mb-1">{r.type}</Badge>
                    <p className="text-sm">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="border-t pt-4" />

      {/* 징계 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-red-700">징계 이력</h3>
          <Button size="sm" variant="outline" onClick={() => setDiscOpen(!discOpen)}>
            {discOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {discOpen ? "닫기" : "추가"}
          </Button>
        </div>
        {discOpen && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">징계 유형 *</Label>
                <Select value={discForm.disciplinaryType} onValueChange={v => setDiscForm(f => ({ ...f, disciplinaryType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["주의","경고","감봉","정직","해고","기타"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">일자 *</Label>
                <Input type="date" value={discForm.date} onChange={e => setDiscForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">내용 *</Label>
              <Textarea rows={2} placeholder="징계 내용을 입력하세요" value={discForm.content} onChange={e => setDiscForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setDiscOpen(false)}>취소</Button>
              <Button size="sm" variant="destructive" onClick={() => discMutation.mutate()} disabled={!discForm.date || !discForm.content || discMutation.isPending}>
                {discMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        )}
        {dLoading ? <div className="text-center py-4 text-sm text-muted-foreground">불러오는 중...</div>
          : disciplinary.length === 0 ? <EmptyRow text="등록된 징계 이력이 없습니다." />
          : (
            <div className="divide-y divide-border rounded-lg border overflow-hidden">
              {disciplinary.map(r => (
                <div key={r.id} className="flex items-start gap-4 p-4 hover:bg-muted/30">
                  <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
                  <div className="flex-1">
                    <Badge variant="destructive" className="text-xs mb-1">{r.disciplinaryType}</Badge>
                    <p className="text-sm">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── 면담기록 ─────────────────────────────────────────────────────────────────
interface InterviewRecord { id: number; date: string; content: string; interviewer?: string | null; }

export function InterviewsTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", content: "", interviewer: "" });

  const { data = [], isLoading } = useQuery<InterviewRecord[]>({
    queryKey: ["interviews", employeeId],
    queryFn: () => apiFetch(`/api/employees/${employeeId}/interviews`),
  });

  const mutation = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/interviews`, {
      date: form.date, content: form.content, interviewer: form.interviewer || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews", employeeId] });
      qc.invalidateQueries({ queryKey: ["timeline", employeeId] });
      toast.success("면담기록이 추가되었습니다.");
      setForm({ date: "", content: "", interviewer: "" });
      setOpen(false);
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">면담기록</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
          {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {open ? "닫기" : "추가"}
        </Button>
      </div>

      {open && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">면담일 *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">면담자</Label>
              <Input placeholder="예: 인사팀장" value={form.interviewer} onChange={e => setForm(f => ({ ...f, interviewer: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">면담 내용 *</Label>
            <Textarea rows={3} placeholder="면담 내용을 입력하세요" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={!form.date || !form.content || mutation.isPending}>
              {mutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">불러오는 중...</div>
      ) : data.length === 0 ? (
        <EmptyRow text="등록된 면담기록이 없습니다." />
      ) : (
        <div className="space-y-3">
          {data.map(r => (
            <div key={r.id} className="border rounded-lg p-4 hover:bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.date}</span>
                {r.interviewer && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    면담자: {r.interviewer}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
