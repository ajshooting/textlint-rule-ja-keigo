import { getTokenizer } from "../util/kuromoji-loader";
import { MY_SIDE_WORDS } from "../util/keigo-helper";
import type { TextlintRuleModule } from "@textlint/types";

// 尊敬の意味合いが強い「お・御」が付く名詞
const RESPECTFUL_NOUNS = ["お考え", "御考え", "お気持ち", "御気持ち"];

const reporter: TextlintRuleModule = (context) => {
    const { Syntax, RuleError, report, getSource } = context;
    return {
        async [Syntax.Str](node) {
            const text = getSource(node);
            const tokenizer = await getTokenizer();
            const tokens = tokenizer.tokenize(text);

            for (let i = 0; i < tokens.length - 1; i++) {
                const currentToken = tokens[i];
                const nextToken = tokens[i + 1];

                if (MY_SIDE_WORDS.includes(currentToken.surface_form)) {
                    const combined = nextToken.surface_form;
                    if (RESPECTFUL_NOUNS.includes(combined)) {
                        const ruleError = new RuleError(`自分側のことに尊敬語「${combined}」を使っています。謙譲語「所存」「意向」などを使うか、尊敬語を使わない表現を検討してください。`, {
                            index: currentToken.word_position - 1
                        });
                        report(node, ruleError);
                    }
                    // 「弊社のお考え」のように助詞を挟む場合
                    if (i < tokens.length - 2 && tokens[i+1].surface_form === 'の' && RESPECTFUL_NOUNS.includes(tokens[i+2].surface_form)) {
                         const ruleError = new RuleError(`自分側のことに尊敬語「${tokens[i+2].surface_form}」を使っています。謙譲語「所存」「意向」などを使うか、尊敬語を使わない表現を検討してください。`, {
                            index: currentToken.word_position - 1
                        });
                        report(node, ruleError);
                    }
                }
            }
        }
    };
};

export default reporter;
