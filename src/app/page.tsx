import { Header } from "@/components/shared/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText, Layers, Scissors, Languages, Sigma } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-12 space-y-12">
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Zero-Friction Tools for <span className="text-primary">Everyone</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl/relaxed">
            A high-end, modular toolkit designed for speed and simplicity. 
            No ads, no clutter, just tools.
          </p>
        </section>

        <section className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border bg-card/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">PDF 工具</CardTitle>
                  <CardDescription>处理和管理你的 PDF 文档。</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Link
                  href="/tools/pdf-merger"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">PDF 合并</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    将多个 PDF 合并为一个文件
                  </div>
                </Link>
                <div className="block rounded-md px-3 py-2 opacity-60 cursor-not-allowed">
                  <div className="text-sm font-medium">PDF 拆分（敬请期待）</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    按页拆分 PDF 文档
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-card/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">图片工具</CardTitle>
                  <CardDescription>优化、处理你的图片资源。</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Link
                  href="/tools/bg-remover"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">背景移除</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    AI 一键抠图去背景
                  </div>
                </Link>
                <Link
                  href="/tools/image-compressor"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">图片压缩</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    智能压缩减少体积不降质
                  </div>
                </Link>
                <Link
                  href="/tools/watermark-remover"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">去除水印</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    框选区域模糊覆盖，隐藏图片水印
                  </div>
                </Link>
                <Link
                  href="/tools/qr-generator"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">二维码生成</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    将文本或链接快速生成二维码图片
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="border bg-card/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">文件工具</CardTitle>
                  <CardDescription>高效管理多类型文件。</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Link
                  href="/tools/file-archiver"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">文件打包</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    多文件一键打包 ZIP
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="border bg-card/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">文本工具</CardTitle>
                  <CardDescription>快速翻译与处理文本内容。</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Link
                  href="/tools/text-translator"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">文字翻译</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    支持多语言互译，适合日常和工作场景
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="border bg-card/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sigma className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">实用工具</CardTitle>
                  <CardDescription>常用单位和数值的小工具集合。</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Link
                  href="/tools/unit-converter"
                  className="block rounded-md px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="text-sm font-medium">单位转换</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    长度、重量、温度等常见单位一键换算
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>


    </div>
  );
}
