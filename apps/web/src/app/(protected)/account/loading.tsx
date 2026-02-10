export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6 max-w-2xl">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-10 bg-muted rounded w-24" />
        </div>
        <div className="h-48 bg-muted rounded" />
      </div>
    </div>
  );
}
