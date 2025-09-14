// src/app/page.tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Neuroljus</h1>
      <p className="text-slate-600 mt-2">
        Portal con chat multilingüe y señales.
      </p>

      <ul className="list-disc ml-5 mt-4 space-y-2">
        <li>
          <a className="underline" href="/chat">
            Abrir Chat
          </a>
        </li>
        <li>
          <a className="underline" href="/conduit">
            Abrir Conduit
          </a>
        </li>
        <li>
          <a className="underline" href="/care">
            Abrir Care Dashboard
          </a>
        </li>
        <li>
          <a className="underline" href="/neuroljus-voice">
            Decidir “casa” de Neuroljus
          </a>
        </li>
      </ul>
    </main>
  );
}