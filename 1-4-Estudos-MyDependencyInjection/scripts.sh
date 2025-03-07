#!/bin/bash -e

unset TZ
unset NODE_ENV

unset BASE_PATH

DIST=dist
BASE_PATH="$(dirname $0)"
DIST_PATH="${BASE_PATH}/${DIST}"
TSCONFIG="${BASE_PATH}/tsconfig.json"

ARGUMENT_LIST=(
    "build"
)
LONG_OPTS=$(printf ",%s" "${ARGUMENT_LIST[@]}")
OPTS=$(getopt \
  --longoptions "$(printf "%s," "${LONG_OPTS:1}")" \
  --name "${BASE_PATH}" \
  --options "" \
  -- "$@"
)

execute_build() {
    rimraf "${DIST_PATH}"
    pnpm eslint .
    tsc -p "$TSCONFIG"
}

execute_usage() {
    echo ""
    echo "Usage:  $0 [OPTIONS]"
    echo ""
    echo "Provide a handler for common package.json actions"
    echo ""
    echo "Options:"
    echo "  --build                     builds application"
    echo ""
}

eval set --"$OPTS"

while [[ $# -gt 0 ]]; do
    case "$1" in

        --build)
            execute_build
            shift 2
            break
        ;;

        *)
            execute_usage
            break
        ;;
    esac
done
