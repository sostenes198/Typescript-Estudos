import 'reflect-metadata';
import { HttpMethod } from '../../Http/Enum/HttpMethod';
import { MetadataControllerKey } from './Enum/MetadataControllerKey';
import { v4 as uuidV4 } from 'uuid';

export function HttpController(path: string) {
    if (!path) throw new Error(`path is required`);

    path = _setDefaultBar(path);
    return function (constructor: new (...param: any[]) => object) {
        Reflect.defineMetadata(MetadataControllerKey.CONTROLLER_ID, uuidV4(), constructor);
        Reflect.defineMetadata(MetadataControllerKey.CONTROLLER_PATH, path, constructor);
    };
}

export function HttpGet(path: string) {
    return _definedControllerMethods(HttpMethod.GET, path);
}

export function HttpPost(path: string) {
    return _definedControllerMethods(HttpMethod.POST, path);
}

export function HttpPut(path: string) {
    return _definedControllerMethods(HttpMethod.PUT, path);
}

export function HttpDelete(path: string) {
    return _definedControllerMethods(HttpMethod.DELETE, path);
}

function _setDefaultBar(path: string) {
    if (path[0] != '/') path = '/' + path;

    return path;
}

function _definedControllerMethods(method: HttpMethod, path: string) {
    path = _setDefaultBar(path);
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata(MetadataControllerKey.CONTROLLER_METHOD, method, target, propertyKey);
        Reflect.defineMetadata(MetadataControllerKey.CONTROLLER_METHOD_PATH, path, target, propertyKey);
    };
}
