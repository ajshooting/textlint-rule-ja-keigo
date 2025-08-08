
import { getTokenizer } from "../util/kuromoji-loader";
import type { TextlintRuleModule } from "@textlint/types";
import { SONKEI_VERBS, KENJOU_VERBS_I } from "../util/keigo-helper";

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

                // パターン1: お(ご)〜になられる
                if (i < tokens.length - 3) {
                    const token1 = tokens[i];
                    const token2 = tokens[i + 1];
                    const token3 = tokens[i + 2];
                    const token4 = tokens[i + 3];
                    // お 帰り に なら れる
                    // ご覧 に なら れる
                    if ((
                        (token1.surface_form === "お" || token1.surface_form === "ご") &&
                        token2.pos === "名詞" &&
                        token3.surface_form === "に" &&
                        token4.basic_form === "なる" &&
                        i + 4 < tokens.length &&
                        tokens[i + 4].basic_form === "れる" && tokens[i + 4].pos === "動詞"
                    ) || (
                            token1.pos === "名詞" && (token1.surface_form.startsWith("お") || token1.surface_form.startsWith("ご")) &&
                            token2.surface_form === "に" &&
                            token3.basic_form === "なる" &&
                            token4.basic_form === "れる" && token4.pos === "動詞"
                        )
                    ) {
                        const original = tokens.slice(i, i + 5).map((t: IpadicFeatures) => t.surface_form).join(""); // お読みになられる
                        // ここで活用形変換できれば提案もできる
                        // const suggested1 = tokens.slice(i, i + 4).map((t: IpadicFeatures) => t.surface_form).join(""); // お読みになる
                        // const suggested2 =  // 読まれる
                        const ruleError = new RuleError(`二重敬語です。「お〜になる」と「〜れる」が重複しています。`, {
                            index: token1.word_position - 1
                        });
                        report(node, ruleError);
                        // このパターンにマッチしたら次のトークンへ
                        i += 4;
                        continue;
                    }
                }


                // パターン2: [尊敬動詞] + 「れる」
                if (
                    currentToken.pos === "動詞" &&
                    SONKEI_VERBS.includes(currentToken.basic_form) &&
                    ((nextToken.pos === "助動詞" || nextToken.pos === "動詞") &&
                        nextToken.basic_form === "れる")
                ) {
                    const original = currentToken.surface_form + nextToken.surface_form;
                    const ruleError = new RuleError(`二重敬語です。尊敬語「${currentToken.basic_form}」と尊敬の助動詞「れる」が重複しています。「${currentToken.basic_form}」のまま、もしくは「おっしゃられる->言われる」などが適切です。`, {
                        index: currentToken.word_position - 1
                    });
                    report(node, ruleError);
                }


                // パターン3: 謙譲語 + させていただく
                // 「申し上げさせていただく」「拝見させていただく」など
                if (
                    currentToken.pos === "動詞" &&
                    KENJOU_VERBS_I.includes(currentToken.basic_form)
                ) {
                    // 形態素: [させる(動詞/基本形=させる)] + [て(助詞:接続助詞)](任意) + [いただく/頂く(動詞/基本形)]
                    for (let j = i + 1; j < Math.min(i + 6, tokens.length); j++) {
                        const causative = tokens[j];
                        if (causative.pos === "動詞" && causative.basic_form === "させる") {
                            let k = j + 1;
                            // 任意の接続助詞「て」
                            if (
                                k < tokens.length &&
                                tokens[k].surface_form === "て" &&
                                tokens[k].pos === "助詞"
                            ) {
                                k += 1;
                            }

                            if (k < tokens.length) {
                                const itadaku = tokens[k];
                                const isItadaku = (
                                    itadaku.pos === "動詞" &&
                                    (itadaku.basic_form === "いただく" || itadaku.basic_form === "頂く")
                                );

                                if (isItadaku) {
                                    const original = tokens.slice(i, k + 1).map(t => t.surface_form).join("");
                                    const suggested = tokens.slice(i, j).map(t => t.surface_form).join("");
                                    const ruleError = new RuleError(`二重敬語です。謙譲語「${currentToken.basic_form}」と「させていただく」が重複しています。「${suggested}」が適切です。`, {
                                        index: currentToken.word_position - 1
                                    });
                                    report(node, ruleError);
                                    break;
                                }
                            }
                        }
                    }
                }


                // パターン4: 敬称 + 様
                // 敬称のリスト 
                const KEISHOU_WORDS = [
                    "社長", "部長", "課長", "係長", "主任", "先生", "先輩", "お客様", "お客さん",
                    "部長さん", "課長さん", "係長さん", "主任さん", "先生", "お医者さん", "看護師さん"
                ];

                if (KEISHOU_WORDS.some(keishou => currentToken.surface_form.includes(keishou))) {
                    if (nextToken && (nextToken.surface_form === "様" || nextToken.surface_form === "さま")) {
                        const ruleError = new RuleError(`二重敬語です。「${currentToken.surface_form}」はすでに敬称なので「様」は不要です。「${currentToken.surface_form}」または「お名前＋様」が適切です。`, {
                            index: currentToken.word_position - 1
                        });
                        report(node, ruleError);
                    }
                }


                // パターン5: 各位 + 様
                if (currentToken.surface_form === "各位") {
                    // 前後に「様」「さま」がないかチェック
                    if (nextToken && (nextToken.surface_form === "様" || nextToken.surface_form === "さま")) {
                        const ruleError = new RuleError(`二重敬語です。「各位」はすでに敬語なので「様」は不要です。「各位」のみが適切です。`, {
                            index: currentToken.word_position - 1
                        });
                        report(node, ruleError);
                    }
                }

                // 「皆様各位」パターン
                if (currentToken.surface_form === "皆様" || currentToken.surface_form === "皆さま") {
                    if (nextToken && nextToken.surface_form === "各位") {
                        const ruleError = new RuleError(`二重敬語です。「皆様」と「各位」が重複しています。「皆様」または「各位」のいずれかが適切です。`, {
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
