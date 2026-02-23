"use client";

import { useMemo, useState } from "react";
import { pinyin } from "pinyin-pro";
import { Header } from "@/components/shared/header";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Languages } from "lucide-react";

type Mode = "hanziToPinyin" | "pinyinToHanzi";

type PinyinEntry = {
  char: string;
  pinyin: string[];
};

type HanziSummary = {
  char: string;
  pinyins: string[];
};

type PinyinLookupItem = {
  token: string;
  chars: string[];
};

const HANZI_PINYIN_ENTRIES: PinyinEntry[] = [
  { char: "你", pinyin: ["ni3"] },
  { char: "好", pinyin: ["hao3"] },
  { char: "我", pinyin: ["wo3"] },
  { char: "是", pinyin: ["shi4"] },
  { char: "在", pinyin: ["zai4"] },
  { char: "有", pinyin: ["you3"] },
  { char: "没", pinyin: ["mei2"] },
  { char: "不", pinyin: ["bu4"] },
  { char: "人", pinyin: ["ren2"] },
  { char: "他", pinyin: ["ta1"] },
  { char: "她", pinyin: ["ta1"] },
  { char: "它", pinyin: ["ta1"] },
  { char: "们", pinyin: ["men5"] },
  { char: "这", pinyin: ["zhe4"] },
  { char: "那", pinyin: ["na4"] },
  { char: "的", pinyin: ["de5"] },
  { char: "一", pinyin: ["yi1"] },
  { char: "二", pinyin: ["er4"] },
  { char: "三", pinyin: ["san1"] },
  { char: "四", pinyin: ["si4"] },
  { char: "五", pinyin: ["wu3"] },
  { char: "六", pinyin: ["liu4"] },
  { char: "七", pinyin: ["qi1"] },
  { char: "八", pinyin: ["ba1"] },
  { char: "九", pinyin: ["jiu3"] },
  { char: "十", pinyin: ["shi2"] },
  { char: "中", pinyin: ["zhong1"] },
  { char: "国", pinyin: ["guo2"] },
  { char: "学", pinyin: ["xue2"] },
  { char: "生", pinyin: ["sheng1"] },
  { char: "老", pinyin: ["lao3"] },
  { char: "师", pinyin: ["shi1"] },
  { char: "同", pinyin: ["tong2"] },
  { char: "事", pinyin: ["shi4"] },
  { char: "朋", pinyin: ["peng2"] },
  { char: "友", pinyin: ["you3"] },
  { char: "家", pinyin: ["jia1"] },
  { char: "学", pinyin: ["xue2"] },
  { char: "校", pinyin: ["xiao4"] },
  { char: "公", pinyin: ["gong1"] },
  { char: "司", pinyin: ["si1"] },
  { char: "吃", pinyin: ["chi1"] },
  { char: "喝", pinyin: ["he1"] },
  { char: "看", pinyin: ["kan4"] },
  { char: "说", pinyin: ["shuo1"] },
  { char: "写", pinyin: ["xie3"] },
  { char: "听", pinyin: ["ting1"] },
  { char: "走", pinyin: ["zou3"] },
  { char: "来", pinyin: ["lai2"] },
  { char: "去", pinyin: ["qu4"] },
  { char: "上", pinyin: ["shang4"] },
  { char: "下", pinyin: ["xia4"] },
  { char: "天", pinyin: ["tian1"] },
  { char: "地", pinyin: ["di4"] },
  { char: "水", pinyin: ["shui3"] },
  { char: "火", pinyin: ["huo3"] },
  { char: "山", pinyin: ["shan1"] },
  { char: "海", pinyin: ["hai3"] },
  { char: "日", pinyin: ["ri4"] },
  { char: "月", pinyin: ["yue4"] },
  { char: "年", pinyin: ["nian2"] },
  { char: "时", pinyin: ["shi2"] },
  { char: "分", pinyin: ["fen1"] },
  { char: "钟", pinyin: ["zhong1"] },
  { char: "大", pinyin: ["da4"] },
  { char: "小", pinyin: ["xiao3"] },
  { char: "多", pinyin: ["duo1"] },
  { char: "少", pinyin: ["shao3"] },
  { char: "高", pinyin: ["gao1"] },
  { char: "低", pinyin: ["di1"] },
  { char: "新", pinyin: ["xin1"] },
  { char: "旧", pinyin: ["jiu4"] },
  { char: "爱", pinyin: ["ai4"] },
  { char: "喜", pinyin: ["xi3"] },
  { char: "欢", pinyin: ["huan1"] },
  { char: "想", pinyin: ["xiang3"] },
  { char: "知", pinyin: ["zhi1"] },
  { char: "道", pinyin: ["dao4"] },
  { char: "问", pinyin: ["wen4"] },
  { char: "答", pinyin: ["da2"] },
  { char: "工", pinyin: ["gong1"] },
  { char: "作", pinyin: ["zuo4"] },
  { char: "开", pinyin: ["kai1"] },
  { char: "关", pinyin: ["guan1"] },
  { char: "用", pinyin: ["yong4"] },
  { char: "书", pinyin: ["shu1"] },
  { char: "电", pinyin: ["dian4"] },
  { char: "话", pinyin: ["hua4"] },
  { char: "机", pinyin: ["ji1"] },
  { char: "车", pinyin: ["che1"] },
];

const HANZI_TO_PINYIN: Record<string, string[]> = {};
const PINYIN_TO_HANZI: Record<string, string[]> = {};

for (const entry of HANZI_PINYIN_ENTRIES) {
  if (!HANZI_TO_PINYIN[entry.char]) {
    HANZI_TO_PINYIN[entry.char] = entry.pinyin;
  }
  for (const p of entry.pinyin) {
    const key = p.toLowerCase();
    if (!PINYIN_TO_HANZI[key]) {
      PINYIN_TO_HANZI[key] = [];
    }
    if (!PINYIN_TO_HANZI[key].includes(entry.char)) {
      PINYIN_TO_HANZI[key].push(entry.char);
    }
  }
}

function isHanzi(char: string) {
  return /[\u4e00-\u9fff]/.test(char);
}

function numericPinyinToToneMarked(syllable: string): string {
  const match = syllable.match(/^([a-zü]+)([1-5])$/i);
  if (!match) {
    return syllable;
  }

  const base = match[1].toLowerCase();
  const tone = Number(match[2]);

  if (tone === 5 || tone === 0) {
    return base;
  }

  const toneMap: Record<string, string[]> = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
  };

  const vowels = ["a", "e", "o", "i", "u", "ü"];

  let index = base.indexOf("a");
  if (index === -1) {
    index = base.indexOf("e");
  }
  if (index === -1) {
    const ouIndex = base.indexOf("ou");
    if (ouIndex !== -1) {
      index = ouIndex;
    }
  }
  if (index === -1) {
    for (let i = base.length - 1; i >= 0; i -= 1) {
      if (vowels.includes(base[i])) {
        index = i;
        break;
      }
    }
  }

  if (index === -1) {
    return base;
  }

  const target = base[index];
  const marks = toneMap[target];
  if (!marks) {
    return base;
  }

  const marked = marks[tone - 1] ?? target;
  return base.slice(0, index) + marked + base.slice(index + 1);
}

function isToneMarkedPinyin(value: string): boolean {
  const toneMarks = "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";
  for (const ch of value) {
    if (toneMarks.includes(ch)) {
      return true;
    }
  }
  return false;
}

function formatPinyinList(values: string[] | undefined): string {
  if (!values || values.length === 0) {
    return "";
  }
  return values.join(", ");
}

export default function HanziPinyinPage() {
  const [mode, setMode] = useState<Mode>("hanziToPinyin");
  const [inputText, setInputText] = useState("");
  const [singleCharQuery, setSingleCharQuery] = useState("");

  const hanziResult = useMemo(() => {
    if (mode !== "hanziToPinyin") {
      return null;
    }

    const trimmed = inputText.trim();
    if (!trimmed) {
      return null;
    }

    const pinyinTokens: string[] = [];
    const summaryMap = new Map<string, Set<string>>();

    for (const ch of Array.from(trimmed)) {
      if (isHanzi(ch)) {
        const allPinyins = pinyin(ch, {
          toneType: "symbol",
          type: "array",
          multiple: true,
        });

        if (!summaryMap.has(ch)) {
          summaryMap.set(ch, new Set<string>());
        }
        const set = summaryMap.get(ch)!;
        for (const py of allPinyins) {
          if (isToneMarkedPinyin(py)) {
            set.add(py);
          }
        }

        const markedCandidates = allPinyins.filter((py) => isToneMarkedPinyin(py));
        const preferred = markedCandidates[0] ?? allPinyins[0] ?? ch;
        pinyinTokens.push(preferred);
      } else if (/\s/.test(ch)) {
        pinyinTokens.push("");
      } else {
        pinyinTokens.push(ch);
      }
    }

    const pinyinText = pinyinTokens.filter((token) => token !== "").join(" ");

    const summary: HanziSummary[] = Array.from(summaryMap.entries()).map(([char, pinyinSet]) => ({
      char,
      pinyins: Array.from(pinyinSet),
    }));

    return { pinyinText, summary };
  }, [mode, inputText]);

  const pinyinLookup = useMemo(() => {
    if (mode !== "pinyinToHanzi") {
      return null;
    }

    const trimmed = inputText.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }

    const tokens = trimmed
      .split(/[\s,;，；]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const items: PinyinLookupItem[] = tokens.map((token) => {
      const key = token;
      const chars = PINYIN_TO_HANZI[key] ?? [];
      return { token, chars };
    });

    const totalMatches = items.reduce((sum, item) => sum + item.chars.length, 0);

    return { items, totalMatches };
  }, [mode, inputText]);

  const singleCharInfo = useMemo(() => {
    const trimmed = singleCharQuery.trim();
    if (!trimmed) {
      return null;
    }

    const first = Array.from(trimmed)[0];
    if (!isHanzi(first)) {
      return { char: first, pinyins: undefined };
    }

    const rawPinyins = pinyin(first, {
      toneType: "symbol",
      type: "array",
      multiple: true,
    });

    const filtered = rawPinyins.filter((py) => isToneMarkedPinyin(py));
    const pinyins = filtered.length > 0 ? filtered : rawPinyins;

    return { char: first, pinyins };
  }, [singleCharQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Languages className="h-7 w-7 text-emerald-500" />
            Chinese Pinyin Helper
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Convert between Chinese characters and Pinyin, or quickly look up common mappings.
          </p>
        </div>

        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Mode</p>
                <p className="text-xs text-muted-foreground">
                  Choose whether to convert Chinese text to Pinyin or find characters by Pinyin.
                </p>
              </div>
              <div className="inline-flex rounded-lg border bg-muted/60 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("hanziToPinyin")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    mode === "hanziToPinyin"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Characters → Pinyin
                </button>
                <button
                  type="button"
                  onClick={() => setMode("pinyinToHanzi")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    mode === "pinyinToHanzi"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pinyin → Characters
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)] items-start">
              <div className="space-y-3">
                {mode === "hanziToPinyin" ? (
                  <>
                    <p className="text-sm font-medium">Chinese input</p>
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type or paste Chinese text here to see the Pinyin, for example: 你好吗？"
                      className="h-40 resize-none"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Single character quick lookup</p>
                      <Input
                        value={singleCharQuery}
                        onChange={(e) => setSingleCharQuery(e.target.value)}
                        maxLength={4}
                        placeholder="Enter one Chinese character"
                      />
                      {singleCharInfo && (
                        <div className="rounded-md border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                          {singleCharInfo.pinyins === undefined ? (
                            <span>
                              No Chinese character detected in{" "}
                              <span className="font-mono text-foreground">{singleCharInfo.char}</span>.
                            </span>
                          ) : singleCharInfo.pinyins && singleCharInfo.pinyins.length > 0 ? (
                            <span>
                              <span className="font-mono text-foreground mr-1">{singleCharInfo.char}</span>
                              Pinyin:{" "}
                              <span className="text-foreground">
                                {formatPinyinList(singleCharInfo.pinyins)}
                              </span>
                            </span>
                          ) : (
                            <span>
                              <span className="font-mono text-foreground mr-1">{singleCharInfo.char}</span>
                              is not in the built-in mapping yet.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">Pinyin input</p>
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type Pinyin with tone numbers, separated by spaces, for example: ni3 hao3"
                      className="h-40 resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Use lower case Pinyin with tone numbers 1-5 (e.g. ni3 hao3). Results are based on a curated set of common
                      characters.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Lookup result</p>
                  {mode === "hanziToPinyin" && hanziResult && (
                    <p className="text-[11px] text-muted-foreground">
                      Characters found:{" "}
                      <span className="font-mono text-foreground">{hanziResult.summary.length}</span>
                    </p>
                  )}
                  {mode === "pinyinToHanzi" && pinyinLookup && (
                    <p className="text-[11px] text-muted-foreground">
                      Total matches:{" "}
                      <span className="font-mono text-foreground">{pinyinLookup.totalMatches}</span>
                    </p>
                  )}
                </div>

                {mode === "hanziToPinyin" ? (
                  <>
                    <div className="rounded-md border bg-muted/40 p-3 text-sm min-h-[120px]">
                      {hanziResult ? (
                        <p className="whitespace-pre-wrap break-words">
                          {hanziResult.pinyinText || "No Pinyin mapping found for the given text."}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Pinyin will appear here after you enter Chinese text on the left.
                        </p>
                      )}
                    </div>

                    <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2 max-h-[220px] overflow-auto">
                      <p className="font-medium text-xs">Per-character mapping</p>
                      {hanziResult && hanziResult.summary.length > 0 ? (
                        <div className="grid grid-cols-[minmax(0,0.5fr)_minmax(0,2.5fr)] gap-x-3 gap-y-1.5">
                          {hanziResult.summary.map((item) => (
                            <div key={item.char} className="contents">
                              <span className="font-mono text-base">{item.char}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {item.pinyins.length > 0
                                  ? formatPinyinList(item.pinyins)
                                  : "Not in mapping"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Detected characters and their Pinyin will be listed here once available.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm min-h-[180px] max-h-[320px] overflow-auto space-y-3">
                    {pinyinLookup ? (
                      pinyinLookup.items.map((item) => (
                        <div key={item.token} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs bg-background/70 border px-2 py-0.5 rounded-full">
                              {numericPinyinToToneMarked(item.token)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {item.chars.length === 0
                                ? "No characters mapped"
                                : `${item.chars.length} character${item.chars.length > 1 ? "s" : ""}`}
                            </span>
                          </div>
                          {item.chars.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 text-base">
                              {item.chars.map((ch) => (
                                <span
                                  key={item.token + "-" + ch}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background border text-sm"
                                >
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Matching characters will be listed here once you enter Pinyin input on the left.
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                  This helper uses a curated list of common characters and Pinyin readings. For characters that are not
                  in the built-in mapping or have multiple pronunciations, please double-check with a dedicated Chinese
                  dictionary if needed.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
