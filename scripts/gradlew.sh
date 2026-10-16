#!/usr/bin/env bash
# Runs android/gradlew on a JDK that Gradle 8.14 can run on (17 or 21). On
# macOS it picks an installed JDK 21/17 when JAVA_HOME is unset or newer.
set -euo pipefail
cd "$(dirname "$0")/../android"
if [[ -z "${JAVA_HOME:-}" ]] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -qE 'version "(17|21)\.'; then
  if [[ -x /usr/libexec/java_home ]]; then
    JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17)"
    export JAVA_HOME
  fi
fi
exec ./gradlew "$@"
