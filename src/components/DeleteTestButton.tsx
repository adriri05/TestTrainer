"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteTestButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    await fetch(`/api/tests/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      className={`p-1.5 rounded-lg transition-colors ${
        confirming
          ? "bg-red-600 hover:bg-red-500 text-white"
          : "text-slate-500 hover:text-red-400 hover:bg-slate-700"
      }`}
      title={confirming ? "Confirmar eliminación" : "Eliminar test"}
    >
      <Trash2 size={15} />
    </button>
  );
}
