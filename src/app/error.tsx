"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="text-6xl text-garage-500">!</div>
      <h2 className="text-xl font-bold text-garage-100">Une erreur est survenue</h2>
      <p className="text-garage-400 text-sm text-center max-w-md">{error.message}</p>
      <button onClick={reset} className="btn-primary">Réessayer</button>
    </div>
  );
}
