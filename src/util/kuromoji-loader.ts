import * as kuromoji from "kuromoji";
import { IpadicFeatures } from "kuromoji";
import path from "path";

let tokenizer: kuromoji.Tokenizer<IpadicFeatures> | null = null;

export const getTokenizer = (): Promise<kuromoji.Tokenizer<IpadicFeatures>> => {
    return new Promise((resolve, reject) => {
        if (tokenizer) {
            return resolve(tokenizer);
        }

        try {
            // pnpmでの辞書ファイルパスを正しく解決
            const kuromojiPath = require.resolve("kuromoji");
            // kuromojiPath: .../kuromoji/src/kuromoji.js
            // dictPath: .../kuromoji/dict
            const kuromojiRoot = path.dirname(path.dirname(kuromojiPath));
            const dicPath = path.join(kuromojiRoot, "dict");

            kuromoji.builder({ dicPath }).build((err, builtTokenizer) => {
                if (err) {
                    return reject(err);
                }
                tokenizer = builtTokenizer;
                resolve(tokenizer);
            });
        } catch (error) {
            reject(error);
        }
    });
};
