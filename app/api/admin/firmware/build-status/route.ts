import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT 환경변수 미설정" }, { status: 500 });
  }

  try {
    // 1. 최신 워크플로 실행 정보 가져오기
    const runsRes = await fetch(
      "https://api.github.com/repos/jangjunwon2/nexus-firmware/actions/workflows/firmware-deploy.yml/runs?per_page=1",
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_PAT}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!runsRes.ok) {
      return NextResponse.json({ error: "GitHub Actions runs 조회 실패" }, { status: runsRes.status });
    }

    const runsData = await runsRes.json();
    const latestRun = runsData.workflow_runs?.[0];

    if (!latestRun) {
      return NextResponse.json({ message: "No workflow runs found." }, { status: 404 });
    }

    // 2. 해당 run의 상세 Job 단계 가져오기
    const jobsRes = await fetch(
      `https://api.github.com/repos/jangjunwon2/nexus-firmware/actions/runs/${latestRun.id}/jobs`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_PAT}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!jobsRes.ok) {
      return NextResponse.json({
        id: latestRun.id,
        status: latestRun.status,
        conclusion: latestRun.conclusion,
        html_url: latestRun.html_url,
        jobs: [],
      });
    }

    const jobsData = await jobsRes.json();
    const formattedJobs = (jobsData.jobs ?? []).map((job: any) => ({
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      steps: (job.steps ?? []).map((step: any) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number,
      })),
    }));

    return NextResponse.json({
      id: latestRun.id,
      status: latestRun.status,
      conclusion: latestRun.conclusion,
      html_url: latestRun.html_url,
      updated_at: latestRun.updated_at,
      jobs: formattedJobs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
