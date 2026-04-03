const ListSkeleton = ({ rows = 5 }) => {
  return (
    <div className="animate-pulse space-y-3" aria-label="loading-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-11 w-full rounded-md bg-slate-200" />
      ))}
    </div>
  );
};

export default ListSkeleton;
