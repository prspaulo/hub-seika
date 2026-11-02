type Ferramenta = { nome: string; icone: string; url: string | null };

const FERRAMENTAS: Ferramenta[] = [
  { nome: "Contimatic", icone: "🧮", url: "https://www.contimatic.com.br" },
  { nome: "JUCEMG / REDESIM", icone: "🏛️", url: "https://www.redesim.gov.br" },
  { nome: "E-mail Seika", icone: "✉️", url: null },
  { nome: "IAS Contábil", icone: "🗂️", url: null },
];

export function FerramentasHubPage() {
  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">OPERAÇÃO</span>
          <h1>Ferramentas e Hub</h1>
          <p>Atalhos para os sistemas externos usados pela equipe no dia a dia.</p>
        </div>
      </div>

      <div className="cards-grid">
        {FERRAMENTAS.map((ferramenta) =>
          ferramenta.url ? (
            <a
              key={ferramenta.nome}
              href={ferramenta.url}
              target="_blank"
              rel="noreferrer"
              className="material-card"
              style={{ textAlign: "center", textDecoration: "none", color: "inherit" }}
            >
              <span style={{ fontSize: 28 }}>{ferramenta.icone}</span>
              <strong>{ferramenta.nome}</strong>
            </a>
          ) : (
            <div key={ferramenta.nome} className="material-card" style={{ textAlign: "center", opacity: 0.6 }}>
              <span style={{ fontSize: 28 }}>{ferramenta.icone}</span>
              <strong>{ferramenta.nome}</strong>
              <p className="muted">Link ainda não configurado</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
