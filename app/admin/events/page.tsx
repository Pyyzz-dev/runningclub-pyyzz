import type { Metadata } from "next";
import { EventManager } from "@/components/admin/EventManager";
import { getEvents } from "@/app/actions/eventActions";

export const metadata: Metadata = {
  title: "Quản lý Sự kiện",
};

export default async function AdminEventsPage() {
  const events = await getEvents();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Sự kiện & Giải chạy</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý các giải chạy và hoạt động của câu lạc bộ.
        </p>
      </div>

      <EventManager events={events} />
    </div>
  );
}
