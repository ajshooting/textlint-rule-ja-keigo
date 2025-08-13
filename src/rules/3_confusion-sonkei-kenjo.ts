import { tokenizeText } from "../util/kuromoji-loader";
import { KENJOU_VERBS_I } from "../util/keigo-helper";
import type { TextlintRuleModule } from "@textlint/types";

const reporter: TextlintRuleModule = (context) => {
    const { Syntax, RuleError, report, getSource } = context;
    return {
        async [Syntax.Str](node) {
            const text = getSource(node);
            const tokens = await tokenizeText(text);

            for (let i = 0; i < tokens.length - 2; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                const token3 = tokens[i + 2];

                // [謙譲語Iの動詞] + て + ください
                if (
                    token1.pos === "動詞" &&
                    KENJOU_VERBS_I.includes(token1.basic_form) &&
                    token2.surface_form === "て" &&
                    token3.basic_form === "くださる"
                ) {
                    const original = token1.surface_form + token2.surface_form + token3.surface_form;
                    const ruleError = new RuleError(`尊敬語と謙譲語の混同です。謙譲語「${token1.basic_form}」と尊敬表現「くださる」は一緒に使えません。「お聞きください」や「お尋ねください」などが適切です。`, {
                        index: token1.word_position - 1
                    });
                    report(node, ruleError);
                }
            }
        }
    };
};

export default reporter;
