import { Tsoa } from '@tsoa/runtime';
import { type TypeChecker, type ClassDeclaration, type CompilerOptions } from 'typescript';
export declare class MetadataGenerator {
    private readonly compilerOptions?;
    private readonly ignorePaths?;
    private readonly rootSecurity;
    readonly controllerNodes: ClassDeclaration[];
    readonly typeChecker: TypeChecker;
    private readonly program;
    private referenceTypeMap;
    private circularDependencyResolvers;
    constructor(entryFile: string, compilerOptions?: CompilerOptions | undefined, ignorePaths?: string[] | undefined, controllers?: string[], rootSecurity?: Tsoa.Security[]);
    Generate(): Tsoa.Metadata;
    private setProgramToDynamicControllersFiles;
    private extractNodeFromProgramSourceFiles;
    private checkForMethodSignatureDuplicates;
    private checkForPathParamSignatureDuplicates;
    TypeChecker(): TypeChecker;
    AddReferenceType(referenceType: Tsoa.ReferenceType): void;
    GetReferenceType(refName: string): Tsoa.ReferenceType;
    OnFinish(callback: (referenceTypes: Tsoa.ReferenceTypeMap) => void): void;
    private buildControllers;
}
