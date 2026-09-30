// Ghép tên class: cx("a", cond && "b") => "a b". Bỏ qua giá trị falsy.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
