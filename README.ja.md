# extract-prompts

画像や動画からComfyUIワークフローとA1111のプロンプトを抽出するコマンドラインツールです。

## インストール

```bash
npm install -g @craftgear/extract-prompts
```

## 使い方

```bash
extract-prompts <files...> [options]
```

### 例

```bash
# 単一画像から抽出
extract-prompts image.png

# グロブパターンで複数ファイルから抽出
extract-prompts *.png *.webm

# 読みやすい形式で出力
extract-prompts *.png --pretty

# 抽出したワークフローをディレクトリに保存
extract-prompts *.png --save ./workflows

# スペースを含むディレクトリに保存（クォートを使用）
extract-prompts *.png --save "スペース付きディレクトリ"

# 入力ファイルのディレクトリに保存（最初の入力ファイルのディレクトリを使用）
extract-prompts *.png --save

# A1111パラメータをComfyUIワークフロー形式に変換
extract-prompts a1111_image.png --convert-a1111

# 変換と読みやすい出力を組み合わせ
extract-prompts a1111_image.png --convert-a1111 --pretty

# 静寂モード（エラー以外の出力を抑制）
extract-prompts *.png --quiet
```

## オプション

- `-p, --pretty`: 読みやすい出力形式（デフォルト: JSON）
- `-s, --save [directory]`: ワークフローをディレクトリに保存（未指定時は入力ディレクトリを使用）
- `-q, --quiet`: エラー以外の出力を抑制
- `--overwrite`: 保存時に既存ファイルを上書き
- `--name-pattern <pattern>`: ファイル命名パターン (source|sequential|timestamp) [デフォルト: source]
- `--organize <mode>`: 保存ファイルの整理 (none|format|date) [デフォルト: none]
- `--json-file`: 入力ファイルと同じ名前でJSONファイルを作成
- `--convert-a1111`: A1111パラメータをComfyUIワークフロー形式に変換

## 対応フォーマット

### 画像
- PNG
- JPEG/JPG
- WebP

### 動画
- MP4
- WebM
- MOV

## 出力形式

### JSON (デフォルト)
完全なワークフローデータを含むJSON出力

### Pretty (--prettyフラグ)
人間が読みやすい形式で以下を表示:
- LoRAモデルと強度
- プロンプト（検出時はポジティブ/ネガティブ）
- サンプラー設定（ステップ、CFG、スケジューラー、シード）
- モデル情報

## 機能

- **ComfyUIワークフロー抽出**: ComfyUI生成コンテンツから完全なワークフローJSONを抽出
- **A1111からComfyUIへの変換**: A1111パラメータをComfyUIワークフロー形式に変換（LoRAとアップスケーラー完全対応）
- **プロンプト検出**: 様々なノードタイプからプロンプトを賢く識別・抽出
- **LoRA対応**: 複数のローダー形式からLoRAモデルとその強度を抽出
- **アップスケーラー対応**: 変換時にhires.fixとアップスケーラーパラメータを処理
- **バッチ処理**: グロブパターンで複数ファイルを一度に処理
- **柔軟な出力**: 様々な用途に対応した複数の出力形式

## 対応ノードタイプ

- CLIPTextEncode
- WanVideoTextEncode
- Text Multiline
- easy showAnything
- KSampler / WanVideoSampler
- Power Lora Loader (rgthree)
- LoraTagLoader
- 各種モデルローダー

## 例

### 基本的な抽出
```bash
extract-prompts generated_image.png
```

### LoRAとプロンプトの詳細を含む読みやすい形式
```bash
extract-prompts workflow.webm --pretty
```

### 日付別に整理してワークフローを保存
```bash
extract-prompts *.png --save ./extracted --organize date
```

### スペースを含むディレクトリに保存
```bash
# スペース付きディレクトリパスにはクォートを使用
extract-prompts *.png --save "出力ディレクトリ"
extract-prompts *.png --save 'スペース付きフォルダ'
```

### A1111からComfyUIへの変換
```bash
# A1111パラメータをComfyUIワークフローに変換
extract-prompts a1111_image.png --convert-a1111

# A1111プロンプトのLoRAタグの例:
# "beautiful girl <lora:style1:0.8> <lora:character:0.6>, masterpiece"
# LoRAローダーノードを含むComfyUIワークフローを生成

# アップスケーラーパラメータの例:
# Hires.fix: true, Hires upscaler: ESRGAN_4x, Hires steps: 10, Hires denoising: 0.5
# 2パス生成用のアップスケーラーノードを含むComfyUIワークフローを生成
```

## ライセンス

MIT
