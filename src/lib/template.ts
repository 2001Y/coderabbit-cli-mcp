export function buildCoderabbitConfigTemplate(): string {
  return `# CodeRabbit CLI configuration
# 公式リファレンスに沿ったサンプルです。必要に応じてコメントを外して調整してください。
# https://cli.coderabbit.ai/

review:
  # diff の対象: all | committed | uncommitted
  type: all
  # mode: interactive | plain | prompt-only
  mode: plain
  # reviewer の厳しさ: standard | strict | relaxed
  tone: standard

output:
  # text | markdown | prompt-only
  format: text
  color: auto

filters:
  include:
    - src/**
  exclude:
    - '**/*.md'

experiments:
  auto_auth: false
  retry_failed_requests: true
`;
}
