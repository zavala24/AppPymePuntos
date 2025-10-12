export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center">
      <div className="rounded-2xl border border-blue-200 bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-black text-blue-700">Tailwind OK ✅</h1>
        <p className="mt-2 text-slate-600">Estilos aplicados con clases utility.</p>
        <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Botón azul
        </button>
      </div>
    </div>
  );
}