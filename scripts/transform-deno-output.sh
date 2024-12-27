#!/bin/bash

MODE=$1
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE"

create_empty_rdjson() {
  local source_name=$1
  local source_url=$2
  echo "{\"source\":{\"name\":\"$source_name\",\"url\":\"$source_url\"},\"diagnostics\":[]}"
}

process_fmt_diff() {
  # Extract JSON content from deno fmt output
  local json_content
  json_content=$(sed -n '/^{/,/^}/p' "$1" | sed 's/^Task check:fmt:debug$//' | tr -d '\r')
  
  if [ -z "$json_content" ]; then
    echo "[]"
    return
  fi
  
  # Transform fmt output to rdjson format
  echo "["
  local first=true
  
  while IFS= read -r file; do
    if [ "$first" = true ]; then
      first=false
    else
      echo ","
    fi
    printf "{\"message\":\"File is not properly formatted\",\"location\":{\"path\":\"%s\",\"range\":{\"start\":{\"line\":1,\"column\":1},\"end\":{\"line\":1,\"column\":1}}},\"severity\":\"WARNING\",\"code\":{\"value\":\"fmt\",\"url\":\"https://deno.land/manual/tools/formatter\"}}" "$file"
  done < <(echo "$json_content" | jq -r '.files[]? // empty' 2>/dev/null)
  
  echo "]"
}

if [ "$MODE" = "lint" ]; then
  # Extract JSON from deno lint output
  json_content=$(sed -n '/^{/,/^}/p' "$TEMP_FILE" | sed 's/^Task check:lint:debug$//' | tr -d '\r')
  
  if [ -z "$json_content" ] || ! echo "$json_content" | jq empty 2>/dev/null; then
    create_empty_rdjson "denolint" "https://deno.land/manual/tools/linter"
    rm "$TEMP_FILE" 2>/dev/null
    exit 0
  fi

  # Transform lint output to rdjson
  (echo "{\"source\":{\"name\":\"denolint\",\"url\":\"https://deno.land/manual/tools/linter\"},\"diagnostics\":"; \
   echo "$json_content" | jq -c '[.diagnostics[] | {
      message: .message,
      location: {
        path: (.filename | sub("file://"; "")),
        range: {
          start: {
            line: .range.start.line,
            column: .range.start.col
          },
          end: {
            line: .range.end.line,
            column: .range.end.col
          }
        }
      },
      severity: "WARNING",
      code: {
        value: .code,
        url: ("https://deno.land/manual/tools/linter#" + .code)
      }
    }]'; \
   echo "}")

elif [ "$MODE" = "fmt" ]; then
  # Transform fmt output to rdjson
  (
    echo "{\"source\":{\"name\":\"denofmt\",\"url\":\"https://deno.land/manual/tools/formatter\"},\"diagnostics\":"
    process_fmt_diff "$TEMP_FILE"
    echo "}"
  )
else
  echo "Usage: $0 <lint|fmt>" >&2
  rm "$TEMP_FILE"
  exit 1
fi

rm "$TEMP_FILE" "${TEMP_FILE}.json" 2>/dev/null
