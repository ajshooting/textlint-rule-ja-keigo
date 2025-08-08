import prh from "textlint-rule-prh";
import path from "path";
import fs from "fs";
import type { TextlintRuleModule } from "@textlint/types";

const resolvePrhPath = () => {
    const candidates = [
        path.resolve(__dirname, "..", "..", "prh.yml"), // src 実行時
        path.resolve(__dirname, "..", "..", "..", "prh.yml"), // dist 実行時（dist/rules -> pkg root）
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return path.resolve(process.cwd(), "prh.yml");
};

const reporter: TextlintRuleModule = (context, options = {}) => {
    const ruleFile = resolvePrhPath();
    const mergedOptions = {
        ...options,
        rulePaths: [ruleFile]
    };
    return prh.linter(context, mergedOptions);
};

export = reporter;
