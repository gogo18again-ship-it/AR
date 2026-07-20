import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileWarning, BookOpen, ShieldAlert, FileCheck2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useListVisaSchedules, useListEducationSchedules, useListIsoSchedules, useListInsuranceSchedules } from "@workspace/api-client-react";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Schedules() {
  const { data: visaSchedules, isLoading: visaLoading } = useListVisaSchedules();
  const { data: eduSchedules, isLoading: eduLoading } = useListEducationSchedules();
  const { data: isoSchedules, isLoading: isoLoading } = useListIsoSchedules();
  const { data: insSchedules, isLoading: insLoading } = useListInsuranceSchedules();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">일정 관리</h1>
          <p className="text-muted-foreground mt-1">기업 운영 및 인사 관련 주요 일정을 관리합니다.</p>
        </div>
      </div>

      <Tabs defaultValue="visa" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="visa" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 rounded-lg border border-border shadow-sm flex gap-2">
            <FileWarning className="w-4 h-4" /> <span>비자 관리</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 rounded-lg border border-border shadow-sm flex gap-2">
            <BookOpen className="w-4 h-4" /> <span>교육 관리</span>
          </TabsTrigger>
          <TabsTrigger value="iso" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 rounded-lg border border-border shadow-sm flex gap-2">
            <FileCheck2 className="w-4 h-4" /> <span>ISO 일정</span>
          </TabsTrigger>
          <TabsTrigger value="insurance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 rounded-lg border border-border shadow-sm flex gap-2">
            <ShieldAlert className="w-4 h-4" /> <span>보험 갱신</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-card rounded-lg border border-border shadow-sm p-4">
          <TabsContent value="visa" className="m-0 focus-visible:outline-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">외국인 비자 만료 일정</h3>
            </div>
            
            {visaLoading ? <LoadingState /> : !visaSchedules || visaSchedules.length === 0 ? (
              <EmptyState icon={FileWarning} title="비자 일정 없음" description="관리 대상 비자가 없습니다." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>직원명</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>비자 종류</TableHead>
                    <TableHead>만료일</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visaSchedules.map((visa, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{visa.employeeName}</TableCell>
                      <TableCell>{visa.department}</TableCell>
                      <TableCell>{visa.visaType}</TableCell>
                      <TableCell>{format(new Date(visa.expiryDate), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        <Badge variant={visa.urgency === 'danger' ? 'destructive' : visa.urgency === 'warning' ? 'warning' : 'outline'}>
                          D-{visa.daysUntilExpiry}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="education" className="m-0 focus-visible:outline-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">예정된 교육</h3>
            </div>
            
            {eduLoading ? <LoadingState /> : !eduSchedules || eduSchedules.length === 0 ? (
              <EmptyState icon={BookOpen} title="교육 일정 없음" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>교육명</TableHead>
                    <TableHead>대상자</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>일정</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eduSchedules.map((edu, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{edu.educationName}</TableCell>
                      <TableCell>{edu.employeeName}</TableCell>
                      <TableCell>{edu.department}</TableCell>
                      <TableCell>{format(new Date(edu.scheduledDate), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        <Badge variant={edu.urgency === 'danger' ? 'destructive' : edu.urgency === 'warning' ? 'warning' : 'outline'}>
                          D-{edu.daysUntil}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="iso" className="m-0 focus-visible:outline-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ISO 관련 일정</h3>
              <Button size="sm">일정 등록</Button>
            </div>
            {isoLoading ? <LoadingState /> : !isoSchedules || isoSchedules.length === 0 ? (
              <EmptyState icon={FileCheck2} title="ISO 일정 없음" />
            ) : (
              <div className="space-y-4">
                {isoSchedules.map((iso, i) => (
                  <Card key={i} className="bg-muted/20">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{iso.type}</Badge>
                          <h4 className="font-semibold">{iso.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <CalendarIcon className="w-3 h-3" /> {format(new Date(iso.scheduledDate), 'yyyy-MM-dd')}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">수정</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insurance" className="m-0 focus-visible:outline-none">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">보험 갱신 일정</h3>
              <Button size="sm">갱신 등록</Button>
            </div>
            
            {insLoading ? <LoadingState /> : !insSchedules || insSchedules.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="보험 갱신 일정 없음" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>보험명</TableHead>
                    <TableHead>보험사</TableHead>
                    <TableHead>갱신일</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insSchedules.map((ins, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{ins.insuranceName}</TableCell>
                      <TableCell>{ins.insurer || '-'}</TableCell>
                      <TableCell>{format(new Date(ins.renewalDate), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>{ins.amount ? `${ins.amount.toLocaleString()}원` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={ins.urgency === 'danger' ? 'destructive' : ins.urgency === 'warning' ? 'warning' : 'outline'}>
                          D-{ins.daysUntilRenewal}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
