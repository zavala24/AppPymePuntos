import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart as RBarChart,
  Bar,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Bell,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// -----------------------------
// MOCK DATA (reemplaza por tus endpoints)
// -----------------------------
const kpis = [
  {
    label: "Negocios totales",
    value: 482,
    delta: "+12%",
    trend: "up",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    label: "Usuarios activos",
    value: 129,
    delta: "+5%",
    trend: "up",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Conversión",
    value: "31%",
    delta: "-2.1%",
    trend: "down",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    label: "Pendientes",
    value: 9,
    delta: "+3",
    trend: "up",
    icon: <Bell className="h-5 w-5" />,
  },
];

const lineData = [
  { name: "Lun", negocios: 8, usuarios: 23 },
  { name: "Mar", negocios: 14, usuarios: 25 },
  { name: "Mié", negocios: 11, usuarios: 21 },
  { name: "Jue", negocios: 18, usuarios: 31 },
  { name: "Vie", negocios: 21, usuarios: 33 },
  { name: "Sáb", negocios: 9, usuarios: 15 },
  { name: "Dom", negocios: 6, usuarios: 10 },
];

const barData = [
  { name: "Ene", conversion: 24 },
  { name: "Feb", conversion: 27 },
  { name: "Mar", conversion: 29 },
  { name: "Abr", conversion: 33 },
  { name: "May", conversion: 31 },
  { name: "Jun", conversion: 30 },
];

const actividadReciente = [
  {
    title: "Nuevo negocio creado",
    by: "María Pérez",
    when: "hace 10 min",
    detail: "Cafetería Don Pepe",
  },
  {
    title: "Usuario invitado",
    by: "Carlos Ruiz",
    when: "hace 40 min",
    detail: "cruiz@empresa.com",
  },
  {
    title: "Aprobación completada",
    by: "Sistema",
    when: "hace 1 h",
    detail: "Negocio #432",
  },
  {
    title: "Notificación fallida",
    by: "Webhook",
    when: "hace 3 h",
    detail: "/notify/order/981",
  },
];

const alertas = [
  {
    level: "Alta",
    message: "3 notificaciones fallidas en la última hora",
  },
  {
    level: "Media",
    message: "2 verificaciones pendientes por vencer hoy",
  },
];

// -----------------------------
// PEQUEÑOS COMPONENTES
// -----------------------------
function StatCard({ label, value, delta, trend, icon }: any) {
  const isUp = trend === "up";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">{label}</div>
            <div className="opacity-70">{icon}</div>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-3xl font-semibold leading-none">{value}</div>
            <div
              className={`flex items-center gap-1 text-sm ${
                isUp ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{delta}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActions() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Acciones rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button className="justify-start" variant="secondary">
            <Plus className="mr-2 h-4 w-4" /> Crear negocio
          </Button>
          <Button className="justify-start" variant="secondary">
            <Users className="mr-2 h-4 w-4" /> Invitar usuario
          </Button>
          <Button className="justify-start" variant="secondary">
            <Bell className="mr-2 h-4 w-4" /> Enviar notificación
          </Button>
          <Button className="justify-start" variant="secondary">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Revisar aprobaciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alertas</CardTitle>
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.map((a, i) => (
          <div key={i} className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{a.message}</p>
              <p className="text-xs text-muted-foreground">Prioridad {a.level}</p>
            </div>
            <Badge variant={a.level === "Alta" ? "destructive" : "secondary"}>
              {a.level}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actividadReciente.map((a, i) => (
          <div key={i} className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium leading-tight">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.detail} · {a.by} · {a.when}
              </p>
            </div>
            <Button size="sm" variant="ghost">
              Ver
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function KpiCharts() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Actividad semanal</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RLineChart data={lineData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="negocios" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="usuarios" strokeWidth={2} dot={false} />
          </RLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ConversionChart() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Conversión mensual</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={barData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="conversion" radius={[8, 8, 0, 0]} />
          </RBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// -----------------------------
// DASHBOARD
// -----------------------------
export default function Dashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al panel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Exportar</Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuevo negocio
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <StatCard key={i} {...k} />
        ))}
      </div>

      {/* Gráficas y pendientes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <KpiCharts />
          <ConversionChart />
        </div>
        <div className="space-y-4">
          <QuickActions />
          <AlertsPanel />
        </div>
      </div>

      {/* Actividad */}
      <RecentActivity />

      {/* Notas para devs */}
      <div className="text-xs text-muted-foreground">
        <p>
          <strong>Integración rápida:</strong> sustituye los arreglos <code>kpis</code>,
          <code>lineData</code>, <code>barData</code> y <code>actividadReciente</code> por
          datos de tus endpoints. Este archivo es un componente React de una sola
          vista listo para usarse con Tailwind, shadcn/ui, Lucide y Recharts.
        </p>
      </div>
    </div>
  );
}
