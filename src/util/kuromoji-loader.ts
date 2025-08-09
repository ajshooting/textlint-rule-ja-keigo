import { getTokenizer as getKuromojinTokenizer, tokenize } from "kuromojin";
import { IpadicFeatures } from "kuromoji";

export const getTokenizer = (): Promise<{ tokenize: (text: string) => IpadicFeatures[] }> => {
    return getKuromojinTokenizer().then(tokenizer => ({
        tokenize: (text: string) => tokenizer.tokenize(text) as IpadicFeatures[]
    }));
};

export const tokenizeText = (text: string): Promise<IpadicFeatures[]> => {
    return tokenize(text).then(tokens => tokens as IpadicFeatures[]);
};
