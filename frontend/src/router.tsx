import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { EmpresasList } from "./pages/clientes/EmpresasList";
import { EmpresaForm } from "./pages/clientes/EmpresaForm";
import { EmpresaDetail } from "./pages/clientes/EmpresaDetail";
import { ProcessosBoard } from "./pages/processos/ProcessosBoard";
import { ProcessoForm } from "./pages/processos/ProcessoForm";
import { ObrigacoesList } from "./pages/obrigacoes/ObrigacoesList";
import { MeuEspaco } from "./pages/meuespaco/MeuEspaco";
import { Operacional } from "./pages/operacional/Operacional";
import { LegalizacaoPage } from "./pages/legalizacao/LegalizacaoPage";
import { FinanceiroPage } from "./pages/financeiro/FinanceiroPage";
import { AcervoPage } from "./pages/acervo/AcervoPage";
import { FerramentasHubPage } from "./pages/ferramentas/FerramentasHubPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "meu-espaco", element: <MeuEspaco /> },
          { path: "clientes", element: <EmpresasList /> },
          { path: "clientes/novo", element: <EmpresaForm /> },
          { path: "clientes/:id", element: <EmpresaDetail /> },
          { path: "obrigacoes", element: <ObrigacoesList /> },
          { path: "processos", element: <ProcessosBoard /> },
          { path: "processos/novo", element: <ProcessoForm /> },
          { path: "operacional", element: <Operacional /> },
          { path: "legalizacao", element: <LegalizacaoPage /> },
          { path: "financeiro", element: <FinanceiroPage /> },
          { path: "acervo", element: <AcervoPage /> },
          { path: "ferramentas", element: <FerramentasHubPage /> },
        ],
      },
    ],
  },
]);
