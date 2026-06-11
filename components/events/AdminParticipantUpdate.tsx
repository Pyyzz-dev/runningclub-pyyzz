"use client";

import { updateParticipantCount } from "@/app/actions/eventActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AdminParticipantUpdateProps {
  eventId: string;
  currentCount: number;
}

export function AdminParticipantUpdate({
  eventId,
  currentCount,
}: AdminParticipantUpdateProps) {
  const router = useRouter();
  const [count, setCount] = useState(currentCount);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    const result = await updateParticipantCount(eventId, count);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Cập nhật số lượng thành công");
    router.refresh();
  };

  return (
    <div className="mt-3 flex items-center gap-2 border-t pt-3">
      <Input
        type="number"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        className="w-24"
        min={0}
        disabled={loading}
      />
      <Button variant="outline" size="sm" onClick={handleUpdate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cập nhật"}
      </Button>
    </div>
  );
}
