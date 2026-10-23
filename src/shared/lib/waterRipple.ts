/**
 * EquiFlow Calm Water Droplet Ripple Simulation
 * Mô phỏng hiện tượng tự nhiên chân thực:
 * 1 giọt nước rơi từ trên cao xuống chính giữa màn hình (tâm màn hình)
 * Chạm vào một bề mặt nước phẳng lặng, tĩnh lặng, tạo ra hạt nước nảy nhẹ
 * và các đợt sóng nước tròn đồng tâm loang dần ra toàn bộ trang web.
 */

export function triggerCalmWaterRipple(onImpact?: () => void): void {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onImpact?.();
    return;
  }

  // Luôn luôn rơi tại CHÍNH GIỮA MÀN HÌNH theo đúng mô tả hiện tượng tự nhiên của bạn
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;

  // Bán kính sóng đủ lớn để lan tỏa phủ kín 4 góc màn hình
  const maxDist = Math.hypot(x, y);
  const maxSize = Math.round(maxDist * 2.3);

  // Xóa overlay cũ nếu người dùng bấm nhanh
  const existing = document.getElementById("calm-water-global-overlay");
  if (existing) {
    existing.remove();
  }

  const container = document.createElement("div");
  container.id = "calm-water-global-overlay";
  container.className = "calm-water-fullscreen";
  container.setAttribute("aria-hidden", "true");
  container.style.setProperty("--max-size", `${maxSize}px`);

  container.innerHTML = `
    <!-- Giọt nước rơi từ trên xuống chính giữa màn hình -->
    <div class="calm-droplet-plunge"></div>
    
    <!-- Hạt nước nhỏ nảy ngược lên khi tiếp xúc mặt nước tĩnh lặng -->
    <div class="calm-rebound-bead"></div>

    <!-- Điểm chạm mặt nước và ánh phản chiếu tinh tế tại tâm màn hình -->
    <div class="calm-surface-impact"></div>

    <!-- 3 đợt sóng tròn đồng tâm loang nhanh và tan nhanh trên mặt nước phẳng lặng -->
    <div class="calm-water-wave wave-1"></div>
    <div class="calm-water-wave wave-2"></div>
    <div class="calm-water-wave wave-3"></div>
  `;

  document.body.appendChild(container);

  // CHÍNH XÁC KHI GIỌT NƯỚC CHẠM MẶT NƯỚC (260ms):
  // Kích hoạt đổi ngôn ngữ đồng bộ đúng lúc đợt sóng đầu tiên bắt đầu loang ra toàn web!
  if (onImpact) {
    setTimeout(onImpact, 260);
  }

  // Mặt nước trang web gợn sóng nhẹ và trở lại rõ nét nhanh
  setTimeout(() => {
    document.body.classList.add("calm-surface-ripple");
  }, 240);

  setTimeout(() => {
    document.body.classList.remove("calm-surface-ripple");
  }, 550);

  // Tự động dọn dẹp sau khi sóng tan nhanh chóng
  setTimeout(() => {
    container.remove();
  }, 1100);
}

export function triggerGlobalWaterRipple(onImpact?: () => void): void {
  triggerCalmWaterRipple(onImpact);
}



