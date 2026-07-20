import { useGetDashboardStats, useListVisaSchedules, useListEducationSchedules } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserX, FileWarning, BookOpen, ShieldAlert, FileCheck2, AlertCircle } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: visaSchedules, isLoading: visaLoading } = useListVisaSchedules();
  const { data: eduSchedules, isLoading: eduLoading } = useListEducationSchedules();

  if (statsLoading) return <LoadingState text="대시보드 통계를 불러오는 중입니다..." />;

  const statCards = [
    { title: "총 직원 수", value: stats?.totalEmployees || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "외국인 근로자", value: stats?.foreignEmployees || 0, icon: UserX, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "비자 만료 예정", value: stats?.visaExpiringSoon || 0, icon: FileWarning, color: "text-red-600", bg: "bg-red-100" },
    { title: "교육 예정", value: stats?.educationUpcoming || 0, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "보험 갱신 예정", value: stats?.insuranceRenewalSoon || 0, icon: ShieldAlert, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "ISO 일정", value: stats?.isoScheduleCount || 0, icon: FileCheck2, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <p className="text-muted-foreground mt-1">인사·총무 주요 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1 text-foreground">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              비자 만료 임박 직원
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {visaLoading ? (
              <LoadingState />
            ) : !visaSchedules || visaSchedules.length === 0 ? (
              <EmptyState title="만료 예정 비자 없음" description="90일 이내 만료되는 비자가 없습니다." icon={FileCheck2} />
            ) : (
              <div className="space-y-3">
                {visaSchedules.slice(0, 5).map((visa, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{visa.employeeName} <span className="text-muted-foreground font-normal ml-1">({visa.department})</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{visa.visaType} • 만료일: {format(new Date(visa.expiryDate), 'yyyy-MM-dd')}</p>
                    </div>
                    <Badge variant={visa.urgency === 'danger' ? 'destructive' : visa.urgency === 'warning' ? 'warning' : 'outline'}>
                      D-{visa.daysUntilExpiry}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-600" />
              다가오는 교육 일정
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {eduLoading ? (
              <LoadingState />
            ) : !eduSchedules || eduSchedules.length === 0 ? (
              <EmptyState title="예정된 교육 없음" description="30일 이내 예정된 교육 일정이 없습니다." icon={FileCheck2} />
            ) : (
              <div className="space-y-3">
                {eduSchedules.slice(0, 5).map((edu, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{edu.educationName}</p>
                      <p className="text-xs text-muted-foreground mt-1">대상: {edu.employeeName} ({edu.department}) • 일정: {format(new Date(edu.scheduledDate), 'yyyy-MM-dd')}</p>
                    </div>
                    <Badge variant={edu.urgency === 'danger' ? 'destructive' : edu.urgency === 'warning' ? 'warning' : 'outline'}>
                      D-{edu.daysUntil}
                    </Badge>
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
