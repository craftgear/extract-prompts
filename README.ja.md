# extract-prompts

画像や動画からComfyUIワークフローとA1111のプロンプトを抽出します。

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
extract-prompts *.png --output pretty

# 抽出したワークフローをディレクトリに保存
extract-prompts *.png --save ./workflows

# 静寂モード（エラー以外の出力を抑制）
extract-prompts *.png --quiet
```

## オプション

- `-o, --output <format>`: 出力形式 (json|pretty|raw) [デフォルト: json]
- `-s, --save <directory>`: ワークフローをディレクトリに保存
- `-q, --quiet`: エラー以外の出力を抑制
- `--overwrite`: 保存時に既存ファイルを上書き
- `--name-pattern <pattern>`: ファイル命名パターン (source|sequential|timestamp) [デフォルト: source]
- `--organize <mode>`: 保存ファイルの整理 (none|format|date) [デフォルト: none]

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
完全なワークフローデータを含む生のJSON出力。

### Pretty
人間が読みやすい形式で以下を表示:
- LoRAモデルと強度
- プロンプト（検出時はポジティブ/ネガティブ）
- サンプラー設定（ステップ、CFG、スケジューラー、シード）
- モデル情報
- ワークフロー統計

### Raw
ワークフローJSONのみのシンプルな形式。

## 機能

- **ComfyUIワークフロー抽出**: ComfyUI生成コンテンツから完全なワークフローJSONを抽出
- **プロンプト検出**: 様々なノードタイプからプロンプトを賢く識別・抽出
- **LoRA対応**: 複数のローダー形式からLoRAモデルとその強度を抽出
- **保守的ラベリング**: 確信がある場合のみポジティブ/ネガティブの区別を表示
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
extract-prompts workflow.webm --output pretty
```

### 日付別に整理してワークフローを保存
```bash
extract-prompts *.png --save ./extracted --organize date
```

## ライセンス

MIT
