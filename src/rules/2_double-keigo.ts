import { getTokenizer } from "../util/kuromoji-loader";
import type { TextlintRuleModule } from "@textlint/types";

const SONKEI_VERBS = [
    "いらっしゃる", "おっしゃる", "なさる", "くださる", "召し上がる", "ご覧になる"
];

import { IpadicFeatures } from "kuromoji";

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

                // パターン1: 「お[動詞の連用形]になられる」
                if (i < tokens.length - 3) {
                    const token1 = tokens[i];
                    const token2 = tokens[i + 1];
                    const token3 = tokens[i + 2];
                    const token4 = tokens[i + 3];
                    if (
                        token1.surface_form === "お" &&
                        token2.pos === "動詞" && token2.pos_detail_1 === "自立" && token2.conjugated_form === "連用形" &&
                        token3.surface_form === "に" &&
                        token4.basic_form === "なる" && // 基本形で判定
                        i + 4 < tokens.length &&
                        tokens[i + 4].basic_form === "れる" && tokens[i + 4].pos === "助動詞"
                    ) {
                        const original = tokens.slice(i, i + 5).map((t: IpadicFeatures) => t.surface_form).join("");
                        const suggested = tokens.slice(i, i + 4).map((t: IpadicFeatures) => t.surface_form).join("");
                        const ruleError = new RuleError(`二重敬語です。「お〜になる」と「〜れる」が重複しています。「${suggested}」が適切です。`, {
                            index: token1.word_position - 1
                        });
                        report(node, ruleError);
                        // このパターンにマッチしたら次のトークンへ
                        i += 4;
                        continue;
                    }
                }

                // パターン2: [尊敬動詞]れる・られる
                if (
                    currentToken.pos === "動詞" &&
                    SONKEI_VERBS.includes(currentToken.basic_form) &&
                    nextToken.pos === "助動詞" &&
                    nextToken.basic_form === "れる"
                ) {
                    const original = currentToken.surface_form + nextToken.surface_form;
                    const ruleError = new RuleError(`二重敬語です。尊敬語「${currentToken.basic_form}」と尊敬の助動詞「れる」が重複しています。「${currentToken.basic_form}」のまま、あるいは「${currentToken.basic_form}になる」などが適切です。`, {
                        index: currentToken.word_position - 1
                    });
                    report(node, ruleError);
                }
            }
        }
    };
};

export default reporter;
