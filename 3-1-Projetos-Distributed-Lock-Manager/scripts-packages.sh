#!/bin/bash

unset BASE_PATH
unset DIST_PATH
unset JEST
unset DEPCHECK_PATH
unset TS_CONFIG_BUILD_PATH
unset TS_CONFIG_PATH
unset TEST_PATH
unset TEST_UNIT_PATH
unset TEST_INTEGRATION_PATH

BASE_PATH="."
DIST_PATH="./dist"
JEST="${BASE_PATH}/node_modules/jest/bin/jest.js"
TS_CONFIG_BUILD_PATH="tsconfig-build.json"
DEPCHECK_PATH=".depcheckrc"
COVERAGE_PATH="coverage"
TS_CONFIG_PATH="tsconfig.json"
TEST_PATH="${DIST_PATH}/tests"
TEST_UNIT_PATH="${TEST_PATH}/unit"
TEST_INTEGRATION_PATH="${TEST_PATH}/integration"

execute_clean(){
  if ! pnpm rimraf "${DIST_PATH}"; then
    exit 1
  fi

  if ! pnpm rimraf "${COVERAGE_PATH}"; then
    exit 1
  fi
}

execute_build(){
  if ! tsc -p "$1"; then
    exit 1
  fi
}

execute_lint(){
  if ! eslint .; then
    exit 1
  fi
}

execute_depcheck(){
  if ! depcheck --config=${DEPCHECK_PATH}; then
    exit 1
  fi
}

execute_audit(){
  if ! pnpm audit; then
    exit 1
  fi
}

execute_jest(){
  PARAMS="$*"
  if ! node $JEST --logHeapUsage $PARAMS; then
    exit 1
  fi
}

execute_usage(){
  echo ""
  echo "Usage:  $0 [OPTIONS]"
  echo ""
  echo "Provide a handler for common package.json actions"
  echo ""
  echo "Options:"
  echo "  --clean                     cleans: ${DIST_PATH} and ${COVERAGE_PATH}"
  echo "  --build                     execute '--clean' and build application"
  echo "  --lint                      execute check application lint"
  echo "  --check                     check application 'lint' 'depcheck' 'audit'"
  echo "  --test-unit                 run unit tests and generate application coverage"
  echo "  --test-integration          run integration tests"
  echo "  --usage                     describe available commands"
}

while [[ $# -gt 0 ]]; do
  case "$1" in

    --clean)
          execute_clean
          break
      ;;

    --build)
        execute_clean
        execute_build "${TS_CONFIG_BUILD_PATH}"
        break
    ;;

    --lint)
        execute_lint
        break
    ;;

    --check)
        execute_lint
        execute_depcheck
        execute_audit
        break
    ;;

    --test-unit)
      export TZ=UTC
      export EXECUTE_FROM_CMD=1

      execute_clean
      execute_build "${TS_CONFIG_PATH}"
      execute_jest "--projects ${TEST_UNIT_PATH}" "--coverage"
      break
    ;;

  --test-integration)
      export TZ=UTC
      export EXECUTE_FROM_CMD=1

      execute_clean
      execute_build "${TS_CONFIG_PATH}"
      execute_jest "--projects ${TEST_INTEGRATION_PATH}" "--runInBand"
      break
    ;;

    --usage)
        execute_usage
        break
    ;;

    *)
      execute_usage
      break
    ;;
  esac
done