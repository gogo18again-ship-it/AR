import { useState } from "react";
import { useListEmployees } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { Search, UserPlus } from "lucide-react";
import { format } from "date-fns";

type Status = "재직" | "휴직" | "퇴사";

const STATUS_TABS: { value: Status; label: string }[] = [
  { value: "재직", label: "재직자" },
  { value: "휴직", label: "휴직자" },
  { value: "퇴사", label: "퇴사자" },
];

const STATUS_BADGE: Record<Status, { variant: "success" | "warning" | "destructive"; label: string }> = {
  재직: { variant: "success", label: "재직" },
  휴직: { variant: "warning", label: "휴직" },
  퇴사: { variant: "destructive", label: "퇴사" },
};

export default function Employees() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState<Status>("재직");

  // 탭별 카운트용 — 전체 목록을 한 번만 가져옴
  const { data: allEmployees } = useListEmployees({});
  const counts: Record<Status, number> = {
    재직: allEmployees?.filter((e) => (e.status ?? "재직") === "재직").length ?? 0,
    휴직: allEmployees?.filter((e) => e.status === "휴직").length ?? 0,
    퇴사: allEmployees?.filter((e) => e.status === "퇴사").length ?? 0,
  };

  const { data: employees, isLoading } = useListEmployees({ status: activeStatus });

  const filtered = employees?.filter((emp) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(t) ||
      emp.department.toLowerCase().includes(t) ||
      emp.position.toLowerCase().includes(t) ||
      emp.employeeNumber.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">직원 목록</h1>
          <p className="text-muted-foreground mt-1">전체 임직원을 조회하고 관리합니다.</p>
        </div>
        <Button onClick={() => setLocation("/employees/new")}>
          <UserPlus className="h-4 w-4 mr-2" />
          직원 등록
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as Status)}>
        <TabsList className="bg-muted/60 h-10">
          {STATUS_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              {label}
              <span className="text-xs bg-background/80 rounded-full px-1.5 py-0.5 font-semibold tabular-nums">
                {counts[value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table Card */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="성명, 부서, 직급, 사번 검색"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState text="직원 데이터를 불러오는 중입니다..." />
        ) : !filtered || filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={`${activeStatus}자가 없습니다`}
            description={
              searchTerm
                ? "검색 조건에 맞는 직원이 없습니다."
                : `현재 ${activeStatus} 상태의 직원이 없습니다.`
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">사번</TableHead>
                <TableHead>성명</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>입사일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>구분</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => {
                const status = (emp.status ?? "재직") as Status;
                const badge = STATUS_BADGE[status];
                return (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setLocation(`/employees/${emp.id}`)}
                  >
                    <TableCell className="font-medium text-muted-foreground">{emp.employeeNumber}</TableCell>
                    <TableCell className="font-semibold">{emp.name}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{format(new Date(emp.hireDate), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{emp.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        {emp.isForeigner && (
                          <Badge variant="info" className="font-normal">
                            외국인 {emp.visaType && `(${emp.visaType})`}
                          </Badge>
                        )}
                        {status !== "재직" && (
                          <Badge variant={badge.variant} className="font-normal">
                            {badge.label}
                          </Badge>
                        )}
                        {!emp.isForeigner && status === "재직" && (
                          <span className="text-muted-foreground text-sm">내국인</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
