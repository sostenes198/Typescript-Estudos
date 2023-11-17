#!/bin/bash

# DOCKER COMPOSE EXAMPLE
# unset DOCKER_COMPOSE_PATH_FILE



#DOCKER_COMPOSE_PATH_FILE="test/integration/docker-compose.yml"
#
#execute_up_integration_test_infrastructure(){
#  if ! docker compose -f $DOCKER_COMPOSE_PATH_FILE up -d; then
#    exit 1
#  fi
#}
#
#execute_down_integration_test_infrastructure(){
#  if ! docker compose -f $DOCKER_COMPOSE_PATH_FILE down; then
#    exit 1
#  fi
#}

unset SCRIPT_UP_INFRASTRUCTURE_PATH
unset SCRIPT_DOWN_INFRASTRUCTURE_PATH

SCRIPT_UP_INFRASTRUCTURE_PATH="./test/integration/integration-test-infrastructure-up.sh"
SCRIPT_DOWN_INFRASTRUCTURE_PATH="./test/integration/integration-test-infrastructure-down.sh"


execute_up_integration_test_infrastructure(){
  if ! $SCRIPT_UP_INFRASTRUCTURE_PATH; then
    exit 1
  fi
}

execute_down_integration_test_infrastructure(){
  if ! $SCRIPT_DOWN_INFRASTRUCTURE_PATH; then
    exit 1
  fi
}

execute_usage(){
  echo ""
  echo "Usage"
  echo ""
  echo "Provide script to create and destroy infrastructure to integration tests"
  echo ""
  echo "Options:"
  echo "  --up                     Up infrastructure to integration tests"
  echo "  --down                   Down infrastructure to integration tests"
  echo "  --usage                     describe available commands"
}

while [[ $# -gt 0 ]]; do
  case "$1" in

    --up)
          execute_down_integration_test_infrastructure
          execute_up_integration_test_infrastructure
          break
      ;;

    --down)
        execute_down_integration_test_infrastructure
        break
    ;;

    *)
      execute_usage
      break
    ;;
  esac
done