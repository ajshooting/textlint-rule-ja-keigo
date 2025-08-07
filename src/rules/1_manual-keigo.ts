import prh from "textlint-rule-prh";
import path from "path";
import type { TextlintRuleModule } from "@textlint/types";

const reporter: TextlintRuleModule = (context, options = {}) => {
    const ruleFile = path.join(__dirname, "..", "..", "prh.yml");
    const mergedOptions = {
        ...options,
        rulePaths: [ruleFile]
    };
    return prh.linter(context, mergedOptions);
};

export = reporter;
