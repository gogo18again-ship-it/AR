import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, ...props }: React.HTMLAttributes<SVGElement>) {
  return (
    <Loader2 
      className={cn("h-4 w-4 animate-spin text-muted-foreground", className)} 
      {...props} 
    />
  );
}

export function LoadingState({ text = "데이터를 불러오는 중입니다..." }: { text?: string }) {
  return (
    <div className="flex w-full items-center justify-center h-48 flex-col gap-4">
      <Spinner className="h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground font-medium">{text}</p>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title = "데이터가 없습니다", 
  description = "조건에 맞는 결과를 찾을 수 없습니다." 
}: { 
  icon?: React.ElementType, 
  title?: string, 
  description?: string 
}) {
  return (
    <div className="flex w-full items-center justify-center flex-col py-16 px-4 text-center bg-muted/20 border border-dashed rounded-lg">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/50 mb-4" />}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>
    </div>
  );
}
