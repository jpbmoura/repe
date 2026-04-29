import { useState } from 'react';

type Props = {
  codigo: string;
  nomeAluno?: string;
  className?: string;
};

const CODIGO_PARTS = (codigo: string) =>
  `${codigo.slice(0, 4)}-${codigo.slice(4)}`;

export function CodigoConvite({ codigo, nomeAluno, className = '' }: Props) {
  const [copiado, setCopiado] = useState(false);

  const url = `${window.location.origin}/cadastro?codigo=${codigo}`;
  const mensagem = nomeAluno
    ? `Olá ${nomeAluno}, seu cadastro no Repê: ${url}\nCódigo: ${codigo}`
    : `Cadastre-se no Repê com o código ${codigo}: ${url}`;

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // ignore
    }
  };

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite Repê',
          text: mensagem,
        });
        return;
      } catch {
        // user cancelled or unsupported, fall back to copy
      }
    }
    await copiar(mensagem);
  };

  return (
    <div className={`bg-bg-elevated border-border space-y-4 rounded-card border p-6 ${className}`}>
      <div>
        <p className="text-text-secondary mb-2 text-sm">Código de convite</p>
        <p className="font-num text-3xl font-semibold tracking-widest">
          {CODIGO_PARTS(codigo)}
        </p>
      </div>

      <div className="text-text-secondary text-sm leading-relaxed">
        Compartilhe este código (ou o link abaixo) com o aluno. Ele entra em{' '}
        <span className="text-text-primary">/cadastro</span> e cria a conta usando
        este código.
      </div>

      <div className="bg-bg-subtle border-border rounded-chip border p-3">
        <p className="text-text-secondary text-xs">Link</p>
        <p className="break-all text-sm">{url}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => copiar(codigo)}
          className="bg-bg-subtle border-border hover:border-border-strong flex-1 rounded-pill border px-4 py-2.5 text-sm font-medium transition"
        >
          {copiado ? 'Copiado!' : 'Copiar código'}
        </button>
        <button
          type="button"
          onClick={compartilhar}
          className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed flex-1 rounded-pill px-4 py-2.5 text-sm font-medium transition"
        >
          Compartilhar
        </button>
      </div>
    </div>
  );
}
