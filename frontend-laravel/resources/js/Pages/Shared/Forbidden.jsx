export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <p className="text-slate-600 mt-2">Anda tidak punya akses ke halaman ini.</p>
        <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}
