// import { Container, interfaces } from 'inversify';
// import 'reflect-metadata';
//
// export type PostConfigureAction = (container: Container) => void;
//
// export class InternalContainer implements Disposable {
//     private _container: Container;
//
//     constructor(container: Container) {
//         this._container = container;
//     }
//
//     [Symbol.dispose](): void {
//         this.Remove();
//     }
//
//     get Container(): Container {
//         return this._container;
//     }
//
//     private Remove(): void {
//         if (this._container) {
//             this._container.unbindAll();
//             this._container = null!;
//         }
//     }
// }
//
// export class AppContainer {
//     private constructor() {}
//
//     private static _containerOptions: interfaces.ContainerOptions;
//
//     private static _globalContainer: InternalContainer;
//
//     public static _postConfigureContainerActions: PostConfigureAction[] = [];
//
//     public static CreateGlobalContainer(fnConfigure: PostConfigureAction, containerOptions?: interfaces.ContainerOptions) {
//         if (!this._globalContainer) {
//             this._postConfigureContainerActions.push(fnConfigure);
//             this._containerOptions = containerOptions ?? {};
//             const container = new Container(this._containerOptions);
//             this._globalContainer = new InternalContainer(container);
//             this._postConfigureContainerActions.forEach((action) => action(this._globalContainer.Container));
//         }
//     }
//
//     public static GlobalContainer(): Container {
//         if (!this._globalContainer) throw new Error('Global Container not configured');
//         return this._globalContainer.Container;
//     }
//
//     public static CreateScope(): InternalContainer {
//         const container = this.GlobalContainer().createChild(this._containerOptions);
//         this._postConfigureContainerActions.forEach((action) => action(container));
//         return new InternalContainer(container);
//     }
//
//     public static PostConfigure(fn: PostConfigureAction): AppContainer {
//         this._postConfigureContainerActions.push(fn);
//         return this;
//     }
//
//     public static ResetPostConfigureActions(): void {
//         this._postConfigureContainerActions = [];
//     }
// }
