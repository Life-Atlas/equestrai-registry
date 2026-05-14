export default function DocumentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1a3a5c]">Documents</h1>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-gray-600">No documents yet.</p>
        <p className="mt-1 text-sm text-gray-500">
          Uploaded photos, certificates, and registration papers will appear
          here.
        </p>
      </div>
    </div>
  );
}
