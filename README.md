# Estudos Typescript e afins

## Comandos básicos:

* npm list -g (Listar os pacotes globais intalados)

* npm list (Listar os pacotes instalados do projeto)
 npm install -g typescript. (Instalar globalmente o typescript)

* npm install typescript --save-dev (Instalar somente no projeto como uma dependência de desenvolvimento)
  

* npx tsc --init (Inicializa o arquivo `tsconfig.json`)

* tpx tsc (Transcompilar o projeto para JS)
  
* tsc --module commonjs main.ts (Compilar módulos, o compilador gerará o código apropriado para os sistemas de carregamento de módulos do Node.js (CommonJS), require.js (AMD), UMD, SystemJS ou módulos nativos ECMAScript 2015 (ES6). )

* tpx tsc --watch (Fica monitorando alterações nos arquivos TS em real time e gerando seus respectivos JS)
  
* npm install {PACKAGE} Salva como dependência do projeto
  
* npp install --save-dev {PACKAGE} Salvar como dependência de desenvolvimento do projeto




## TSCONFIG.json úteis

* "outDir": "./build" /* Specify an output folder for all emitted files. */
* "target": "es2016" /* Set the JavaScript language version for emitted JavaScript and include compatible library 
* "noImplicitAny": true /* Enable error reporting for expressions and declarations with an implied 'any' type. */

## Configurações para Debug de aplicações

1. Configurar debug no vscode, conforme exemplo abaixo:
```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Cursos-CriandoAPI-RESTful-TypeScript-Node-Mongo",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "${workspaceFolder}\\Cursos-CriandoAPI-RESTful-TypeScript-Node-Mongo\\program.ts",
            "runtimeArgs": [
                "-r", "ts-node/register",
                "-r", "tsconfig-paths/register"
            ],
            "console": "integratedTerminal",
            "outFiles": [
                "${workspaceFolder}/**/*.js"
            ]
        },
        // Maneira mais recomendada, utilizando ts-node-dev
        {
            "port": 9229,
            "name": "Attach by ProcessId",
            "request": "attach",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "type": "node"
        }
    ]
}
```

2. Configurar auto atach para `always`:
![Debug Alto Attach](/images/debug_auto_attach.png)

3. Instalar dependência de desenvolvimento:
   
   `npm install ts-node --save-dev`

   `npm install ts-node-dev --save-dev`

4. Realizar configuração para executação do script em debug com hot-reload:

    ```json
    {
        "scripts": {
            "start-dev": "ts-node-dev --respawn --transpile-only --inspect=9229 --project tsconfig.json {{ENTRY_POINT_FILE}}",
        }
    }
    ```


## Links Úteis:

[https://stackoverflow.com/questions/5926672/where-does-npm-install-packages](https://stackoverflow.com/questions/5926672/where-does-npm-install-packages)

## Tipagem no typescrispt

![TS_TYPES](./images/ts_types.png)

![TS_ASSERT_TYPES](./images/ts_types_asserttype.png)

## Modulos no typescript

![TS_COMPILAR_MODULOS](./images/ts_compilar_modulos.png)
![TS_COMO_IMPORTAR_BIBLIOTECAS](./images/ts_como_importar_bibliotecas.png)
