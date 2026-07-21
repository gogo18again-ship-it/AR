/**
 * 직원 360 View — 인사이력 / 교육이력 / 상벌이력 / 면담기록 탭 컴포넌트
 * 각 이력: 추가 + 인라인 편집 + 삭제(확인)
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
import { Plus, Pencil, Trash2, Check, X, ChevronUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error("불러오기 실패");
  return res.json();
}
async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("저장 실패");
  return res.json();
}
async function apiPut(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("수정 실패");
  return res.json();
}
async function apiDelete(path: string) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error("삭제 실패");
}

// ─── 공통 ─────────────────────────────────────────────────────────────────────
function EmptyRow({ text }: { text: string }) {
  return <div className="text-center py-8 text-muted-foreground text-sm">{text}</div>;
}

/** 삭제 확인 버튼: 첫 클릭 → 빨간 확인, 두 번째 클릭 → 실제 삭제 */
function DeleteButton({ onDelete, disabled }: { onDelete: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button size="icon" variant="destructive" className="h-7 w-7" disabled={disabled} onClick={() => { onDelete(); setConfirming(false); }}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setConfirming(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setConfirming(true)}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 인사이력
// ══════════════════════════════════════════════════════════════════════════════
interface PersonnelRecord {
  id: number; type: string; date: string; description: string;
  previousDepartment?: string | null; newDepartment?: string | null;
  previousPosition?: string | null; newPosition?: string | null;
}
const PERSONNEL_TYPES = ["입사","승진","부서이동","직급변경","계약갱신","복직","퇴사","기타"];

const emptyPersonnel = () => ({ type: "입사", date: "", description: "", previousDepartment: "", newDepartment: "", previousPosition: "", newPosition: "" });

function PersonnelForm({ value, onChange }: { value: ReturnType<typeof emptyPersonnel>; onChange: (v: ReturnType<typeof emptyPersonnel>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">구분 *</Label>
          <Select value={value.type} onValueChange={v => onChange({ ...value, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PERSONNEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">일자 *</Label>
          <Input type="date" value={value.date} onChange={e => onChange({ ...value, date: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">이전 부서</Label>
          <Input placeholder="이전 부서" value={value.previousDepartment} onChange={e => onChange({ ...value, previousDepartment: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">변경 부서</Label>
          <Input placeholder="변경 부서" value={value.newDepartment} onChange={e => onChange({ ...value, newDepartment: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">이전 직급</Label>
          <Input placeholder="이전 직급" value={value.previousPosition} onChange={e => onChange({ ...value, previousPosition: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">변경 직급</Label>
          <Input placeholder="변경 직급" value={value.newPosition} onChange={e => onChange({ ...value, newPosition: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">내용 *</Label>
        <Textarea rows={2} placeholder="내용을 입력하세요" value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} />
      </div>
    </div>
  );
}

export function PersonnelHistoryTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyPersonnel());
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyPersonnel());

  const qKey = ["personnel-history", employeeId];
  const { data = [], isLoading } = useQuery<PersonnelRecord[]>({ queryKey: qKey, queryFn: () => apiFetch(`/api/employees/${employeeId}/personnel-history`) });

  const createMut = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/personnel-history`, { ...addForm, previousDepartment: addForm.previousDepartment || null, newDepartment: addForm.newDepartment || null, previousPosition: addForm.previousPosition || null, newPosition: addForm.newPosition || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("추가되었습니다."); setAddForm(emptyPersonnel()); setAddOpen(false); },
    onError: () => toast.error("저장 실패"),
  });

  const updateMut = useMutation({
    mutationFn: () => apiPut(`/api/personnel-history/${editId}`, { ...editForm, previousDepartment: editForm.previousDepartment || null, newDepartment: editForm.newDepartment || null, previousPosition: editForm.previousPosition || null, newPosition: editForm.newPosition || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("수정되었습니다."); setEditId(null); },
    onError: () => toast.error("수정 실패"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/personnel-history/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("삭제되었습니다."); },
    onError: () => toast.error("삭제 실패"),
  });

  const startEdit = (r: PersonnelRecord) => {
    setEditId(r.id);
    setEditForm({ type: r.type, date: r.date, description: r.description, previousDepartment: r.previousDepartment ?? "", newDepartment: r.newDepartment ?? "", previousPosition: r.previousPosition ?? "", newPosition: r.newPosition ?? "" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">인사이력</h3>
        <Button size="sm" variant="outline" onClick={() => { setAddOpen(!addOpen); setEditId(null); }}>
          {addOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {addOpen ? "닫기" : "추가"}
        </Button>
      </div>

      {addOpen && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <PersonnelForm value={addForm} onChange={setAddForm} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>취소</Button>
            <Button size="sm" onClick={() => createMut.mutate()} disabled={!addForm.date || !addForm.description || createMut.isPending}>
              {createMut.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-center py-6 text-sm text-muted-foreground">불러오는 중...</div>
        : data.length === 0 ? <EmptyRow text="등록된 인사이력이 없습니다." />
        : (
          <div className="divide-y divide-border rounded-lg border overflow-hidden">
            {data.map(r => (
              <div key={r.id}>
                {editId === r.id ? (
                  <div className="p-4 bg-muted/20 space-y-3">
                    <PersonnelForm value={editForm} onChange={setEditForm} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>취소</Button>
                      <Button size="sm" onClick={() => updateMut.mutate()} disabled={!editForm.date || !editForm.description || updateMut.isPending}>
                        {updateMut.isPending ? "저장 중..." : "저장"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/30 group">
                    <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                        {(r.previousPosition || r.newPosition) && <span className="text-xs text-muted-foreground">{r.previousPosition} → {r.newPosition}</span>}
                        {(r.previousDepartment || r.newDepartment) && <span className="text-xs text-muted-foreground">{r.previousDepartment} → {r.newDepartment}</span>}
                      </div>
                      <p className="text-sm">{r.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <DeleteButton onDelete={() => deleteMut.mutate(r.id)} disabled={deleteMut.isPending} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 교육이력
// ══════════════════════════════════════════════════════════════════════════════
interface EducationRecord { id: number; name: string; date: string; completed: boolean; notes?: string | null; }
const emptyEdu = () => ({ name: "", date: "", completed: false, notes: "" });

function EduForm({ value, onChange }: { value: ReturnType<typeof emptyEdu>; onChange: (v: ReturnType<typeof emptyEdu>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">교육명 *</Label>
          <Input placeholder="교육명을 입력하세요" value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">교육일 *</Label>
          <Input type="date" value={value.date} onChange={e => onChange({ ...value, date: e.target.value })} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={value.completed} onCheckedChange={v => onChange({ ...value, completed: !!v })} />
            <span className="text-sm">이수 완료</span>
          </label>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">비고</Label>
        <Textarea rows={2} placeholder="비고를 입력하세요" value={value.notes} onChange={e => onChange({ ...value, notes: e.target.value })} />
      </div>
    </div>
  );
}

export function EducationTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyEdu());
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyEdu());

  const qKey = ["education", employeeId];
  const { data = [], isLoading } = useQuery<EducationRecord[]>({ queryKey: qKey, queryFn: () => apiFetch(`/api/employees/${employeeId}/education`) });

  const createMut = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/education`, { ...addForm, notes: addForm.notes || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("추가되었습니다."); setAddForm(emptyEdu()); setAddOpen(false); },
    onError: () => toast.error("저장 실패"),
  });

  const updateMut = useMutation({
    mutationFn: () => apiPut(`/api/education/${editId}`, { ...editForm, notes: editForm.notes || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("수정되었습니다."); setEditId(null); },
    onError: () => toast.error("수정 실패"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/education/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("삭제되었습니다."); },
    onError: () => toast.error("삭제 실패"),
  });

  const startEdit = (r: EducationRecord) => { setEditId(r.id); setEditForm({ name: r.name, date: r.date, completed: r.completed, notes: r.notes ?? "" }); setAddOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">교육이력</h3>
        <Button size="sm" variant="outline" onClick={() => { setAddOpen(!addOpen); setEditId(null); }}>
          {addOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {addOpen ? "닫기" : "추가"}
        </Button>
      </div>

      {addOpen && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <EduForm value={addForm} onChange={setAddForm} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>취소</Button>
            <Button size="sm" onClick={() => createMut.mutate()} disabled={!addForm.name || !addForm.date || createMut.isPending}>
              {createMut.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-center py-6 text-sm text-muted-foreground">불러오는 중...</div>
        : data.length === 0 ? <EmptyRow text="등록된 교육이력이 없습니다." />
        : (
          <div className="divide-y divide-border rounded-lg border overflow-hidden">
            {data.map(r => (
              <div key={r.id}>
                {editId === r.id ? (
                  <div className="p-4 bg-muted/20 space-y-3">
                    <EduForm value={editForm} onChange={setEditForm} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>취소</Button>
                      <Button size="sm" onClick={() => updateMut.mutate()} disabled={!editForm.name || !editForm.date || updateMut.isPending}>
                        {updateMut.isPending ? "저장 중..." : "저장"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/30 group">
                    <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{r.name}</span>
                        <Badge variant={r.completed ? "success" : "warning"} className="text-xs">{r.completed ? "이수" : "예정"}</Badge>
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <DeleteButton onDelete={() => deleteMut.mutate(r.id)} disabled={deleteMut.isPending} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 상벌이력
// ══════════════════════════════════════════════════════════════════════════════
interface RewardRecord { id: number; type: string; date: string; content: string; }
interface DisciplinaryRecord { id: number; disciplinaryType: string; date: string; content: string; }

const REWARD_TYPES = ["포상","표창","감사장","기타"];
const DISC_TYPES = ["주의","경고","감봉","정직","해고","기타"];

const emptyReward = () => ({ type: "포상", date: "", content: "" });
const emptyDisc = () => ({ disciplinaryType: "주의", date: "", content: "" });

export function RewardsTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [rewardAddOpen, setRewardAddOpen] = useState(false);
  const [discAddOpen, setDiscAddOpen] = useState(false);
  const [rewardAdd, setRewardAdd] = useState(emptyReward());
  const [discAdd, setDiscAdd] = useState(emptyDisc());
  const [rewardEdit, setRewardEdit] = useState<{ id: number } & ReturnType<typeof emptyReward> | null>(null);
  const [discEdit, setDiscEdit] = useState<{ id: number } & ReturnType<typeof emptyDisc> | null>(null);

  const rKey = ["rewards", employeeId];
  const dKey = ["disciplinary", employeeId];
  const { data: rewards = [], isLoading: rLoad } = useQuery<RewardRecord[]>({ queryKey: rKey, queryFn: () => apiFetch(`/api/employees/${employeeId}/rewards`) });
  const { data: disciplinary = [], isLoading: dLoad } = useQuery<DisciplinaryRecord[]>({ queryKey: dKey, queryFn: () => apiFetch(`/api/employees/${employeeId}/disciplinary`) });

  const createReward = useMutation({ mutationFn: () => apiPost(`/api/employees/${employeeId}/rewards`, rewardAdd), onSuccess: () => { qc.invalidateQueries({ queryKey: rKey }); toast.success("포상이 추가되었습니다."); setRewardAdd(emptyReward()); setRewardAddOpen(false); }, onError: () => toast.error("저장 실패") });
  const updateReward = useMutation({ mutationFn: () => apiPut(`/api/rewards/${rewardEdit?.id}`, { type: rewardEdit?.type, date: rewardEdit?.date, content: rewardEdit?.content }), onSuccess: () => { qc.invalidateQueries({ queryKey: rKey }); toast.success("수정되었습니다."); setRewardEdit(null); }, onError: () => toast.error("수정 실패") });
  const deleteReward = useMutation({ mutationFn: (id: number) => apiDelete(`/api/rewards/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: rKey }); toast.success("삭제되었습니다."); }, onError: () => toast.error("삭제 실패") });

  const createDisc = useMutation({ mutationFn: () => apiPost(`/api/employees/${employeeId}/disciplinary`, discAdd), onSuccess: () => { qc.invalidateQueries({ queryKey: dKey }); toast.success("징계가 추가되었습니다."); setDiscAdd(emptyDisc()); setDiscAddOpen(false); }, onError: () => toast.error("저장 실패") });
  const updateDisc = useMutation({ mutationFn: () => apiPut(`/api/disciplinary/${discEdit?.id}`, { disciplinaryType: discEdit?.disciplinaryType, date: discEdit?.date, content: discEdit?.content }), onSuccess: () => { qc.invalidateQueries({ queryKey: dKey }); toast.success("수정되었습니다."); setDiscEdit(null); }, onError: () => toast.error("수정 실패") });
  const deleteDisc = useMutation({ mutationFn: (id: number) => apiDelete(`/api/disciplinary/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: dKey }); toast.success("삭제되었습니다."); }, onError: () => toast.error("삭제 실패") });

  return (
    <div className="space-y-6">
      {/* 포상 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-emerald-700">포상 이력</h3>
          <Button size="sm" variant="outline" onClick={() => { setRewardAddOpen(!rewardAddOpen); setRewardEdit(null); }}>
            {rewardAddOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {rewardAddOpen ? "닫기" : "추가"}
          </Button>
        </div>
        {rewardAddOpen && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">구분 *</Label>
                <Select value={rewardAdd.type} onValueChange={v => setRewardAdd(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">일자 *</Label>
                <Input type="date" value={rewardAdd.date} onChange={e => setRewardAdd(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">내용 *</Label>
              <Textarea rows={2} placeholder="포상 내용을 입력하세요" value={rewardAdd.content} onChange={e => setRewardAdd(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setRewardAddOpen(false)}>취소</Button>
              <Button size="sm" onClick={() => createReward.mutate()} disabled={!rewardAdd.date || !rewardAdd.content || createReward.isPending}>{createReward.isPending ? "저장 중..." : "저장"}</Button>
            </div>
          </div>
        )}
        {rLoad ? <div className="text-center py-4 text-sm text-muted-foreground">불러오는 중...</div>
          : rewards.length === 0 ? <EmptyRow text="등록된 포상 이력이 없습니다." />
          : (
            <div className="divide-y divide-border rounded-lg border overflow-hidden">
              {rewards.map(r => (
                <div key={r.id}>
                  {rewardEdit?.id === r.id ? (
                    <div className="p-4 bg-muted/20 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">구분</Label>
                          <Select value={rewardEdit.type} onValueChange={v => setRewardEdit(e => e ? { ...e, type: v } : e)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{REWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">일자</Label>
                          <Input type="date" value={rewardEdit.date} onChange={e => setRewardEdit(f => f ? { ...f, date: e.target.value } : f)} />
                        </div>
                      </div>
                      <Textarea rows={2} value={rewardEdit.content} onChange={e => setRewardEdit(f => f ? { ...f, content: e.target.value } : f)} />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setRewardEdit(null)}>취소</Button>
                        <Button size="sm" onClick={() => updateReward.mutate()} disabled={updateReward.isPending}>{updateReward.isPending ? "저장 중..." : "저장"}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 hover:bg-muted/30 group">
                      <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
                      <div className="flex-1"><Badge variant="success" className="text-xs mb-1">{r.type}</Badge><p className="text-sm">{r.content}</p></div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setRewardEdit({ ...r }); setRewardAddOpen(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <DeleteButton onDelete={() => deleteReward.mutate(r.id)} disabled={deleteReward.isPending} />
                      </div>
                    </div>
                  )}
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
          <Button size="sm" variant="outline" onClick={() => { setDiscAddOpen(!discAddOpen); setDiscEdit(null); }}>
            {discAddOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {discAddOpen ? "닫기" : "추가"}
          </Button>
        </div>
        {discAddOpen && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">징계 유형 *</Label>
                <Select value={discAdd.disciplinaryType} onValueChange={v => setDiscAdd(f => ({ ...f, disciplinaryType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DISC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">일자 *</Label>
                <Input type="date" value={discAdd.date} onChange={e => setDiscAdd(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">내용 *</Label>
              <Textarea rows={2} placeholder="징계 내용을 입력하세요" value={discAdd.content} onChange={e => setDiscAdd(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setDiscAddOpen(false)}>취소</Button>
              <Button size="sm" variant="destructive" onClick={() => createDisc.mutate()} disabled={!discAdd.date || !discAdd.content || createDisc.isPending}>{createDisc.isPending ? "저장 중..." : "저장"}</Button>
            </div>
          </div>
        )}
        {dLoad ? <div className="text-center py-4 text-sm text-muted-foreground">불러오는 중...</div>
          : disciplinary.length === 0 ? <EmptyRow text="등록된 징계 이력이 없습니다." />
          : (
            <div className="divide-y divide-border rounded-lg border overflow-hidden">
              {disciplinary.map(r => (
                <div key={r.id}>
                  {discEdit?.id === r.id ? (
                    <div className="p-4 bg-muted/20 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">징계 유형</Label>
                          <Select value={discEdit.disciplinaryType} onValueChange={v => setDiscEdit(e => e ? { ...e, disciplinaryType: v } : e)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{DISC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">일자</Label>
                          <Input type="date" value={discEdit.date} onChange={e => setDiscEdit(f => f ? { ...f, date: e.target.value } : f)} />
                        </div>
                      </div>
                      <Textarea rows={2} value={discEdit.content} onChange={e => setDiscEdit(f => f ? { ...f, content: e.target.value } : f)} />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDiscEdit(null)}>취소</Button>
                        <Button size="sm" onClick={() => updateDisc.mutate()} disabled={updateDisc.isPending}>{updateDisc.isPending ? "저장 중..." : "저장"}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 hover:bg-muted/30 group">
                      <div className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{r.date}</div>
                      <div className="flex-1"><Badge variant="destructive" className="text-xs mb-1">{r.disciplinaryType}</Badge><p className="text-sm">{r.content}</p></div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setDiscEdit({ ...r }); setDiscAddOpen(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <DeleteButton onDelete={() => deleteDisc.mutate(r.id)} disabled={deleteDisc.isPending} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 면담기록
// ══════════════════════════════════════════════════════════════════════════════
interface InterviewRecord { id: number; date: string; content: string; interviewer?: string | null; }
const emptyInterview = () => ({ date: "", content: "", interviewer: "" });

export function InterviewsTab({ employeeId }: { employeeId: number }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyInterview());
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyInterview());

  const qKey = ["interviews", employeeId];
  const { data = [], isLoading } = useQuery<InterviewRecord[]>({ queryKey: qKey, queryFn: () => apiFetch(`/api/employees/${employeeId}/interviews`) });

  const createMut = useMutation({
    mutationFn: () => apiPost(`/api/employees/${employeeId}/interviews`, { ...addForm, interviewer: addForm.interviewer || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("추가되었습니다."); setAddForm(emptyInterview()); setAddOpen(false); },
    onError: () => toast.error("저장 실패"),
  });

  const updateMut = useMutation({
    mutationFn: () => apiPut(`/api/interviews/${editId}`, { ...editForm, interviewer: editForm.interviewer || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("수정되었습니다."); setEditId(null); },
    onError: () => toast.error("수정 실패"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/interviews/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast.success("삭제되었습니다."); },
    onError: () => toast.error("삭제 실패"),
  });

  const startEdit = (r: InterviewRecord) => { setEditId(r.id); setEditForm({ date: r.date, content: r.content, interviewer: r.interviewer ?? "" }); setAddOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">면담기록</h3>
        <Button size="sm" variant="outline" onClick={() => { setAddOpen(!addOpen); setEditId(null); }}>
          {addOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {addOpen ? "닫기" : "추가"}
        </Button>
      </div>

      {addOpen && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">면담일 *</Label>
              <Input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">면담자</Label>
              <Input placeholder="예: 인사팀장" value={addForm.interviewer} onChange={e => setAddForm(f => ({ ...f, interviewer: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">면담 내용 *</Label>
            <Textarea rows={3} placeholder="면담 내용을 입력하세요" value={addForm.content} onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>취소</Button>
            <Button size="sm" onClick={() => createMut.mutate()} disabled={!addForm.date || !addForm.content || createMut.isPending}>{createMut.isPending ? "저장 중..." : "저장"}</Button>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-center py-6 text-sm text-muted-foreground">불러오는 중...</div>
        : data.length === 0 ? <EmptyRow text="등록된 면담기록이 없습니다." />
        : (
          <div className="space-y-3">
            {data.map(r => (
              <div key={r.id}>
                {editId === r.id ? (
                  <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">면담일</Label>
                        <Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">면담자</Label>
                        <Input value={editForm.interviewer} onChange={e => setEditForm(f => ({ ...f, interviewer: e.target.value }))} />
                      </div>
                    </div>
                    <Textarea rows={3} value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>취소</Button>
                      <Button size="sm" onClick={() => updateMut.mutate()} disabled={!editForm.date || !editForm.content || updateMut.isPending}>{updateMut.isPending ? "저장 중..." : "저장"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 hover:bg-muted/30 space-y-2 group relative">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.date}</span>
                      <div className="flex items-center gap-2">
                        {r.interviewer && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">면담자: {r.interviewer}</span>}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <DeleteButton onDelete={() => deleteMut.mutate(r.id)} disabled={deleteMut.isPending} />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{r.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
