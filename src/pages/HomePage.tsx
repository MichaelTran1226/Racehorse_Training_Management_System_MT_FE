import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Activity, 
  Award, 
  Stethoscope, 
  UserCheck, 
  DollarSign, 
  CheckCircle2, 
  Layers, 
  Database,
  Cpu
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const roles = [
    {
      title: 'Club Manager',
      desc: 'Quản lý toàn diện: danh mục ngựa, phân bổ nhân sự, RBAC, báo cáo tài chính và giám sát Audit Log bất biến.',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Head Trainer',
      desc: 'Lập giáo án huấn luyện theo giai đoạn, phân công ca tập, ghi nhận kết quả và đăng ký giải đua (chặn khi có Medical Lock).',
      icon: Activity,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Veterinarian',
      desc: 'Quản lý bệnh án, đánh dấu tổn thương mô hình xương 2D, kích hoạt và mở khóa lệnh Khóa huấn luyện y tế khẩn cấp.',
      icon: Stethoscope,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      title: 'Groom / Stable Hand',
      desc: 'Vận hành chuồng trại, theo dõi khẩu phần dinh dưỡng theo bữa và xác nhận checklist công việc hàng ngày.',
      icon: UserCheck,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Horse Owner',
      desc: 'Theo dõi hồ sơ lý lịch, lịch trình tập luyện, nhật ký sức khỏe và bảng kê chi phí / doanh thu giải thưởng định kỳ.',
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold tracking-wide uppercase">
          <Award className="w-3.5 h-3.5 text-forest-700" />
          <span>EquiFlow Architecture Foundation</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Racehorse Training &amp; Stable Management System
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
          Hệ thống số hóa toàn diện quy trình vận hành chuồng trại, chăm sóc y tế chuyên sâu, lập giáo án huấn luyện đỉnh cao và quản trị tài chính minh bạch cho các câu lạc bộ ngựa đua.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/health"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-forest-800 text-white font-medium shadow hover:bg-forest-900 transition-colors"
          >
            Kiểm tra trạng thái hệ thống
          </Link>
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            Tài liệu Swagger API (BE)
          </a>
        </div>
      </div>

      {/* Tech Stack Confirmation Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-forest-700" />
          <span>Tech Stack &amp; Kiến trúc kỹ thuật đã chốt (Decision D-01)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg border border-gray-100 bg-slate-50 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-slate-800">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Frontend Foundation</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>React 19.2.8 + Vite 8.3.0</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>TypeScript ~5.8 / ~6.0 (ES2022)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>react-router-dom ^7.2 / ^7.18</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tailwind CSS (EquiFlow Theme)</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-lg border border-gray-100 bg-slate-50 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-slate-800">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Backend Foundation</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Node.js &gt;= 20.19.0 (LTS)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>NestJS ^11.x + TypeScript</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>RESTful API + Swagger / OpenAPI</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Helmet + Global Pipes + RBAC Guards</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-lg border border-gray-100 bg-slate-50 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-slate-800">
              <Database className="w-4 h-4 text-purple-600" />
              <span>Database &amp; Storage</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prisma ORM v6</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PostgreSQL (Supabase / Local)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dual Connection URL (Pool &amp; Direct)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Immutable AuditLog Table</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5 User Roles Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Năm vai trò người dùng cốt lõi (5 User Roles)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((r, idx) => {
            const IconComponent = r.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${r.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
