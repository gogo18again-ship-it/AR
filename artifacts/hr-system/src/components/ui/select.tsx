import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  // Portal을 제거하고 인라인으로 렌더링합니다.
  // SelectPrimitive.Portal이 document.body에 Portal을 마운트하면,
  // Select 닫힘 애니메이션(data-[state=closed]:animate-out) 진행 중에
  // 저장 버튼을 클릭하면 React 18 concurrent 모드에서 Portal DOM 정리와
  // mutation 상태 업데이트가 같은 커밋 단계에 배치되어
  // "removeChild: node is not a child" 오류가 발생합니다.
  // Portal 없이 인라인으로 렌더링하면 React가 가상 DOM 트리 내에서
  // 정상적으로 마운트/언마운트를 관리하므로 이 충돌이 사라집니다.
  // (Card/CardContent에 overflow:hidden 없으므로 드롭다운 표시에 문제 없음)
  <SelectPrimitive.Content
    ref={ref}
    className={cn(
      // ─── 애니메이션 클래스 전체 제거 (열기·닫기·슬라이드 모두) ──────────────
      //
      // 근본 원인 (Radix react-presence + react-select 소스 추적으로 확인):
      //
      // 1. 열기 애니메이션(data-[state=open]:animate-in 등)이 있으면
      //    animationstart 이벤트가 발생하고, Presence의 handleAnimationStart
      //    콜백이 prevAnimationNameRef.current = "enter"(또는 실제 keyframe 이름)로 업데이트.
      //
      // 2. 사용자가 항목을 빠르게 선택하면 context.open=false → present=false.
      //    이때 Presence useLayoutEffect 내에서:
      //      prevAnimationName("enter") ≠ currentAnimationName("none")
      //      → isAnimating=true → send("ANIMATION_OUT") → unmountSuspended 상태.
      //
      // 3. unmountSuspended에서 Presence는 SelectContentImpl 대신
      //    SelectContentFragment를 렌더링 (react-select 소스 line 357, 361).
      //    SelectContentFragment({ fragment }): fragment가 있으면 ReactDOM.createPortal로
      //    children을 별도 DOM 노드에 렌더링함.
      //
      // 4. SelectContentImpl→SelectContentFragment 전환 시:
      //    - SelectContentImpl 언마운트 → 내부 SelectItem 언마운트
      //      → Portal cleanup: context.valueNode(=SelectTrigger의 <button>)에서 removeChild
      //    - 동시에 SelectContentFragment 마운트 → Portal 재생성: valueNode에 insertBefore
      //    이 두 Portal 조작이 React 19 concurrent 모드 프로덕션 빌드에서 동시에
      //    커밋되면 removeChild/insertBefore 실패 → ErrorBoundary 발동.
      //
      // 5. component stack에 "button"이 표시되는 이유:
      //    SelectTrigger가 <button role="combobox">로 렌더링되고,
      //    context.valueNode(portale 대상)가 이 button 내부의 span이기 때문.
      //
      // 수정: CSS 애니메이션 클래스를 모두 제거하면:
      //    animationstart 미발생 → prevAnimationNameRef = "none" 유지
      //    → prevAnimationName("none") = currentAnimationName("none")
      //    → isAnimating=false → send("UNMOUNT") 직접 실행
      //    → unmountSuspended 진입 없음 → Portal 충돌 없음.
      //
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
      position === "popper" &&
        "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    )}
    position={position}
    {...props}
  >
    <SelectScrollUpButton />
    <SelectPrimitive.Viewport
      className={cn(
        "p-1",
        position === "popper" &&
          "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
      )}
    >
      {children}
    </SelectPrimitive.Viewport>
    <SelectScrollDownButton />
  </SelectPrimitive.Content>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
