import ListSkeleton from "../../../../components/skeleton/ListSkeleton";
import { useGetSubjectsQuery } from "../../../../services/schoolApi";

const SubjectsRtkExample = () => {
  const { data, isLoading, isFetching } = useGetSubjectsQuery({ page: 1, limit: 20 });

  if (isLoading) return <ListSkeleton rows={6} />;

  return (
    <div>
      {isFetching ? <p className="text-xs text-gray-500">Refreshing...</p> : null}
      <ul className="space-y-2">
        {(data?.items || []).map((subject) => (
          <li key={subject._id} className="rounded border p-3">
            {subject.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubjectsRtkExample;
