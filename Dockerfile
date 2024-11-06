# FROM denoland/deno:1.36.0-alpine
FROM denoland/deno:alpine-2.0.5

ENV DENO_ENV=production

WORKDIR /app

COPY . .

RUN deno run -A main.ts build --lock=lock.json --lock-write

RUN deno cache --lock=lock.json main.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-run", "--allow-write", "--allow-env", "main.ts"]
