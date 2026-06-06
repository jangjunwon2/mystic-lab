import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  // 어드민 계정은 탈퇴 불가
  if (user.email === process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "관리자 계정은 탈퇴할 수 없습니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = await createAdminClient() as any;
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "탈퇴 처리에 실패했습니다." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
