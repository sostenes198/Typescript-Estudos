import { connection, statusConnection } from './connection';
import getStatusApp, { resetarBanco } from './getstatus';

function acessarSistema() {
    connection({ ip: "123", name: "ASD" });
}

acessarSistema();
statusConnection();
getStatusApp();
resetarBanco();