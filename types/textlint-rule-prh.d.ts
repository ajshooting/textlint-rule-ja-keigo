declare module "textlint-rule-prh" {
    const prh: {
        linter: (context: any, options?: any) => any;
        fixer: (context: any, options?: any) => any;
    };
    export default prh;
}
