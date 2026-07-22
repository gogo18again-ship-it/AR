import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetEmployee, useGetEmployeeTimeline, getGetEmployeeQueryKey, getGetEmployeeTimelineQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/states";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Building, Briefcase, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { formatDuration } from "@/lib/format";
import { EmployeeStatusDialog } from "@/components/employee-status-dialog";
import {
  PersonnelHistoryTab,
  EducationTab,
  RewardsTab,
  InterviewsTab,
} from "@/components/employee-tab-contents";

type Status = "재직" | "휴직" | "퇴사";

const STATUS_BADGE: Record<Status, { variant: "success" | "warning" | "destructive" | "secondary"; label: string }> = {
  재직: { variant: "success",     label: "재직 중" },
  휴직: { variant: "warning",     label: "휴직 중" },
  퇴사: { variant: "destructive", label: "퇴사"    },
};

const TAB_CLASS = "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium";

export default function EmployeeDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const { data: employee, isLoading } = useGetEmployee(id, {
    query: { enabled: !!id, queryKey: getGetEmployeeQueryKey(id) },
  });
  const { data: timeline } = useGetEmployeeTimeline(id, {
    query: { enabled: !!id, queryKey: getGetEmployeeTimelineQueryKey(id) },
  });

  if (isLoading) return <LoadingState text="직원 상세 정보를 불러오는 중입니다..." />;
  if (!employee) return <div>직원을 찾을 수 없습니다.</div>;

  const emp = employee as typeof employee & { status?: string; statusNote?: string };
  const status = (emp.status ?? "재직") as Status;
  const badge = STATUS_BADGE[status];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* 휴직·퇴사 배너 */}
      {status !== "재직" && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
          status === "휴직"
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <RefreshCw className="h-4 w-4" />
          현재 <span className="font-bold">{status}</span> 상태입니다.
          {emp.statusNote && (
            <span className="text-xs opacity-75 ml-1">— {emp.statusNote}</span>
          )}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/employees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">직원 상세</h1>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">Employee 360 View</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStatusDialogOpen(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            상태 변경
          </Button>
          <Button variant="outline" onClick={() => setLocation(`/employees/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            정보 수정
          </Button>
        </div>
      </div>

      <EmployeeStatusDialog
        employeeId={id}
        currentStatus={status}
        employeeName={employee.name}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />

      {/* 프로필 카드 */}
      <Card className="border-border shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground border-4 border-background shadow-sm shrink-0">
              {employee.name.substring(0, 1)}
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <Badge variant="secondary" className="text-sm px-2 py-0.5">{employee.employeeNumber}</Badge>
                {employee.isForeigner && (
                  <Badge variant="info">외국인 {employee.visaType && `(${employee.visaType})`}</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-6">
                <div className="flex items-center text-sm">
                  <Building className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span className="font-medium">{employee.department}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span>{employee.position}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span>{employee.phone || '-'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span className="truncate">{employee.email || '-'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span>입사일: {format(new Date(employee.hireDate), 'yyyy-MM-dd')}</span>
                </div>
                <div className="flex items-center text-sm text-primary font-medium">
                  <span className="w-4 h-4 mr-2 inline-block shrink-0">⌛</span>
                  <span>근속기간: {formatDuration(employee.hireDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Tabs defaultValue="basic" className="w-full">
          <div className="border-b border-border overflow-x-auto">
            <TabsList className="h-12 w-full justify-start bg-transparent p-0 px-2 min-w-max">
              <TabsTrigger value="basic"       className={TAB_CLASS}>기본정보</TabsTrigger>
              <TabsTrigger value="history"     className={TAB_CLASS}>인사이력</TabsTrigger>
              <TabsTrigger value="education"   className={TAB_CLASS}>교육이력</TabsTrigger>
              <TabsTrigger value="rewards"     className={TAB_CLASS}>상벌이력</TabsTrigger>
              <TabsTrigger value="interviews"  className={TAB_CLASS}>면담기록</TabsTrigger>
              {employee.isForeigner && (
                <TabsTrigger value="foreigner" className={TAB_CLASS}>외국인정보</TabsTrigger>
              )}
              <TabsTrigger value="attachments" className={TAB_CLASS}>첨부파일</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* 기본정보 */}
            <TabsContent value="basic" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">인적사항</h3>
                  <div className="grid grid-cols-3 gap-y-4 text-sm">
                    <div className="text-muted-foreground">생년월일</div>
                    <div className="col-span-2 font-medium">
                      {employee.birthDate ? format(new Date(employee.birthDate), 'yyyy-MM-dd') : '-'}
                    </div>
                    <div className="text-muted-foreground">주소</div>
                    <div className="col-span-2 font-medium">{employee.address || '-'}</div>
                    <div className="text-muted-foreground">국적</div>
                    <div className="col-span-2 font-medium">{employee.nationality || '대한민국'}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">기타사항</h3>
                  <div className="text-sm">
                    <div className="text-muted-foreground mb-2">비고</div>
                    <div className="bg-muted/30 p-3 rounded-md min-h-[100px] font-medium whitespace-pre-wrap">
                      {employee.notes || '등록된 비고 내용이 없습니다.'}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 인사이력 */}
            <TabsContent value="history" className="m-0 focus-visible:outline-none">
              <PersonnelHistoryTab employeeId={id} />
            </TabsContent>

            {/* 교육이력 */}
            <TabsContent value="education" className="m-0 focus-visible:outline-none">
              <EducationTab employeeId={id} />
            </TabsContent>

            {/* 상벌이력 */}
            <TabsContent value="rewards" className="m-0 focus-visible:outline-none">
              <RewardsTab employeeId={id} />
            </TabsContent>

            {/* 면담기록 */}
            <TabsContent value="interviews" className="m-0 focus-visible:outline-none">
              <InterviewsTab employeeId={id} />
            </TabsContent>

            {/* 외국인정보 */}
            {employee.isForeigner && (
              <TabsContent value="foreigner" className="m-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">비자 정보</h3>
                    <div className="grid grid-cols-3 gap-y-4 text-sm">
                      <div className="text-muted-foreground">비자 종류</div>
                      <div className="col-span-2 font-medium">{employee.visaType || '-'}</div>
                      <div className="text-muted-foreground">비자 만료일</div>
                      <div className="col-span-2 font-medium">{employee.visaExpiryDate || '-'}</div>
                      <div className="text-muted-foreground">여권 만료일</div>
                      <div className="col-span-2 font-medium">{employee.passportExpiryDate || '-'}</div>
                      <div className="text-muted-foreground">외국인등록증</div>
                      <div className="col-span-2 font-medium">{employee.alienRegistrationExpiryDate || '-'}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* 첨부파일 */}
            <TabsContent value="attachments" className="m-0 focus-visible:outline-none">
              <div className="text-center py-8 text-muted-foreground text-sm">
                첨부파일 기능은 준비 중입니다.
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* 타임라인 */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 px-2 text-foreground">이력 타임라인</h3>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            {!timeline || timeline.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                기록된 타임라인이 없습니다.
              </div>
            ) : (
              <div className="relative border-l-2 border-muted ml-3 space-y-6">
                {[...timeline].reverse().map((event, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ${
                      event.category === '인사이력' ? 'bg-blue-500' :
                      event.category === '교육이력' ? 'bg-amber-500' :
                      event.category === '상벌이력' ? 'bg-emerald-500' :
                      event.category === '징계이력' ? 'bg-red-500' :
                      event.category === '면담기록' ? 'bg-purple-500' : 'bg-primary'
                    }`} />
                    <div className="text-xs text-muted-foreground font-medium mb-1">
                      {format(new Date(event.date), 'yyyy-MM-dd')}
                    </div>
                    <div className="font-medium bg-muted/20 inline-block px-2 py-0.5 rounded text-sm mb-1 border border-border">
                      {event.type}
                    </div>
                    <p className="text-sm text-foreground">{event.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
