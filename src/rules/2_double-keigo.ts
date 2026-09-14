
import { tokenizeText } from "../util/kuromoji-loader";
import type { TextlintRuleModule } from "@textlint/types";
import { SONKEI_VERBS, KENJOU_VERBS_I, KEISHOU_WORDS } from "../util/keigo-helper";

import { IpadicFeatures } from "kuromoji";

const reporter: TextlintRuleModule = (context) => {
    const { Syntax, RuleError, report, getSource } = context;

    return {
        async [Syntax.Str](node) {
            const text = getSource(node);
            const tokens = await tokenizeText(text);

            for (let i = 0; i < tokens.length - 1; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];

                // パターン1: お(ご)〜になられる
                if (i < tokens.length - 4) {
                    const token3 = tokens[i + 2];
                    const token4 = tokens[i + 3];
                    const token5 = tokens[i + 4];
                    // お 帰り に なら れる
                    // ご覧 に なら れる
                    if ((
                        (token1.surface_form === "お" || token1.surface_form === "ご") &&
                        (token2.pos === "名詞" || token2.pos === "動詞") &&
                        token3.surface_form === "に" &&
                        token4.basic_form === "なる" &&
                        token5.basic_form === "れる" && token5.pos === "動詞"
                    ) || (
                            token1.pos === "名詞" && (token1.surface_form.startsWith("お") || token1.surface_form.startsWith("ご")) &&
                            token2.surface_form === "に" &&
                            token3.basic_form === "なる" &&
                            token4.basic_form === "れる" && token4.pos === "動詞"
                        )
                    ) {
                        const original = tokens.slice(i, i + 5).map((t: IpadicFeatures) => t.surface_form).join(""); // お読みになられる
                        // const suggested1 = token1.surface_form + token2.surface_form + "になる"; // お読みになる
                        // const suggested2 =  // 読まれる
                        // 「${suggested1}」か「${token2.basic_form}+れる」が適切です。
                        const ruleError = new RuleError(`二重敬語です。「お〜になる」と「〜れる」が重複しています。`, {
                            index: token1.word_position - 1
                        });
                        report(node, ruleError);
                        i += 4;
                        continue;
                    }
                }


                // パターン2: 謙譲語 + させていただく
                if (i < tokens.length - 4) {
                    const token3 = tokens[i + 2];
                    const token4 = tokens[i + 3];
                    const token5 = tokens[i + 4];
                    // [存じ上げ] させ(させる) て いただく/頂く
                    // [いただか] せ(せる) て いただく/頂く
                    // [拝見] さ(する) せ(せる) て いただく/頂く 
                    if (
                        KENJOU_VERBS_I.includes(token1.basic_form) && (
                            (
                                token2.pos === "動詞" && (token2.basic_form === "させる" || token2.basic_form === "せる") &&
                                token3.pos === "助詞" && token3.surface_form === "て" &&
                                token4.pos === "動詞" && (token4.basic_form === "いただく" || token4.basic_form === "頂く")
                            ) || (
                                token2.pos === "動詞" && token2.basic_form === "する" &&
                                token3.pos === "動詞" && token3.basic_form === "せる" &&
                                token4.pos === "助詞" && token4.surface_form === "て" &&
                                token5.pos === "動詞" && (token5.basic_form === "いただく" || token5.basic_form === "頂く")
                            )
                        )
                    ) {
                        const endIndex = (token4.pos === "動詞" && (token4.basic_form === "いただく" || token4.basic_form === "頂く")) ? i + 4 : i + 5;
                        const original = tokens.slice(i, endIndex).map((t: IpadicFeatures) => t.surface_form).join("");
                        const suggested = token1.basic_form;
                        const ruleError = new RuleError(`二重敬語です。謙譲語「${token1.basic_form}」と「させていただく」が重複しています。「${suggested}(+する)」が適切です。`, {
                            index: token1.word_position - 1
                        });
                        report(node, ruleError);
                    }
                }


                // パターン3: [尊敬動詞] + 「れる」(尊敬動詞が「お/ご〜する」でない場合)
                if (
                    SONKEI_VERBS.includes(token1.basic_form) &&
                    ((token2.pos === "助動詞" || token2.pos === "動詞") && token2.basic_form === "れる")
                ) {
                    const original = token1.surface_form + token2.surface_form;
                    const ruleError = new RuleError(`二重敬語です。尊敬語「${token1.basic_form}」と尊敬の助動詞「れる」が重複しています。「${token1.basic_form}」のまま、もしくは「おっしゃられる->言われる」などが適切です。`, {
                        index: token1.word_position - 1
                    });
                    report(node, ruleError);
                }


                // パターン4: 敬称 + 様（語彙は util/keigo-helper で管理）
                if (
                    KEISHOU_WORDS.some(keishou => token1.surface_form.includes(keishou)) &&
                    token2 && (token2.surface_form === "様" || token2.surface_form === "さま" || token2.surface_form === "殿")
                ) {
                    const ruleError = new RuleError(`二重敬語です。「${token1.surface_form}」はすでに敬称なので「様」は不要です。「${token1.surface_form}」または「お名前＋様」が適切です。`, {
                        index: token1.word_position - 1
                    });
                    report(node, ruleError);
                }


                // パターン5: 各位 + 様
                if (
                    token1.surface_form === "各位" &&
                    token2 && (token2.surface_form === "様" || token2.surface_form === "さま")
                ) {
                    const ruleError = new RuleError(`二重敬語です。「各位」はすでに敬語なので「様」は不要です。「各位」のみが適切です。`, {
                        index: token1.word_position - 1
                    });
                    report(node, ruleError);

                }

                // 「皆様各位」パターン
                if (
                    (token1.surface_form === "皆様" || token1.surface_form === "皆さま") &&
                    token2 && token2.surface_form === "各位"
                ) {
                    const ruleError = new RuleError(`二重敬語です。「皆様」と「各位」が重複しています。「皆様」または「各位」のいずれかが適切です。`, {
                        index: token1.word_position - 1
                    });
                    report(node, ruleError);
                }
            }
        }
    };
};

export default reporter;
