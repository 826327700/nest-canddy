"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmdSelect = void 0;
const { Prompt, Select } = require('enquirer');
class CmdSelect extends Select {
    constructor(options = {}) {
        super(options);
        this.cursorHide();
    }
    changeChoices(choices) {
        this.choices = [];
        this.limit = this.choices.length;
        for (const element of choices) {
            this.addChoice(element);
        }
        setTimeout(() => {
            this.first();
        }, 0);
    }
    right() {
        if (this.options.onRight) {
            this.options.onRight(this.index);
        }
    }
    left() {
        if (this.options.onLeft) {
            this.options.onLeft(this.index);
        }
    }
}
exports.CmdSelect = CmdSelect;
//# sourceMappingURL=enquirer.js.map