const AdminSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-7 w-40 bg-muted rounded" />
      <div className="h-9 w-28 bg-muted rounded-md" />
    </div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="h-12 w-12 bg-muted rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default AdminSkeleton;
