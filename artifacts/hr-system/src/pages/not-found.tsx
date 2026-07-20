export default function NotFound() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h2>
      <p className="text-muted-foreground max-w-md">
        요청하신 페이지가 존재하지 않거나, 현재 접근할 수 없는 상태입니다.
      </p>
    </div>
  );
}
