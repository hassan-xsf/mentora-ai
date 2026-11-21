# Toolchains for every editor language, multi-arch (the Piston image is x86-only). See docs/CODE_RUNNER.md.
FROM alpine:3.20
RUN apk add --no-cache python3 nodejs deno g++ go rust openjdk21-jdk
ENV PATH=/usr/lib/jvm/java-21-openjdk/bin:$PATH \
    HOME=/tmp GOPATH=/tmp/go GOCACHE=/gocache GOTOOLCHAIN=local CGO_ENABLED=0 GOFLAGS=-buildvcs=false \
    DENO_DIR=/tmp/deno DENO_NO_UPDATE_CHECK=1 PYTHONDONTWRITEBYTECODE=1
