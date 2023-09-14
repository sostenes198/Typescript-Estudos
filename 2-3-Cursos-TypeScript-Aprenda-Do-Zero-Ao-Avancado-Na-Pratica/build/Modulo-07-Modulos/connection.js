"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusConnection = exports.connection = void 0;
function connection(info) {
    console.log(`Realizando conexão ${info.ip}`);
    return true;
}
exports.connection = connection;
function statusConnection() {
    console.log("SERVIDOR FUNCIONANDO 100%");
}
exports.statusConnection = statusConnection;
