## Comando para gerar build da imagem docker:

`docker build -t estudos-soso/api-node-ts:1.0.0 .`

## Comando para criar e rodar container docker:

`docker run -d -p 5000:3099 estudos-soso/api-node-ts:lates`

## Comando para verificar containers:

`docker ps` Listar containers em execução
`docker ps -a` Lista todos containers

## Docker-Compose

`docker-compose up --force-recreate --build --wait -d`