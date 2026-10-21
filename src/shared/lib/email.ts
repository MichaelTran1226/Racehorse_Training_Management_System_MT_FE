// Luật email dùng chung cho mọi form tài khoản (đăng nhập, đăng ký, mời, quên mật khẩu) và mock.
// Giống BE src/common/utils/input.ts: chỉ nhận @gmail.com; phần trước @ bắt đầu và kết thúc bằng
// chữ/số, giữa chỉ có chữ, số, . _ + -, không có "..".
export const EMAIL_RE = /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?@gmail\.com$/i;

// Độ dài tối đa của một địa chỉ email (RFC 5321).
export const EMAIL_MAX = 254;
