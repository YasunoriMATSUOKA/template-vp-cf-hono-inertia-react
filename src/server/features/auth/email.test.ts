import { describe, it, expect, vi, afterEach } from "vitest";
import { escapeHtml, renderHtml, renderText, sendAuthEmail, type AuthEmail } from "./email";

const sample: AuthEmail = {
  to: "user@example.com",
  subject: "確認",
  heading: "見出し",
  actionLabel: "ボタン",
  url: "https://example.com/verify?token=abc&x=1",
};

describe("escapeHtml", () => {
  it("HTML 特殊文字をエスケープする", () => {
    expect(escapeHtml(`<a href="x">&y`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;y");
  });

  it("通常文字はそのまま", () => {
    expect(escapeHtml("日本語 abc 123")).toBe("日本語 abc 123");
  });
});

describe("renderText", () => {
  it("heading / actionLabel / url を含むプレーンテキストを返す", () => {
    const t = renderText(sample);
    expect(t).toContain(sample.heading);
    expect(t).toContain(sample.actionLabel);
    expect(t).toContain(sample.url);
  });
});

describe("renderHtml", () => {
  it("url を href とフォールバック文に埋め込む", () => {
    const html = renderHtml(sample);
    expect(html).toContain(`href="https://example.com/verify?token=abc&amp;x=1"`);
    expect(html).toContain(sample.heading);
    expect(html).toContain(sample.actionLabel);
  });

  it("見出し/ラベルに HTML が混ざってもエスケープされる (インジェクション防止)", () => {
    const html = renderHtml({ ...sample, heading: `<script>alert(1)</script>` });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("sendAuthEmail transport の振り分け", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("(1) MAIL_RELAY_URL があればリレーへ POST する", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const env = { MAIL_RELAY_URL: "http://localhost:3001/send", EMAIL_FROM: "from@e.test" } as Env;

    await sendAuthEmail(env, sample);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/send");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ to: sample.to, subject: sample.subject, from: "from@e.test" });
    expect(body.html).toContain("href=");
  });

  it("(1') リレーが非 2xx を返したら throw する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("err", { status: 500 })),
    );
    const env = { MAIL_RELAY_URL: "http://localhost:3001/send" } as Env;
    await expect(sendAuthEmail(env, sample)).rejects.toThrow(/relay responded 500/);
  });

  it("(2) 本番ビルド (DEV=false) では send_email binding を使う", async () => {
    vi.stubEnv("DEV", false);
    const send = vi.fn(async () => ({}) as unknown);
    const env = { EMAIL_FROM: "from@e.test", SEND_EMAIL: { send } } as unknown as Env;

    await sendAuthEmail(env, sample);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]![0]).toMatchObject({
      from: "from@e.test",
      to: sample.to,
      subject: sample.subject,
    });
  });

  it("(3) dev かつ relay 無しなら実送信せず console 出力", async () => {
    vi.stubEnv("DEV", true);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const env = { EMAIL_FROM: "from@e.test" } as Env;

    await sendAuthEmail(env, sample);

    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0]![0])).toContain(sample.url);
  });
});
