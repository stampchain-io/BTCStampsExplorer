#!/bin/bash

MODE=$1

if [ "$MODE" = "lint" ]; then
  # Read JSON from stdin and transform to rdjson format
  jq '{
    source: {
      name: "denolint",
      url: "https://deno.land/manual/tools/linter"
    },
    diagnostics: [.diagnostics[] | {
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
    }]
  }'
elif [ "$MODE" = "fmt" ]; then
  # Transform fmt output to rdjson format
  echo '{"source":{"name":"denofmt","url":"https://deno.land/manual/tools/formatter"},"diagnostics":['
  first=true
  while IFS= read -r line; do
    if [[ $line =~ "Format check failed for: "* ]]; then
      file=$(echo "$line" | sed 's/Format check failed for: //')
      if [ "$first" = true ]; then
        first=false
      else
        echo ","
      fi
      echo "{\"message\":\"File is not properly formatted\",\"location\":{\"path\":\"$file\",\"range\":{\"start\":{\"line\":1,\"column\":1},\"end\":{\"line\":1,\"column\":1}}},\"severity\":\"WARNING\",\"code\":{\"value\":\"fmt\",\"url\":\"https://deno.land/manual/tools/formatter\"}}"
    fi
  done
  echo ']}'
else
  echo "Usage: $0 <lint|fmt>" >&2
  exit 1
fi
