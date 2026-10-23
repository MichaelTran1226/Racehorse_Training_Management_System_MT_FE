/**
 * Hiệu ứng chuyển cảnh Đám mây Đa tầng bồng bềnh phong cách Hay Day (Hay Day Parallax Cloud Parting).
 * Dùng cho cả Đăng xuất (Logout) và Đăng nhập (Login).
 *
 * Cấu trúc 5 tầng mây Parallax đặc trưng phong cách game Hay Day:
 * - Tầng 0 (Backdrop): Nền trắng / tối tuyệt đối, cản sáng 100% trong lúc đổi trang ngầm.
 * - Tầng 1 (Deep Sky Billows): Lớp mây trời xa xôi, cuộn lớn, mở ra cuối cùng với nhịp đầm chắc.
 * - Tầng 2 (Mid-Back Billows): Lớp mây dày tầng trung, bổ trợ tạo độ đặc xốp không một kẽ hở.
 * - Tầng 3 (Hero Cumulus Clusters): Cụm mây hoạt họa Hay Day kinh điển với các thùy mây tròn (p-base, p-top, p-left, p-right, p-sub, p-glint), bập bồng nhấp nhô liên tục.
 * - Tầng 4 (Fore Giant Billows): Khối mây cận cảnh phồng căng, lướt nhanh rẽ sóng với độ co giãn thị sai sống động.
 * - Tầng 5 (Whimsical Cloudlets): 8 cụm mây con hoạt họa bay lơ lửng, nhấp nhô theo làn gió và tản ra hai bên như cơn gió thoảng.
 */

export interface CloudTransitionOptions {
  onCovered?: () => Promise<void> | void;
}

export function triggerCloudTransition(options?: CloudTransitionOptions | (() => Promise<void> | void)) {
  const onCovered = typeof options === "function" ? options : options?.onCovered;

  // Xóa overlay cũ nếu đang tồn tại
  const existing = document.getElementById("equiflow-cloud-transition-overlay");
  if (existing) existing.remove();

  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    document.body.getAttribute("data-theme") === "dark";

  const overlay = document.createElement("div");
  overlay.id = "equiflow-cloud-transition-overlay";
  overlay.className = `cloud-transition-root ${isDark ? "cloud-theme-dark" : "cloud-theme-light"} hayday-flyin`;

  overlay.innerHTML = `
    <!-- LỚP NỀN CẢN SÁNG 100% ĐẢM BẢO KHÔNG BỊ LỘ TRANG TRONG KHI ĐỔI -->
    <div class="hayday-cloud-backdrop"></div>

    <!-- TẦNG 1: MÂY TRỜI XA (Atmospheric Deep Sky - Chuyển động chậm, mở màn cuối) -->
    <div class="hayday-cloud-layer layer-deep">
      <div class="hayday-bank bank-left">
        <div class="hayday-puff deep-l1 bob-a"></div>
        <div class="hayday-puff deep-l2 bob-b"></div>
        <div class="hayday-puff deep-l3 bob-c"></div>
        <div class="hayday-puff deep-l4 bob-a"></div>
      </div>
      <div class="hayday-bank bank-right">
        <div class="hayday-puff deep-r1 bob-b"></div>
        <div class="hayday-puff deep-r2 bob-a"></div>
        <div class="hayday-puff deep-r3 bob-c"></div>
        <div class="hayday-puff deep-r4 bob-b"></div>
      </div>
    </div>

    <!-- TẦNG 2: MÂY DÀY TẦNG TRUNG (Mid-Back Layer - Cuộn mây nền tạo độ xốp dày) -->
    <div class="hayday-cloud-layer layer-mid-back">
      <div class="hayday-bank bank-left">
        <div class="hayday-puff midback-l1 bob-b"></div>
        <div class="hayday-puff midback-l2 bob-c"></div>
        <div class="hayday-puff midback-l3 bob-a"></div>
        <div class="hayday-puff midback-l4 bob-b"></div>
      </div>
      <div class="hayday-bank bank-right">
        <div class="hayday-puff midback-r1 bob-a"></div>
        <div class="hayday-puff midback-r2 bob-b"></div>
        <div class="hayday-puff midback-r3 bob-c"></div>
        <div class="hayday-puff midback-r4 bob-a"></div>
      </div>
    </div>

    <!-- TẦNG 3: CÁC CỤM MÂY HOẠT HỌA HAY DAY CHÍNH (Hero Cumulus Clusters - Đầy đủ cánh mây bồng bềnh) -->
    <div class="hayday-cloud-layer layer-hero-mid">
      <div class="hayday-bank bank-left">
        <div class="hayday-cluster hero-l1 bob-a">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
        <div class="hayday-cluster hero-l2 bob-b">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
        <div class="hayday-cluster hero-l3 bob-c">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
        <div class="hayday-cluster hero-l4 bob-a">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
      </div>
      <div class="hayday-bank bank-right">
        <div class="hayday-cluster hero-r1 bob-c">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
        <div class="hayday-cluster hero-r2 bob-a">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
        <div class="hayday-cluster hero-r3 bob-b">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
        <div class="hayday-cluster hero-r4 bob-c">
          <span class="p-base"></span>
          <span class="p-top"></span>
          <span class="p-left"></span>
          <span class="p-right"></span>
          <span class="p-lobe-sub"></span>
          <span class="p-glint"></span>
        </div>
      </div>
    </div>

    <!-- TẦNG 4: MÂY CẬN CẢNH KHỔNG LỒ (Fore Giant Billows - Phồng to và lướt nhanh) -->
    <div class="hayday-cloud-layer layer-fore">
      <div class="hayday-bank bank-left">
        <div class="hayday-puff fore-l1 bob-b"></div>
        <div class="hayday-puff fore-l2 bob-a"></div>
        <div class="hayday-puff fore-l3 bob-c"></div>
        <div class="hayday-puff fore-l4 bob-b"></div>
      </div>
      <div class="hayday-bank bank-right">
        <div class="hayday-puff fore-r1 bob-a"></div>
        <div class="hayday-puff fore-r2 bob-c"></div>
        <div class="hayday-puff fore-r3 bob-b"></div>
        <div class="hayday-puff fore-r4 bob-a"></div>
      </div>
    </div>

    <!-- TẦNG 5: CÁC CỤM MÂY CON HOẠT HỌA BAY LƠ LỬNG (Whimsical Floating Cloudlets & Wisps) -->
    <div class="hayday-cloudlets">
      <div class="cloudlet cloudlet-1 drift-a">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
      <div class="cloudlet cloudlet-2 drift-b">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
      <div class="cloudlet cloudlet-3 drift-c">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
      <div class="cloudlet cloudlet-4 drift-a">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
      <div class="cloudlet cloudlet-5 drift-b">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
      <div class="cloudlet cloudlet-6 drift-c">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
      <div class="cloudlet cloudlet-7 drift-a">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
      <div class="cloudlet cloudlet-8 drift-b">
        <span class="cl-body"></span><span class="cl-top"></span><span class="cl-tail"></span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Giai đoạn 1: Mây tự động lướt bay vào từ ngoài hai bên màn hình (Fly-in kéo dài ~740ms)
  // Khi mây đã bay vào khép kín 100% màn hình -> hoán đổi trang ngầm an toàn phía sau màn mây
  const coverTimer = setTimeout(async () => {
    if (onCovered) {
      try {
        await onCovered();
      } catch (err) {
        console.error("Error during cloud transition onCovered:", err);
      }
    }

    // Chờ 100ms để React render trang mới mượt mà phía sau màn mây
    setTimeout(() => {
      // Giai đoạn 2: Kích hoạt rẽ mây sang hai bên
      overlay.classList.remove("hayday-flyin");
      void overlay.offsetWidth; // Bắt buộc layout flush để kích hoạt parting animation mượt mà
      overlay.classList.add("hayday-parting");

      // Giai đoạn 3: Dọn dẹp DOM sau khi mây đã bay hoàn toàn ra ngoài rìa màn hình (~1300ms)
      setTimeout(() => {
        overlay.classList.add("hayday-finished");
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 150);
      }, 1300);
    }, 100);
  }, 740);

  return () => {
    clearTimeout(coverTimer);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };
}

export const triggerCloudLogoutTransition = triggerCloudTransition;
