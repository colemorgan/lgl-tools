import { CreateWorkspaceForm } from '@/components/admin/create-workspace-form';

export default function NewWorkspacePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold mb-6">New Workspace</h1>
      <CreateWorkspaceForm />
    </div>
  );
}
