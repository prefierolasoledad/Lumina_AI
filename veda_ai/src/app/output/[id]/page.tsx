import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OutputPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-950 via-zinc-900 to-black text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
            V
          </Link>
          <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Veda AI / Output
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">
            Back to Home
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="text-xs text-indigo-400 font-mono tracking-widest uppercase mb-2">ASSESSMENT ID: {id}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">Assessment Result Viewer</h1>
          <p className="text-zinc-400 mt-2">Displaying output details generated for evaluation id.</p>
        </div>

        <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-md text-center py-16">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6 text-zinc-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Ready for Assignment Output</h2>
          <p className="text-zinc-500 max-w-md mx-auto text-sm">
            Once components and state stores are implemented, real-time assessment data will be loaded and structured here.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 py-6 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Veda AI. Ready to display generated assessments.
      </footer>
    </div>
  );
}
