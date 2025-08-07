import { getTokenizer } from "../util/kuromoji-loader";
import type { TextlintRuleModule } from "@textlint/types";

const reporter: TextlintRuleModule = (context) => {
    const { Syntax, RuleError, report, getSource } = context;
    return {
        async [Syntax.Str](node) {
            const text = getSource(node);
            const tokenizer = await getTokenizer();
            const tokens = tokenizer.tokenize(text);

            for (let i = 0; i < tokens.length - 2; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                const token3 = tokens[i + 2];

                // パターン1: ご/お〜される
                if (
                    (token1.surface_form === "ご" || token1.surface_form === "お") &&
                    token2.pos === "名詞" && token2.pos_detail_1 === "サ変接続" &&
                    token3.basic_form === "される"
                ) {
                    const original = token1.surface_form + token2.surface_form + token3.surface_form;
                    const suggested = `${token1.surface_form}${token2.surface_form}になる`;
                    const ruleError = new RuleError(`「ご/お〜される」は不適切な敬語です。「${suggested}」や「${token2.surface_form}なさる」などが適切です。`, {
                        index: token1.word_position - 1
                    });
                    report(node, ruleError);
                }

                // パターン2: 「させていただく」の濫用
                if (i < tokens.length - 1 && tokens[i].basic_form === "させていただく") {
                     const ruleError = new RuleError(`「させていただく」は、相手の許可や恩恵を受ける文脈で使われます。文脈によっては冗長な表現と受け取られることがあります。「〜いたします」や「〜ます」など、より簡潔な表現もご検討ください。`, {
                        index: tokens[i].word_position - 1
                    });
                    report(node, ruleError);
                }
            }
        }
    };
};

export default reporter;