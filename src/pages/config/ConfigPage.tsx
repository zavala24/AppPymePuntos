// src/pages/config/ConfigPage.tsx
import React, { useState, useMemo } from "react";

type FormState = {
  porcentajeVentas: number | "";
  logoUrl: string;
};

export default function ConfigPage() {
  const [form, setForm] = useState<FormState>({
    porcentajeVentas: "",
    logoUrl: "",
  });
  const [saving, setSaving] = useState(false);

  const isValidPercent =
    typeof form.porcentajeVentas === "number" &&
    form.porcentajeVentas >= 0 &&
    form.porcentajeVentas <= 100;

  const canSave = isValidPercent;

  const previewUrl = useMemo(
    () => (form.logoUrl?.trim().length ? form.logoUrl.trim() : ""),
    [form.logoUrl]
  );

  const onChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (key === "porcentajeVentas") {
        const n = Number(val);
        setForm((f) => ({
          ...f,
          porcentajeVentas: Number.isFinite(n) ? n : "",
        }));
      } else {
        setForm((f) => ({ ...f, [key]: val }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);
      // TODO: aquí conectarás a tu API:
      // await api.put('/negocio/config', { porcentajeVentas: form.porcentajeVentas, logoUrl: form.logoUrl })
      await new Promise((r) => setTimeout(r, 600)); // simulación
      alert("Configuración guardada (simulado).");
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Configuración del negocio</h1>

      <div className="bg-white rounded-xl shadow p-5 border border-slate-200">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Porcentaje de ventas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Porcentaje de ventas (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="0 - 100"
              value={form.porcentajeVentas}
              onChange={onChange("porcentajeVentas")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!isValidPercent && (
              <p className="text-xs text-red-600 mt-1">
                Ingresa un número entre 0 y 100.
              </p>
            )}
          </div>

          {/* URL del logo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL del logo
            </label>
            <input
              type="url"
              placeholder="https://.../logo.png"
              value={form.logoUrl}
              onChange={onChange("logoUrl")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">Pegue la URL del logo (Cloudinary, etc.).</p>
          </div>

          {/* Preview del logo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Vista previa
            </label>
            <div className="h-28 w-28 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Logo preview" className="object-contain h-full w-full" />
              ) : (
                <span className="text-slate-400 text-xs">Sin logo</span>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSave || saving}
              className={`px-4 py-2 rounded-lg text-white transition
                ${canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>

            <button
              type="button"
              onClick={() =>
                setForm({ porcentajeVentas: "", logoUrl: "" })
              }
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
