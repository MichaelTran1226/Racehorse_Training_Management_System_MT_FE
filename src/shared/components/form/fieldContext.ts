import { createContext, useContext } from "react";

export interface FieldControl {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

// Field "chia sẻ" id, mô tả lỗi và trạng thái invalid cho ô nhập nằm bên trong qua Context,
// nên trang không phải tự đặt id/htmlFor/aria-describedby cho từng ô.
export const FieldContext = createContext<FieldControl | null>(null);

export function useFieldControl(): FieldControl | null {
  return useContext(FieldContext);
}
