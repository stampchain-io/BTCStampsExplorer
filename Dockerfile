FROM denoland/deno:alpine

WORKDIR /app

COPY . .

EXPOSE 8000

RUN deno cache main.ts
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-run", "--allow-write", "--allow-env", "main.ts"]
