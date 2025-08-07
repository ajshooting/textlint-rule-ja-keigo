import manualKeigo from "./rules/1_manual-keigo";
import doubleKeigo from "./rules/2_double-keigo";
import confusionSonkeiKenjo from "./rules/3_confusion-sonkei-kenjo";
import inappropriateOGo from "./rules/4_inappropriate-o-go";
import misuseOfVerbForm from "./rules/5_misuse-of-verb-form";

export = {
    rules: {
        "ja-keigo-manual": manualKeigo,
        "ja-keigo-double": doubleKeigo,
        "ja-keigo-confusion": confusionSonkeiKenjo,
        "ja-keigo-inappropriate-o-go": inappropriateOGo,
        "ja-keigo-misuse-verb": misuseOfVerbForm
    },
    rulesConfig: {
        "ja-keigo-manual": true,
        "ja-keigo-double": true,
        "ja-keigo-confusion": true,
        "ja-keigo-inappropriate-o-go": true,
        "ja-keigo-misuse-verb": true
    }
};
