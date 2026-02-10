import { Spinner } from "@/components/ui/spinner";

export default function ProtectedLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}
