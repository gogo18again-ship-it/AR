import { useState } from "react";
import { useListEmployees } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { Search, Plus, UserPlus, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Employees() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Custom hook usage
  const { data: employees, isLoading } = useListEmployees({ name: searchTerm || undefined });

  const filteredEmployees = employees?.filter(emp => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term) ||
      emp.position.toLowerCase().includes(term) ||
      emp.employeeNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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

      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="성명, 부서, 직급, 사번 검색" 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            상세 필터
          </Button>
        </div>

        {isLoading ? (
          <LoadingState text="직원 데이터를 불러오는 중입니다..." />
        ) : !filteredEmployees || filteredEmployees.length === 0 ? (
          <EmptyState 
            icon={UsersIcon}
            title="직원이 없습니다"
            description="검색 조건에 맞는 직원이 없거나 아직 등록되지 않았습니다."
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
                <TableHead>외국인 여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow 
                  key={emp.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setLocation(`/employees/${emp.id}`)}
                >
                  <TableCell className="font-medium text-muted-foreground">{emp.employeeNumber}</TableCell>
                  <TableCell className="font-semibold">{emp.name}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{format(new Date(emp.hireDate), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{emp.phone || '-'}</TableCell>
                  <TableCell>
                    {emp.isForeigner ? (
                      <Badge variant="info" className="font-normal">
                        외국인 {emp.visaType && `(${emp.visaType})`}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">내국인</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
  )
}