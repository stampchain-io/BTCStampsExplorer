#!/bin/bash
# deno run -A main.ts build

# Comment out DB_HOST in .env if not already without chagnging the rest of the line
# sed -i 's/^#*DB_HOST/#DB_HOST/' .env

# remove comment on the DB_HOST line
sed -i 's/^#DB_HOST/DB_HOST/' .env

