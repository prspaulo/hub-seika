import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./AppLayout.css";

type NavItem = { label: string; path?: string; phase?: string };

// Mantém visível TODO o menu do sistema original (index.html), mesmo o que
// ainda não foi construído — cada item aponta pra fase do roteiro que vai
// implementá-lo, pra nunca parecer que algo do escopo original sumiu.
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Gestão",
    items: [
      { label: "Início", path: "/" },
      { label: "Meu espaço", path: "/meu-espaco" },
      { label: "Empresas", path: "/clientes" },
      { label: "Obrigações", path: "/obrigacoes" },
      { label: "Gestão de processos", path: "/processos" },
      { label: "Operacional", path: "/operacional" },
      { label: "Financeiro", path: "/financeiro" },
      { label: "Legalização", path: "/legalizacao" },
    ],
  },
  {
    title: "Ferramentas & conhecimento",
    items: [
      { label: "Ferramentas e Hub", phase: "Fase 6" },
      { label: "Academia e Acervo", phase: "Fase 5" },
    ],
  },
  {
    title: "Relacionamento & crescimento",
    items: [
      { label: "Contatos", phase: "Fase 6" },
      { label: "Leads Marketing", phase: "Fase 6" },
      { label: "War Room HQ", phase: "Fase 6" },
      { label: "Plano 30 dias", phase: "Fase 6" },
      { label: "Arsenal & Objeções", phase: "Fase 6" },
      { label: "Playbook de Prospecção", phase: "Fase 6" },
      { label: "Preços & Proposta", phase: "Fase 6" },
      { label: "Canais & Ads", phase: "Fase 6" },
      { label: "Conquistas", phase: "Fase 6" },
    ],
  },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <strong>SEIKA</strong>
          <small>CENTRAL DE GESTÃO</small>
        </div>
        <nav>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <h6>{section.title}</h6>
              {section.items.map((item) =>
                item.path ? (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    title={`Ainda não implementado — chega na ${item.phase}`}
                  >
                    {item.label}
                    <span className="phase-tag">{item.phase}</span>
                  </button>
                ),
              )}
            </div>
          ))}
        </nav>
      </aside>
      <main>
        <header>
          <h2>Painel</h2>
          <div className="user-box">
            <span>
              {user?.name} <small>· {user?.role}</small>
            </span>
            <button type="button" onClick={() => logout()}>
              Sair
            </button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
