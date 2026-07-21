import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateEmployee } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  employeeNumber: z.string().min(1, "사번을 입력해주세요."),
  name: z.string().min(1, "성명을 입력해주세요."),
  department: z.string().min(1, "부서를 입력해주세요."),
  position: z.string().min(1, "직급을 입력해주세요."),
  hireDate: z.string().min(1, "입사일을 입력해주세요."),
  phone: z.string().optional(),
  email: z.string().email("유효한 이메일 형식이 아닙니다.").optional().or(z.literal("")),
  isForeigner: z.boolean().default(false),
  visaType: z.string().optional(),
});

export default function EmployeeNew() {
  const [, setLocation] = useLocation();
  const createEmployee = useCreateEmployee();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeNumber: "",
      name: "",
      department: "",
      position: "",
      hireDate: new Date().toISOString().split('T')[0],
      phone: "",
      email: "",
      isForeigner: false,
      visaType: "",
    },
  });

  const isForeigner = form.watch("isForeigner");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createEmployee.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          toast.success("직원이 성공적으로 등록되었습니다.");
          setLocation(`/employees/${data.id}`);
        },
        onError: () => {
          toast.error("직원 등록에 실패했습니다.");
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/employees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">직원 등록</h1>
            <p className="text-muted-foreground mt-1">새로운 직원의 기본 정보를 입력합니다.</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>성명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사번 *</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부서 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="부서 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="경영지원본부">경영지원본부</SelectItem>
                        <SelectItem value="인사총무팀">인사총무팀</SelectItem>
                        <SelectItem value="인사팀">인사팀</SelectItem>
                        <SelectItem value="생산팀">생산팀</SelectItem>
                        <SelectItem value="품질관리팀">품질관리팀</SelectItem>
                        <SelectItem value="품질팀">품질팀</SelectItem>
                        <SelectItem value="영업팀">영업팀</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>직급 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="직급 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="사원">사원</SelectItem>
                        <SelectItem value="대리">대리</SelectItem>
                        <SelectItem value="과장">과장</SelectItem>
                        <SelectItem value="팀장">팀장</SelectItem>
                        <SelectItem value="차장">차장</SelectItem>
                        <SelectItem value="부장">부장</SelectItem>
                        <SelectItem value="임원">임원</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>입사일 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="010-0000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">외국인 근로자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="isForeigner"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>외국인 근로자입니다</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        체크 시 비자 정보를 추가로 입력할 수 있습니다.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              {isForeigner && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                  <FormField
                    control={form.control}
                    name="visaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비자 종류</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="비자 종류 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="E-9">E-9 (비전문취업)</SelectItem>
                            <SelectItem value="H-2">H-2 (방문취업)</SelectItem>
                            <SelectItem value="F-4">F-4 (재외동포)</SelectItem>
                            <SelectItem value="F-5">F-5 (영주)</SelectItem>
                            <SelectItem value="F-6">F-6 (결혼이민)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/employees")}>취소</Button>
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending ? "저장 중..." : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장하기
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
