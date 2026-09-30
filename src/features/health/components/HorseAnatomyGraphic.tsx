import React from "react";

interface HorseAnatomyGraphicProps {
  view: "LEFT" | "RIGHT";
  layer: "MUSCLE" | "SKELETON";
}

export const HorseAnatomyGraphic: React.FC<HorseAnatomyGraphicProps> = ({ view, layer }) => {
  const isSkeleton = layer === "SKELETON";

  return (
    <svg
      viewBox="0 0 800 500"
      style={{
        width: "92%",
        height: "92%",
        transform: view === "RIGHT" ? "scaleX(-1)" : "none",
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Subtle grid pattern */}
        <pattern id="vetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
        </pattern>

        {/* Muscle Shading Gradients */}
        <linearGradient id="muscleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a4e40" />
          <stop offset="50%" stopColor="#1e3a30" />
          <stop offset="100%" stopColor="#12241e" />
        </linearGradient>

        <linearGradient id="muscleLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3d6b58" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#234437" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="tendonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Bone Shading Gradients */}
        <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdfcf8" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id="boneDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid Canvas Background */}
      <rect width="800" height="500" fill="url(#vetGrid)" />

      {/* Technical Blueprint Callouts & Title */}
      <g opacity="0.65" style={{ transform: view === "RIGHT" ? "scaleX(-1)" : "none", transformOrigin: "400px 250px" }}>
        <text x="30" y="35" fontSize="11" fontWeight="700" letterSpacing="1.5" fill="var(--muted)">
          {isSkeleton ? "SKELETAL SYSTEM • EQUUS CABALLUS" : "MUSCULOSKELETAL SYSTEM • EQUUS CABALLUS"}
        </text>
        <text x="30" y="52" fontSize="10" fill="var(--muted)" opacity="0.8">
          ANATOMICAL 2D VETERINARY ATLAS — THOROUGHBRED PROFILE
        </text>
      </g>

      {/* ======================================================== */}
      {/* FAR-SIDE LEGS & TAIL (SILHOUETTE DEPTH)                 */}
      {/* ======================================================== */}
      <g opacity={isSkeleton ? "0.2" : "0.55"} fill={isSkeleton ? "#94a3b8" : "#172d25"}>
        {/* Far-side Front Leg */}
        <path d="M 320 280 L 310 330 L 305 385 L 308 430 L 302 455 L 298 468 L 315 470 L 318 455 L 320 425 L 325 380 L 338 330 Z" />
        {/* Far-side Hind Leg */}
        <path d="M 610 280 L 630 330 L 625 375 L 610 405 L 615 440 L 610 460 L 606 470 L 625 472 L 628 455 L 626 425 L 635 395 L 648 340 Z" />
        {/* Far-side Ear */}
        <polygon points="152,98 160,70 166,95" />
      </g>

      {/* ======================================================== */}
      {/* LAYER 1: MUSCULAR SYSTEM (THOROUGHBRED PROFILE)         */}
      {/* ======================================================== */}
      {!isSkeleton && (
        <g id="muscle-layer">
          {/* Main Equine Body Contour */}
          <path
            d="M 125 178 
               C 115 176, 105 168, 108 155 
               C 112 142, 125 140, 138 135 
               C 142 120, 146 102, 150 82 
               C 152 75, 158 78, 160 88 
               C 163 98, 165 110, 172 118 
               C 190 126, 225 142, 260 168 
               C 285 185, 305 190, 330 192 
               C 365 194, 400 205, 450 206 
               C 490 206, 525 198, 565 204 
               C 605 212, 635 235, 642 270 
               C 645 285, 640 315, 632 342 
               C 625 365, 615 390, 600 410 
               L 598 440 
               L 592 458 
               L 588 472 
               L 565 472 
               L 570 458 
               L 576 438 
               L 575 405 
               C 560 388, 545 355, 540 330 
               C 515 330, 480 325, 430 320 
               C 380 315, 355 312, 335 305 
               L 330 350 
               L 322 388 
               L 320 435 
               L 316 458 
               L 310 472 
               L 288 472 
               L 292 458 
               L 296 435 
               L 296 385 
               L 290 345 
               C 278 325, 265 300, 255 275 
               C 245 250, 230 220, 205 195 
               C 185 178, 160 178, 142 195 
               C 132 205, 122 195, 125 178 Z"
            fill="url(#muscleGrad)"
            stroke="var(--brand)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Flowing Tail */}
          <path
            d="M 640 258 
               C 660 270, 675 305, 678 350 
               C 680 390, 675 435, 665 465 
               C 658 450, 655 410, 652 370 
               C 650 330, 645 295, 638 275 Z"
            fill="#152820"
            stroke="var(--brand)"
            strokeWidth="1.5"
          />

          {/* Mane */}
          <path
            d="M 160 90 
               C 175 110, 185 130, 205 145 
               C 225 160, 250 175, 280 188 
               C 272 180, 255 168, 235 152 
               C 215 138, 195 118, 180 98 Z"
            fill="#152820"
            stroke="var(--brand-200)"
            strokeWidth="1"
          />

          {/* Muscle Anatomy Groups (Subtle embossed planes) */}
          {/* Head & Cheek (Masseter) */}
          <ellipse cx="148" cy="165" rx="16" ry="12" fill="url(#muscleLight)" stroke="#3d6b58" strokeWidth="1" />
          <circle cx="140" cy="140" r="4" fill="#0f172a" />
          <ellipse cx="118" cy="160" rx="3.5" ry="2" fill="#0f172a" opacity="0.8" />

          {/* Neck Muscles (Brachiocephalicus & Splenius) */}
          <path
            d="M 165 125 C 200 145, 235 175, 275 195 C 255 220, 220 200, 185 170 Z"
            fill="url(#muscleLight)"
            opacity="0.6"
            stroke="#4e826c"
            strokeWidth="1"
          />

          {/* Shoulder Blade (Scapula & Trapezius - VÙNG VAI INJ-2) */}
          <path
            d="M 280 195 C 310 196, 325 210, 315 255 C 295 270, 270 265, 262 235 C 265 210, 272 200, 280 195 Z"
            fill="url(#muscleLight)"
            opacity="0.8"
            stroke="#4e826c"
            strokeWidth="1.5"
          />
          <text x="272" y="240" fontSize="10" fontWeight="600" fill="#a7f3d0" opacity="0.9">
            M. Deltoideus (Vai)
          </text>

          {/* Triceps & Chest */}
          <path
            d="M 285 260 C 310 260, 320 280, 305 315 C 285 315, 275 295, 285 260 Z"
            fill="url(#muscleLight)"
            opacity="0.5"
          />

          {/* Rib Cage & Barrel Intercostals */}
          <g opacity="0.4" stroke="#4e826c" strokeWidth="1.2">
            <line x1="355" y1="215" x2="350" y2="295" />
            <line x1="375" y1="215" x2="370" y2="300" />
            <line x1="395" y1="215" x2="390" y2="305" />
            <line x1="415" y1="215" x2="410" y2="305" />
            <line x1="435" y1="215" x2="430" y2="300" />
            <line x1="455" y1="215" x2="450" y2="295" />
          </g>

          {/* Hindquarter & Gluteal Muscle Group (Croup / Đùi sau) */}
          <path
            d="M 525 210 C 570 210, 620 230, 625 275 C 610 320, 580 345, 550 335 C 530 305, 520 250, 525 210 Z"
            fill="url(#muscleLight)"
            opacity="0.75"
            stroke="#4e826c"
            strokeWidth="1.5"
          />
          <text x="548" y="275" fontSize="10" fontWeight="600" fill="#a7f3d0" opacity="0.9">
            M. Gluteus (Mông)
          </text>

          {/* Foreleg Tendons (SDFT - Superficial Digital Flexor Tendon - VÙNG GÂN INJ-1) */}
          <g id="sdf-tendon">
            {/* Highlighted Yellow SDFT / DDFT Tendon Cord */}
            <path
              d="M 302 380 L 300 440 L 296 460"
              stroke="url(#tendonGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#softGlow)"
            />
            <line x1="300" y1="410" x2="335" y2="410" stroke="#facc15" strokeWidth="1" strokeDasharray="2" />
            <rect x="338" y="401" width="130" height="18" rx="4" fill="#0f172a" opacity="0.85" />
            <text x="342" y="414" fontSize="9.5" fontWeight="700" fill="#facc15">
              Gân SDFT (Chi trước)
            </text>
          </g>

          {/* Hindleg Achilles / Calcaneal Tendon */}
          <path d="M 586 405 L 580 445" stroke="#facc15" strokeWidth="3" opacity="0.7" />

          {/* Hoof Caps */}
          <polygon points="288,472 292,458 316,458 310,472" fill="#0b1310" stroke="#4e826c" strokeWidth="1" />
          <polygon points="565,472 570,458 592,458 588,472" fill="#0b1310" stroke="#4e826c" strokeWidth="1" />
        </g>
      )}

      {/* ======================================================== */}
      {/* LAYER 2: SKELETAL SYSTEM (EQUUS CABALLUS VET ATLAS)     */}
      {/* ======================================================== */}
      {isSkeleton && (
        <g id="skeleton-layer">
          {/* Subtle Silhouette Background for Anatomical Context */}
          <path
            d="M 125 178 C 115 176, 105 168, 108 155 C 112 142, 125 140, 138 135 C 142 120, 146 102, 150 82 C 152 75, 158 78, 160 88 C 163 98, 165 110, 172 118 C 190 126, 225 142, 260 168 C 285 185, 305 190, 330 192 C 365 194, 400 205, 450 206 C 490 206, 525 198, 565 204 C 605 212, 635 235, 642 270 C 645 285, 640 315, 632 342 C 625 365, 615 390, 600 410 L 598 440 L 592 458 L 588 472 L 565 472 L 570 458 L 576 438 L 575 405 C 560 388, 545 355, 540 330 C 515 330, 480 325, 430 320 C 380 315, 355 312, 335 305 L 330 350 L 322 388 L 320 435 L 316 458 L 310 472 L 288 472 L 292 458 L 296 435 L 296 385 L 290 345 C 278 325, 265 300, 255 275 C 245 250, 230 220, 205 195 C 185 178, 160 178, 142 195 C 132 205, 122 195, 125 178 Z"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.45"
          />

          {/* Cranium & Facial Bones (Hộp sọ & Xương mặt) */}
          <path
            d="M 122 175 
               C 112 172, 110 162, 116 150 
               C 122 138, 138 132, 148 128 
               C 155 125, 165 130, 168 140 
               C 170 152, 162 172, 148 180 
               L 132 182 Z"
            fill="url(#boneGrad)"
            stroke="#334155"
            strokeWidth="1.8"
          />
          {/* Eye Orbit (Hốc mắt) */}
          <circle cx="145" cy="142" r="5.5" fill="#1e293b" />
          {/* Mandible (Xương hàm dưới đặc trưng của ngựa) */}
          <path
            d="M 125 178 C 132 194, 154 195, 162 178 L 152 172 Z"
            fill="url(#boneGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Incisors / Teeth */}
          <rect x="114" y="165" width="4" height="6" fill="#cbd5e1" />

          {/* 7 Cervical Vertebrae (7 Đốt sống cổ hình chữ S uyển chuyển) */}
          <g stroke="#334155" strokeWidth="1.5" fill="url(#boneGrad)">
            {/* Atlas (C1) & Axis (C2) */}
            <ellipse cx="178" cy="138" rx="8" ry="6" />
            <ellipse cx="192" cy="148" rx="8" ry="7" />
            {/* C3 - C7 */}
            <ellipse cx="210" cy="164" rx="9" ry="8" />
            <ellipse cx="230" cy="184" rx="10" ry="9" />
            <ellipse cx="250" cy="205" rx="10" ry="9" />
            <ellipse cx="270" cy="225" rx="10" ry="9" />
            <ellipse cx="288" cy="235" rx="10" ry="9" />
          </g>

          {/* 18 Thoracic Vertebrae & Tall Dorsal Spinous Processes (Gai sống lưng & Vai u - Withers) */}
          <g stroke="#334155" strokeWidth="1.5" fill="url(#boneGrad)">
            {/* Tallest withers spines (T3 - T8) */}
            <path d="M 295 235 L 305 195 L 312 232 Z" />
            <path d="M 310 232 L 322 194 L 328 230 Z" />
            <path d="M 326 230 L 338 198 L 344 228 Z" />
            <path d="M 342 228 L 354 205 L 360 227 Z" />
            <path d="M 358 227 L 370 210 L 376 226 Z" />
            <path d="M 374 226 L 388 212 L 394 225 Z" />
            {/* Mid & Rear Thoracic */}
            <path d="M 392 225 L 406 215 L 412 225 Z" />
            <path d="M 410 225 L 424 218 L 430 225 Z" />
            <path d="M 428 225 L 442 219 L 448 225 Z" />
            <path d="M 446 225 L 460 220 L 466 225 Z" />
          </g>

          {/* Lumbar Vertebrae (L1 - L6 Đốt sống thắt lưng) & Sacrum (Xương cùng) */}
          <g stroke="#334155" strokeWidth="1.5" fill="url(#boneGrad)">
            <ellipse cx="480" cy="226" rx="9" ry="6" />
            <ellipse cx="496" cy="226" rx="9" ry="6" />
            <ellipse cx="512" cy="227" rx="9" ry="6" />
            <ellipse cx="528" cy="228" rx="9" ry="6" />
            {/* Sacrum */}
            <path d="M 536 228 C 555 228, 575 235, 585 245 L 575 252 L 536 235 Z" />
            {/* Coccygeal / Caudal (Đốt sống đuôi rủ xuống) */}
            <path d="M 585 245 C 595 260, 605 290, 608 330" fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray="3 2" />
          </g>

          {/* Scapula (Xương bả vai tam giác lớn) & Spina Scapulae */}
          <g id="scapula-bone">
            <path
              d="M 288 200 
                 C 310 205, 320 225, 310 255 
                 L 282 258 
                 C 275 235, 278 215, 288 200 Z"
              fill="url(#boneGrad)"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Ridge / Spine of Scapula */}
            <line x1="298" y1="205" x2="292" y2="255" stroke="#475569" strokeWidth="2" />
            <text x="250" y="215" fontSize="9.5" fontWeight="700" fill="var(--ink)">
              Scapula (Bả vai)
            </text>
          </g>

          {/* Humerus (Xương cánh tay) & Radius/Ulna (Cẳng tay trước) */}
          <g stroke="#334155" strokeWidth="1.8" fill="url(#boneGrad)">
            {/* Humerus */}
            <path d="M 282 258 C 295 275, 305 295, 300 315 L 285 312 C 275 295, 272 275, 282 258 Z" />
            {/* Olecranon (Mỏm khuỷu tay nhô ra) */}
            <polygon points="300,315 312,320 305,330" fill="#94a3b8" />
            {/* Radius & Ulna (Xương cẳng tay) */}
            <path d="M 292 322 L 298 375 L 308 375 L 302 322 Z" />
          </g>

          {/* Carpus (Khớp gối / Cổ chân trước) */}
          <rect x="296" y="375" width="13" height="12" rx="3" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.6" />
          <line x1="296" y1="381" x2="309" y2="381" stroke="#475569" strokeWidth="1" />

          {/* Metacarpus III (Cannon Bone / Xương ống chi trước) & Splint Bones */}
          <g id="fore-cannon-bone">
            <rect x="298" y="388" width="9" height="52" rx="2" fill="url(#boneGrad)" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="296" y1="390" x2="296" y2="425" stroke="#94a3b8" strokeWidth="1.5" /> {/* Splint bone */}
          </g>

          {/* Proximal Sesamoidean & Phalanges (Khớp bàn ngón, Xương ngón P1, P2 & P3 Coffin Bone) */}
          <g stroke="#1e293b" strokeWidth="1.6" fill="url(#boneGrad)">
            {/* Fetlock joint & Sesamoidean */}
            <circle cx="302" cy="445" r="5.5" fill="#cbd5e1" />
            {/* P1 (Long Pastern) nghiêng 45 độ */}
            <path d="M 300 448 L 294 460 L 302 462 L 306 450 Z" />
            {/* P2 (Short Pastern) */}
            <ellipse cx="296" cy="463" rx="4" ry="2.5" />
            {/* P3 (Coffin Bone / Xương hình móng ngựa) */}
            <path d="M 288 472 L 294 464 L 308 464 L 306 472 Z" fill="#475569" />
          </g>

          {/* Rib Cage (Lồng ngực với 18 cặp xương sườn uốn cong vòm cực đẹp) */}
          <g fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
            <path d="M 320 235 C 325 265, 320 295, 310 310" />
            <path d="M 332 232 C 340 268, 335 302, 322 315" />
            <path d="M 344 230 C 355 270, 350 306, 335 320" />
            <path d="M 358 228 C 372 272, 368 310, 350 322" />
            <path d="M 372 227 C 388 275, 385 312, 365 324" />
            <path d="M 386 226 C 404 275, 400 314, 380 325" />
            <path d="M 400 225 C 420 275, 418 314, 400 324" />
            <path d="M 415 225 C 435 274, 432 312, 418 322" />
            <path d="M 430 225 C 450 272, 448 308, 435 320" />
            <path d="M 445 225 C 465 270, 462 304, 452 316" />
            <path d="M 460 225 C 478 268, 475 298, 468 312" />
          </g>
          {/* Sternum (Xương ức) */}
          <path d="M 305 315 C 330 325, 370 328, 405 325" fill="none" stroke="#334155" strokeWidth="3" />

          {/* Pelvis (Xương chậu: Ilium, Ischium, Acetabulum) */}
          <g id="pelvis-bone">
            <path
              d="M 535 230 
                 C 560 225, 595 232, 608 260 
                 C 595 275, 565 275, 550 268 
                 L 540 250 Z"
              fill="url(#boneGrad)"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Tuber Coxae (Mấu hông) */}
            <circle cx="538" cy="232" r="4" fill="#94a3b8" />
            <text x="545" y="222" fontSize="9.5" fontWeight="700" fill="var(--ink)">
              Pelvis (Xương chậu)
            </text>
          </g>

          {/* Femur (Xương đùi lớn) & Patella (Xương bánh chè) */}
          <g stroke="#334155" strokeWidth="1.8" fill="url(#boneGrad)">
            {/* Great Trochanter */}
            <circle cx="565" cy="275" r="7" fill="#cbd5e1" />
            {/* Femur Shaft */}
            <path d="M 565 278 L 545 340 L 558 344 L 575 282 Z" />
            {/* Patella (Bánh chè) */}
            <circle cx="538" cy="336" r="4.5" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* Tibia & Fibula (Xương cẳng chân sau) */}
          <g stroke="#334155" strokeWidth="1.8" fill="url(#boneGrad)">
            <path d="M 548 344 L 575 400 L 585 398 L 558 342 Z" />
          </g>

          {/* Tarsus / Hock Joint & Calcaneus (Khớp cổ chân sau & Mấu gót nhọn đặc trưng) */}
          <g id="hock-joint">
            {/* Point of Hock (Calcaneus / Mấu gót) */}
            <polygon points="575,398 592,395 586,410 573,408" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.8" />
            <text x="596" y="405" fontSize="9" fontWeight="600" fill="var(--muted)">
              Khớp khuỷu (Hock)
            </text>
          </g>

          {/* Metatarsus III (Hind Cannon Bone) & Rear Phalanges */}
          <g stroke="#1e293b" strokeWidth="1.8" fill="url(#boneGrad)">
            <rect x="572" y="412" width="9" height="42" rx="2" />
            {/* Rear Fetlock & P1, P2, P3 */}
            <circle cx="576" cy="458" r="5" fill="#cbd5e1" />
            <path d="M 574 460 L 568 470 L 576 472 L 580 462 Z" />
            <path d="M 564 472 L 570 464 L 584 464 L 582 472 Z" fill="#475569" />
          </g>
        </g>
      )}

      {/* ======================================================== */}
      {/* ANATOMICAL REGIONAL CALLOUT LABELS                       */}
      {/* ======================================================== */}
      <g opacity="0.8" style={{ pointerEvents: "none" }}>
        <g transform="translate(130, 115)">
          <circle cx="0" cy="0" r="2.5" fill="var(--brand)" />
          <text x="6" y="3" fontSize="10.5" fontWeight="600" fill="var(--ink)">
            Đầu & Hàm
          </text>
        </g>

        <g transform="translate(210, 140)">
          <circle cx="0" cy="0" r="2.5" fill="var(--brand)" />
          <text x="6" y="3" fontSize="10.5" fontWeight="600" fill="var(--ink)">
            Cổ (Crest)
          </text>
        </g>

        <g transform="translate(325, 175)">
          <circle cx="0" cy="0" r="2.5" fill="var(--brand)" />
          <text x="6" y="3" fontSize="10.5" fontWeight="600" fill="var(--ink)">
            Vai u (Withers)
          </text>
        </g>

        <g transform="translate(425, 195)">
          <circle cx="0" cy="0" r="2.5" fill="var(--brand)" />
          <text x="6" y="3" fontSize="10.5" fontWeight="600" fill="var(--ink)">
            Lưng & Thăn
          </text>
        </g>

        <g transform="translate(565, 192)">
          <circle cx="0" cy="0" r="2.5" fill="var(--brand)" />
          <text x="6" y="3" fontSize="10.5" fontWeight="600" fill="var(--ink)">
            Mông (Croup)
          </text>
        </g>

        <g transform="translate(240, 465)">
          <circle cx="0" cy="0" r="2.5" fill="var(--brand)" />
          <text x="-65" y="3" fontSize="10.5" fontWeight="600" fill="var(--ink)">
            Móng trước
          </text>
        </g>

        <g transform="translate(530, 465)">
          <circle cx="0" cy="0" r="2.5" fill="var(--brand)" />
          <text x="-60" y="3" fontSize="10.5" fontWeight="600" fill="var(--ink)">
            Móng sau
          </text>
        </g>
      </g>
    </svg>
  );
};
export default HorseAnatomyGraphic;
