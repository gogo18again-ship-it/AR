import { useState } from "react";
import { useListDocuments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { Search, Upload, FileText, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Documents() {
  const [category, setCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: documents, isLoading } = useListDocuments({ 
    category: category !== "all" ? category : undefined,
    employeeName: searchTerm || undefined
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">문서 관리</h1>
          <p className="text-muted-foreground mt-1">기업 및 임직원 관련 모든 문서를 통합 관리합니다.</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          문서 업로드
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체보기</SelectItem>
              <SelectItem value="근로계약서">근로계약서</SelectItem>
              <SelectItem value="자격증">자격증</SelectItem>
              <SelectItem value="교육자료">교육자료</SelectItem>
              <SelectItem value="ISO">ISO</SelectItem>
              <SelectItem value="ESG">ESG</SelectItem>
              <SelectItem value="징계문서">징계문서</SelectItem>
              <SelectItem value="기타">기타</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="문서명, 직원명 검색" 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState text="문서를 불러오는 중입니다..." />
        ) : !documents || documents.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title="문서가 없습니다"
            description="조건에 맞는 문서가 없거나 아직 등록되지 않았습니다."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">카테고리</TableHead>
                <TableHead>문서명</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>관련 직원</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-[100px] text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="group">
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{doc.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">{doc.fileName}</TableCell>
                  <TableCell>{doc.employeeName || '-'}</TableCell>
                  <TableCell>{format(new Date(doc.uploadedAt), 'yyyy-MM-dd')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
