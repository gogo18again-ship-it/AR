import { useParams, useLocation } from "wouter";
import { useGetEmployee, useGetEmployeeTimeline, getGetEmployeeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/states";
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Building, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { formatDuration } from "@/lib/format";

// Employee 360 View Component
export default function EmployeeDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: employee, isLoading } = useGetEmployee(id, { 
    query: { enabled: !!id, queryKey: getGetEmployeeQueryKey(id) } 
  });
  
  const { data: timeline } = useGetEmployeeTimeline(id, {
    query: { enabled: !!id }
  });

  if (isLoading) return <LoadingState text="직원 상세 정보를 불러오는 중입니다..." />;
  if (!employee) return <div>직원을 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/employees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">직원 상세</h1>
            <p className="text-muted-foreground mt-1">Employee 360 View</p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          정보 수정
        </Button>
      </div>

      {/* Top Card - Profile Overview */}
      <Card className="border-border shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar Placeholder */}
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

      {/* Tabs Section */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Tabs defaultValue="basic" className="w-full">
          <div className="border-b border-border overflow-x-auto">
            <TabsList className="h-12 w-full justify-start bg-transparent p-0 px-2 min-w-max">
              <TabsTrigger value="basic" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium">기본정보</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium">인사이력</TabsTrigger>
              <TabsTrigger value="education" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium">교육이력</TabsTrigger>
              <TabsTrigger value="rewards" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium">상벌이력</TabsTrigger>
              <TabsTrigger value="interviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium">면담기록</TabsTrigger>
              {employee.isForeigner && (
                <TabsTrigger value="foreigner" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium">외국인정보</TabsTrigger>
              )}
              <TabsTrigger value="attachments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 font-medium">첨부파일</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="basic" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">인적사항</h3>
                  <div className="grid grid-cols-3 gap-y-4 text-sm">
                    <div className="text-muted-foreground">생년월일</div>
                    <div className="col-span-2 font-medium">{employee.birthDate ? format(new Date(employee.birthDate), 'yyyy-MM-dd') : '-'}</div>
                    
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

            <TabsContent value="history" className="m-0 focus-visible:outline-none">
              <div className="text-center py-10 text-muted-foreground">
                <p>인사이력 탭 내용 (작업 중)</p>
              </div>
            </TabsContent>
            
            {/* Additional Tab contents will be implemented in subsequent requests to manage file size */}
          </div>
        </Tabs>
      </div>

      {/* Timeline Section */}
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
                {timeline.map((event, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ${
                      event.category === '인사' ? 'bg-blue-500' :
                      event.category === '교육' ? 'bg-amber-500' :
                      event.category === '포상' ? 'bg-emerald-500' :
                      event.category === '징계' ? 'bg-red-500' : 'bg-primary'
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
