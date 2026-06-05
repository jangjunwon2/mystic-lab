import { describe, it, expect } from "vitest";
import { pickText, formatCount, formatPostDate, avatarGradient, type InstaPost } from "./instagram-config";

describe("pickText", () => {
  it("설정 언어를 우선 선택", () => {
    expect(pickText({ en: "hi", ko: "안녕" }, "ko")).toBe("안녕");
  });

  it("없으면 en으로 폴백", () => {
    expect(pickText({ en: "hi" }, "ko")).toBe("hi");
  });

  it("레거시 단일 문자열 허용", () => {
    expect(pickText("legacy", "ko")).toBe("legacy");
  });

  it("undefined·빈 맵은 빈 문자열", () => {
    expect(pickText(undefined, "ko")).toBe("");
    expect(pickText({}, "ko")).toBe("");
  });
});

describe("formatCount", () => {
  it("1000 미만은 그대로", () => {
    expect(formatCount(999)).toBe("999");
  });

  it("k 단위", () => {
    expect(formatCount(1000)).toBe("1k");
    expect(formatCount(1200)).toBe("1.2k");
    expect(formatCount(84200)).toBe("84.2k");
  });

  it("m 단위", () => {
    expect(formatCount(1_000_000)).toBe("1m");
  });
});

describe("avatarGradient", () => {
  it("같은 시드는 같은 결과(결정적)", () => {
    expect(avatarGradient("alex")).toBe(avatarGradient("alex"));
  });

  it("다른 시드는 다른 색", () => {
    expect(avatarGradient("alex")).not.toBe(avatarGradient("sara"));
  });

  it("빈 문자열도 유효한 그라데이션 반환", () => {
    expect(avatarGradient("")).toContain("linear-gradient");
  });
});

describe("formatPostDate", () => {
  it("exactDate 없으면 상대 표기 사용", () => {
    const post: InstaPost = { id: "p1", image: "", caption: {}, likes: 0, date: { en: "3 weeks ago" }, comments: [] };
    expect(formatPostDate(post, "en")).toBe("3 weeks ago");
  });
});
