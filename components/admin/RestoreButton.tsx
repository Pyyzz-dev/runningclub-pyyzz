"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RestoreButtonProps {
  onRestore: () => Promise<{ error?: string }>;
  onSuccess?: () => void;
  label?: string;
}

export function RestoreButton({
  onRestore,
  onSuccess,
  label = "Khôi phục",
}: RestoreButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    const result = await onRestore();
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã khôi phục");
    onSuccess?.();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={loading}
      className="text-green-700 hover:text-green-800"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="mr-1 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
