---
name: 브라우저 자동번역 + Radix Select DOM 충돌
description: Edge/Chrome 자동번역이 SelectValue 내부 텍스트 노드를 교체해 React removeChild/insertBefore NotFoundError를 유발하는 패턴과 수정 방법.
---

## 현상
- 직원 등록/수정 저장 후 navigation, 인사이력 추가 패널 닫기 시점에 오류 화면
- 데스크탑 운영 배포본에서만 재현, 모바일 정상, 시크릿/InPrivate 창 정상
- Edge 한국어 자동번역 비활성화 시 오류 완전 소멸 → 브라우저 번역이 원인으로 확정

## 근본 원인
Radix Select는 `SelectItemText`에서 `ReactDOM.createPortal(text, context.valueNode)`로
선택된 항목의 텍스트를 `SelectTrigger` 버튼 내부 `SelectValue` span(context.valueNode)에 포탈링한다.

브라우저 자동번역(Edge/Chrome)이 이 span 내의 텍스트 노드를 번역본으로 교체하면:
- 원래 텍스트 노드가 context.valueNode의 자식에서 사라짐
- React/Radix가 언마운트 시 `context.valueNode.removeChild(originalTextNode)` 호출 → NotFoundError
- 또는 새 값 포탈링 시 `insertBefore(newNode, originalTextNode)` 호출 → NotFoundError

## 수정 내용 (모두 적용됨)

### 1. `index.html` — `lang="ko"` 선언 (핵심)
```html
<html lang="ko">
```
페이지 선언 언어와 사용자 언어가 일치하면 브라우저가 번역을 제안/자동 적용하지 않음.
기존 `lang="en"` 이 한국어 콘텐츠에서 번역을 유발하던 근본 원인.

### 2. `select.tsx` SelectTrigger — `translate="no"` (방어 계층)
```tsx
<SelectPrimitive.Trigger translate="no" ...>
```
lang 선언이 있어도 사용자가 강제 번역하는 경우를 대비한 2차 방어.
SelectValue 텍스트 노드가 있는 버튼 요소에만 적용 (과도 적용 없음).

### 3. `select.tsx` — Portal + 닫기 애니메이션 복원
Portal 제거, 닫기 애니메이션 제거는 이전 세션에서 적용한 임시 회피책.
translate="no"로 근본 원인을 차단했으므로 원래 shadcn/ui 기본값으로 복원.

### 4. 디버그 코드 제거
- `main.tsx`: removeChild/insertBefore 인터셉터, MutationObserver 전부 제거
- `new.tsx`, `edit.tsx`: FLOW TRACE ft() 헬퍼 및 모든 호출 제거
- `employee-tab-contents.tsx`: _ftPersonnel, ftP 헬퍼 및 모든 호출 제거

## Why
**Why:** 언어 선언 불일치(`lang="en"` + 한국어 콘텐츠)가 번역 트리거 → React 파이버가 관리하는 포탈 텍스트 노드를 번역 엔진이 교체 → 파이버가 사라진 노드를 조작 → NotFoundError.

**How to apply:** 한국어 SPA를 새로 만들 때는 반드시 `lang="ko"` 선언.
Radix Select처럼 portal을 활용하는 컴포넌트가 있는 경우 SelectTrigger에 `translate="no"` 추가.
