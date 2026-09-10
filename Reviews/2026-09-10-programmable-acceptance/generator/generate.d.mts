export function validate(declarations:unknown[]):void;
export function generate(check?:boolean):void;
export function parseDeclaration(source:string):unknown;
export function renderDeclarations(declarations:unknown[]):Map<string,string>;
