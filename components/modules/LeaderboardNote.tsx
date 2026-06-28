export function LeaderboardNote() {
  return (
    <div className="sticky top-20 max-h-[600px] overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-gray-700">🏃 Cách thức:</h4>
          <p>Chạy bộ, đi bộ</p>
          <p className="mt-1 text-xs text-gray-400">
            Chi tiết cách thống kê và xếp hạng đã có trong link &quot;Bảng xếp
            hạng&quot;
          </p>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-gray-700">✅ Quy tắc xếp hạng:</h4>
          <ul className="list-inside list-disc space-y-1 text-xs text-gray-500">
            <li>Ưu tiên số hoạt động hợp lệ nhiều nhất.</li>
            <li>Bằng hoạt động thì tính tổng km cao hơn.</li>
            <li>Mỗi ngày: tối đa 2 hoạt động đầu tiên.</li>
            <li>Hoạt động hợp lệ: ≥ 1.5km &amp; pace từ 4&apos; → 22&apos;/km.</li>
          </ul>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-gray-700">📅 Thống kê:</h4>
          <p className="text-xs text-gray-500">Ngày thống kê &amp; trao giải: 25 → 30 hàng tháng.</p>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-gray-700">📌 Lưu ý:</h4>
          <ul className="list-inside list-disc space-y-1 text-xs text-gray-500">
            <li>Đồng bộ hoạt động ngay khi kết thúc tập luyện (hoặc trong ngày).</li>
            <li>Hạn chế đổi tên account Strava.</li>
            <li>Bảng xếp hạng được cập nhật vào 23h hàng ngày (hoặc do Admin chạy batch).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
