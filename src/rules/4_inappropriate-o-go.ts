import { getTokenizer } from "../util/kuromoji-loader";
import { MY_SIDE_WORDS, HONORIFIC_PREFIXES, RESPECTFUL_NOUN_STEMS } from "../util/keigo-helper";
import type { TextlintRuleModule } from "@textlint/types";

// 語彙定義は util/keigo-helper で集約管理

const reporter: TextlintRuleModule = (context) => {
    const { Syntax, RuleError, report, getSource } = context;
    return {
        async [Syntax.Str](node) {
            const text = getSource(node);
            const tokenizer = await getTokenizer();
            const tokens = tokenizer.tokenize(text);

            for (let i = 0; i < tokens.length; i++) {
                const t = tokens[i];

                // 自分側キーワードの後に「の」が続くパターン（任意）
                if (MY_SIDE_WORDS.includes(t.surface_form)) {
                    let j = i + 1;
                    if (j < tokens.length && tokens[j].surface_form === "の") {
                        j += 1;
                    }
                    // 接頭詞「お/ご」+ 名詞（語幹）
                    if (
                        j + 1 < tokens.length &&
                        tokens[j].pos === "接頭詞" && (tokens[j].surface_form === "お" || tokens[j].surface_form === "ご" || tokens[j].surface_form === "御") &&
                        tokens[j + 1].pos === "名詞" && RESPECTFUL_NOUN_STEMS.includes(tokens[j + 1].surface_form)
                    ) {
                        const phrase = tokens.slice(i, j + 2).map(tk => tk.surface_form).join("");
                        const ruleError = new RuleError(`自分側のことに尊敬語「${tokens[j].surface_form}${tokens[j + 1].surface_form}」を使っています。謙譲語「所存」「意向」などを使うか、尊敬語を使わない表現を検討してください。`, {
                            index: t.word_position - 1
                        });
                        report(node, ruleError);
                    }
                }
            }
        }
    };
};

export default reporter;
