import * as fs from 'fs';
import * as path from 'path';

export class LoaderModule {
    private constructor() {}

    private static _srcDirectory: string = './src';
    private static _entryPointClass: string = 'package.json';
    private static _parentFolder: string = '..';

    private static _modules: Array<any> = [];

    public static async ListModulesSource(): Promise<Array<any>> {
        if (this._modules.length) return this._modules;

        const rootDirectorySource = this.GetRootDirectorySource();
        const modulesFileName = this.ListModulesFileName(rootDirectorySource);
        const parentFolderSourceDirectoryFromLoaderModules = this.GetParentFolderSourceDirectoryFromLoaderModules(modulesFileName);

        this._modules = await this.ImportAllModules(modulesFileName, parentFolderSourceDirectoryFromLoaderModules);

        return this._modules;
    }

    private static GetRootDirectorySource(): string {
        const readFiles = (folder: string) => fs.readdirSync(folder).map((file) => file.toLocaleLowerCase());
        let folder: string = __dirname;
        let filesName: Array<string> = readFiles(folder);
        while (!filesName.includes(this._entryPointClass)) {
            folder = path.resolve(folder, this._parentFolder);
            filesName = readFiles(folder);
        }

        return path.join(folder, this._srcDirectory);
    }

    private static ListModulesFileName(directory: string): Array<string> {
        const modules: Array<string> = [];
        const throughDirectory = (directoryInternal: string) => {
            fs.readdirSync(directoryInternal).forEach((file) => {
                const absolute = path.join(directoryInternal, file);
                if (fs.statSync(absolute).isDirectory()) return throughDirectory(absolute);
                else return modules.push(absolute);
            });
        };
        throughDirectory(directory);

        return modules.map((module) =>
            module
                .replace(directory + '\\', '')
                .replace(/\\/gi, '/')
                .replace('.ts', ''),
        );
    }

    private static GetParentFolderSourceDirectoryFromLoaderModules(modulesFileName: Array<string>): string {
        let currentFolder: string = './';
        const loadModulerFile: string | undefined = modulesFileName.find((t) => path.basename(t) == this.name);

        loadModulerFile!.split('/').reduce(() => (currentFolder += `${this._parentFolder}/`));

        return currentFolder;
    }

    private static async ImportAllModules(modulesFileName: Array<string>, parentFolderSourceDirectoryFromLoaderModules: string): Promise<any> {
        const promiseModulesImported = modulesFileName.map(async (module) => {
            return await import(`${parentFolderSourceDirectoryFromLoaderModules}${module}`);
        });

        return await Promise.all(promiseModulesImported);
    }
}
