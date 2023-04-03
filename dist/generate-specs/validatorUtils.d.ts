import { Tsoa } from '@tsoa/runtime';
import * as ts from 'typescript';
export declare function getParameterValidators(parameter: ts.ParameterDeclaration, parameterName: string): Tsoa.Validators;
export declare function getPropertyValidators(property: ts.PropertyDeclaration | ts.TypeAliasDeclaration | ts.PropertySignature | ts.ParameterDeclaration): Tsoa.Validators | undefined;
