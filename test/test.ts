import { TextlintKernel } from "@textlint/kernel";
import assert from "assert";

// ルールを個別にインポート
import manualKeigoRule from "../src/rules/1_manual-keigo";
import doubleKeigoRule from "../src/rules/2_double-keigo";
import confusionRule from "../src/rules/3_confusion-sonkei-kenjo";
import inappropriateOGoRule from "../src/rules/4_inappropriate-o-go";
import misuseVerbRule from "../src/rules/5_misuse-of-verb-form";
import type { TextlintRuleModule } from "@textlint/types";

import textPlugin from "@textlint/textlint-plugin-text";

describe("textlint-rule-ja-keigo", () => {
    const kernel = new TextlintKernel();

    const lintTextForRule = (text: string, rule: TextlintRuleModule, ruleOptions = {}) => {
        const options = {
            filePath: "/dummy.txt",
            ext: ".txt",
            plugins: [{ pluginId: "text", plugin: textPlugin }],
            rules: [{ ruleId: "test-rule", rule, options: ruleOptions }]
        };
        return kernel.lintText(text, options);
    };

    describe("1_manual-keigo", () => {
        it("should report manual keigo errors", async () => {
            // prhパターンに正確に一致するテキストを使用
            const { messages } = await lintTextForRule("こちら、商品になります", manualKeigoRule, {});
            assert.strictEqual(messages.length, 1);
            assert.ok(messages[0].message.includes("なります"));
        });
    });

    describe("2_double-keigo", () => {
        it("should report double keigo errors", async () => {
            const { messages } = await lintTextForRule("先生がお読みになられる。", doubleKeigoRule);
            assert.strictEqual(messages.length, 1);
            assert.ok(messages[0].message.includes("二重敬語"));
        });

        it("should report 皆様各位 but not 皆様 alone", async () => {
            const withoutEach = await lintTextForRule("皆様", doubleKeigoRule);
            const withEach = await lintTextForRule("皆様各位", doubleKeigoRule);

            assert.strictEqual(withoutEach.messages.length, 0);
            assert.strictEqual(withEach.messages.length, 1);
            assert.ok(withEach.messages[0].message.includes("二重敬語"));
        });
    });

    describe("3_confusion-sonkei-kenjo", () => {
        it("should report confusion errors", async () => {
            const { messages } = await lintTextForRule("担当者に伺ってください。", confusionRule);
            assert.strictEqual(messages.length, 1);
            assert.ok(messages[0].message.includes("尊敬語と謙譲語の混同"));
        });
    });

    describe("4_inappropriate-o-go", () => {
        it("should report inappropriate o/go errors", async () => {
            const { messages } = await lintTextForRule("弊社の御考え", inappropriateOGoRule);
            assert.strictEqual(messages.length, 1);
            assert.ok(messages[0].message.includes("尊敬語"));
        });
    });

    describe("5_misuse-of-verb-form", () => {
        it("should report misuse of verb errors", async () => {
            const { messages } = await lintTextForRule("御利用される場合は、", misuseVerbRule);
            assert.strictEqual(messages.length, 1);
            assert.ok(messages[0].message.includes("ご/お/御〜される"));
        });
    });
});
